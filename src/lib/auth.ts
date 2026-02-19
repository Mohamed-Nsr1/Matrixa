/**
 * Authentication Library
 * 
 * Handles JWT token generation, validation, and user authentication.
 * Uses bcrypt for password hashing and jose for JWT operations.
 * 
 * CRITICAL: This file handles all security-sensitive operations.
 * Modify with extreme caution.
 */

import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@prisma/client'
import { generateAccessToken, generateRefreshToken, verifyAccessToken, getDeviceFingerprint } from './auth-edge'
import type { JwtPayload } from './auth-edge'

// Re-export for convenience
export { generateAccessToken, generateRefreshToken, verifyAccessToken, getDeviceFingerprint, generateAccessToken as signAccessToken, generateRefreshToken as signRefreshToken }
export type { JwtPayload }

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7 // 7 days

// Auth response interface
export interface AuthResponse {
  success: boolean
  user?: Omit<User, 'passwordHash'>
  error?: string
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create session for user
 */
export async function createSession(
  userId: string,
  deviceId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const refreshToken = await generateRefreshToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

  // Invalidate old sessions for this device
  await prisma.session.deleteMany({
    where: { userId, deviceFingerprint: deviceId }
  })

  // Create new session
  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      deviceFingerprint: deviceId,
      userAgent,
      ipAddress,
      expiresAt
    }
  })

  // Update user's device fingerprint and last active
  await prisma.user.update({
    where: { id: userId },
    data: {
      deviceFingerprint: deviceId,
      lastActiveAt: new Date()
    }
  })

  return refreshToken
}

/**
 * Verify session by refresh token
 */
export async function verifySession(refreshToken: string): Promise<string | null> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.userId
}

/**
 * Delete session (logout)
 */
export async function deleteSession(refreshToken: string): Promise<void> {
  await prisma.session.delete({
    where: { refreshToken }
  }).catch(() => {}) // Ignore if session doesn't exist
}

/**
 * Set auth cookies
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  useSecure: boolean = false
): Promise<void> {
  const cookieStore = await cookies()
  
  // Access token cookie
  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/'
  })

  // Refresh token cookie
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })
}

/**
 * Clear auth cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
  cookieStore.delete('onboardingCompleted')
}

/**
 * Get current user from request
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      return null
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    return user
  } catch {
    return null
  }
}

/**
 * Check if user has valid subscription
 */
export async function hasValidSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['TRIAL', 'ACTIVE'] },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
    }
  })

  return !!subscription
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  return user?.role === 'ADMIN'
}

/**
 * Auth middleware for API routes
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: User) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return handler(user)
}

/**
 * Admin middleware for API routes
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (user: User) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )
  }

  return handler(user)
}
