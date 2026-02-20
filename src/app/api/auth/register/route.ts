/**
 * Registration API Route
 * 
 * Handles new user registration with:
 * - Email/password validation
 * - Invite code verification (if enabled)
 * - Password hashing
 * - Session creation
 * - Trial subscription creation
 * - Rate limiting (5 attempts per hour per IP)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createSession, generateAccessToken, setAuthCookies } from '@/lib/auth'
import { getDeviceFingerprint } from '@/lib/auth'
import { registerRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { cookies } from 'next/headers'

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  inviteCode: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check rate limit first (async for Redis support)
    const rateLimitResult = await registerRateLimit.check(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { email, password, inviteCode } = validation.data

    // Check if invite-only mode is enabled
    const inviteOnlySetting = await prisma.systemSettings.findUnique({
      where: { key: 'inviteOnlyMode' }
    })
    const inviteOnly = inviteOnlySetting?.value === 'true'

    // If invite-only, validate invite code
    if (inviteOnly) {
      if (!inviteCode) {
        return NextResponse.json(
          { success: false, error: 'Invite code is required' },
          { status: 400 }
        )
      }

      const code = await prisma.inviteCode.findUnique({
        where: { code: inviteCode }
      })

      if (!code || !code.isActive) {
        return NextResponse.json(
          { success: false, error: 'Invalid invite code' },
          { status: 400 }
        )
      }

      if (code.expiresAt && code.expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Invite code has expired' },
          { status: 400 }
        )
      }

      if (code.currentUses >= code.maxUses) {
        return NextResponse.json(
          { success: false, error: 'Invite code has reached maximum uses' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Get device fingerprint
    const deviceId = getDeviceFingerprint(
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || ''
    )

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        deviceFingerprint: deviceId,
        role: 'STUDENT',
        uiLanguage: 'arabic',
        onboardingCompleted: false,
        onboardingStep: 0
      }
    })

    // Mark invite code as used if applicable
    if (inviteCode && inviteOnly) {
      await prisma.inviteCode.update({
        where: { code: inviteCode },
        data: {
          currentUses: { increment: 1 },
          usedById: user.id
        }
      })
    }

    // Create subscription with trial
    const trialEnabled = await prisma.systemSettings.findUnique({
      where: { key: 'trialEnabled' }
    })
    
    const trialDays = await prisma.systemSettings.findUnique({
      where: { key: 'trialDays' }
    })

    const trialDaysNum = parseInt(trialDays?.value || '14')
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + trialDaysNum)

    if (trialEnabled?.value !== 'false') {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: 'TRIAL',
          trialStart: new Date(),
          trialEnd
        }
      })
    }

    // Create session
    const refreshToken = await createSession(
      user.id,
      deviceId,
      request.headers.get('user-agent') || undefined
    )

    // Generate access token
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId
    })

    // Detect HTTPS for secure cookies (needed for preview proxy environments)
    const previewHost = request.headers.get('abc')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttps = previewHost ? true : (forwardedProto === 'https' || request.url.startsWith('https://'))
    const useSecureCookies = process.env.NODE_ENV === 'production' || isHttps

    // Set cookies
    await setAuthCookies(accessToken, refreshToken, useSecureCookies)

    // Get cookie store for additional cookies
    const cookieStore = await cookies()

    // Set subscription cookies for middleware
    const subscriptionEnabled = await prisma.systemSettings.findUnique({
      where: { key: 'subscriptionEnabled' }
    })
    const isEnabled = subscriptionEnabled?.value !== 'false'
    
    cookieStore.set('subscriptionEnabled', isEnabled ? 'true' : 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/'
    })

    // Set trial subscription cookies
    cookieStore.set('subscriptionActive', 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    cookieStore.set('isInTrial', 'true', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    cookieStore.set('remainingTrialDays', trialDaysNum.toString(), {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    // Set banned status cookie (false for new users)
    cookieStore.set('isBanned', 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      subscription: {
        isActive: false,
        isInTrial: true,
        remainingTrialDays: trialDaysNum
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    // Provide more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'Internal server error'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
