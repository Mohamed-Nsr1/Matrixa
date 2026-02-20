/**
 * Admin Impersonation API
 * 
 * Allows admins to log in as another user for support purposes.
 * SECURITY: Rate limited, short session duration, fully audited.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiter: 5 impersonations per hour per admin
const impersonationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyGenerator: (request) => {
    // Use admin user ID for rate limiting (passed via header after auth check)
    const adminId = request.headers.get('x-admin-id') || 'unknown'
    return `impersonate:${adminId}`
  }
})

// Impersonation session duration: 1 hour (reduced from 7 days for security)
const IMPERSONATION_SESSION_DURATION_MS = 60 * 60 * 1000 // 1 hour

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Add admin ID to request headers for rate limiting
    const modifiedRequest = new Request(request.url, {
      headers: new Headers(request.headers)
    })
    modifiedRequest.headers.set('x-admin-id', user.id)

    // Check rate limit
    const rateLimitResult = await impersonationRateLimit.check(modifiedRequest as unknown as Parameters<typeof impersonationRateLimit.check>[0])
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Cannot impersonate other admins
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot impersonate other admins' },
        { status: 403 }
      )
    }

    // Create new session (don't delete existing sessions - less disruptive)
    const refreshToken = await generateRefreshToken()
    const deviceFingerprint = `impersonate-${user.id}-${Date.now()}`

    await prisma.session.create({
      data: {
        userId: targetUser.id,
        refreshToken,
        deviceFingerprint,
        userAgent: `Impersonated by admin: ${user.email}`,
        expiresAt: new Date(Date.now() + IMPERSONATION_SESSION_DURATION_MS)
      }
    })

    // Generate access token for target user
    const accessToken = await generateAccessToken({
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      deviceId: deviceFingerprint,
      onboardingCompleted: targetUser.onboardingCompleted
    })

    // Set cookies
    const cookieStore = await cookies()
    const secure = process.env.NODE_ENV === 'production'
    
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour (matches session)
    })

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    // Set impersonation flag
    cookieStore.set('isImpersonating', 'true', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    cookieStore.set('impersonatorId', user.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    cookieStore.set('impersonatorEmail', user.email, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour
    })

    // Set subscription cookies for target user
    cookieStore.set('subscriptionEnabled', 'true', {
      httpOnly: true,
      secure,
      sameSite: 'lax'
    })

    const subscription = await prisma.subscription.findFirst({
      where: { userId: targetUser.id },
      orderBy: { createdAt: 'desc' }
    })

    const isActive = subscription?.status === 'ACTIVE'
    const isInTrial = subscription?.status === 'TRIAL'
    
    cookieStore.set('subscriptionActive', isActive ? 'true' : 'false', {
      httpOnly: true,
      sameSite: 'lax'
    })

    cookieStore.set('isInTrial', isInTrial ? 'true' : 'false', {
      httpOnly: true,
      sameSite: 'lax'
    })

    // Create audit log with detailed information
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPERSONATE_USER',
        entityType: 'User',
        entityId: targetUser.id,
        newValue: JSON.stringify({ 
          email: targetUser.email,
          impersonatorEmail: user.email,
          sessionDuration: '1 hour'
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: `Now impersonating ${targetUser.email}`,
      redirectUrl: '/dashboard',
      sessionDuration: '1 hour'
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to impersonate user' },
      { status: 500 }
    )
  }
}
