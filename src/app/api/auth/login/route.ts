/**
 * Login API Route
 * 
 * Handles user authentication with:
 * - Email/password validation
 * - Device fingerprinting
 * - Session management (one device per user)
 * - Subscription status cookies
 * - Rate limiting (10 attempts per 15 minutes per IP)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createSession, generateAccessToken, setAuthCookies } from '@/lib/auth'
import { getDeviceFingerprint } from '@/lib/auth'
import { loginRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { cookies } from 'next/headers'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const rateLimitResult = loginRateLimit.check(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const body = await request.json()
    console.log('[Login] Request body:', { email: body?.email, hasPassword: !!body?.password })
    
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      console.log('[Login] Validation failed:', validation.error)
      const errorMessage = validation.error?.issues?.[0]?.message || 'Validation error'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      console.log('Login attempt: User not found for email:', email)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      console.log('Login attempt: Invalid password for user:', email)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is banned
    if (user.isBanned) {
      console.log('Login attempt: Banned user tried to login:', email)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Your account has been banned. Please contact support.',
          reason: 'banned',
          bannedReason: user.bannedReason
        },
        { status: 403 }
      )
    }

    // Get device fingerprint
    const deviceId = getDeviceFingerprint(
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || ''
    )

    // Check if this is a different device
    const isNewDevice = user.deviceFingerprint !== deviceId

    // If different device, invalidate old sessions
    if (isNewDevice && user.deviceFingerprint) {
      await prisma.session.deleteMany({
        where: { userId: user.id }
      })
    }

    // Create new session
    const refreshToken = await createSession(
      user.id,
      deviceId,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    )

    // Generate access token
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId,
      onboardingCompleted: user.onboardingCompleted
    })

    // Detect HTTPS for secure cookies (needed for preview proxy environments)
    // The preview proxy sends the external hostname in the 'abc' header
    // If 'abc' header is present, we're in a preview environment (external HTTPS)
    const previewHost = request.headers.get('abc')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttps = previewHost ? true : (forwardedProto === 'https' || request.url.startsWith('https://'))
    const useSecureCookies = process.env.NODE_ENV === 'production' || isHttps

    console.log('[Login] Cookie security:', {
      previewHost,
      forwardedProto,
      isHttps,
      useSecureCookies
    })

    // Set cookies with appropriate secure flag
    await setAuthCookies(accessToken, refreshToken, useSecureCookies)

    const cookieStore = await cookies()

    // Set banned status cookie (false for non-banned users)
    cookieStore.set('isBanned', 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    // Set onboarding completed cookie if user has completed onboarding
    if (user.onboardingCompleted) {
      cookieStore.set('onboardingCompleted', 'true', {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/'
      })
    }

    // Get subscription status and set cookies
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    const subscriptionEnabled = await prisma.systemSettings.findUnique({
      where: { key: 'subscriptionEnabled' }
    })

    // Get maintenance mode setting
    const maintenanceModeSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenanceMode' }
    })
    const isMaintenanceMode = maintenanceModeSetting?.value === 'true'

    // Set maintenance mode cookie
    cookieStore.set('maintenanceMode', isMaintenanceMode ? 'true' : 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    // Set subscription system enabled cookie
    const isEnabled = subscriptionEnabled?.value !== 'false'
    cookieStore.set('subscriptionEnabled', isEnabled ? 'true' : 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/'
    })

    // Calculate subscription status
    const now = new Date()
    let isActive = false
    let isInTrial = false
    let remainingTrialDays = 0

    if (subscription) {
      // Check if active subscription
      if (subscription.status === 'ACTIVE' && 
          (!subscription.endDate || new Date(subscription.endDate) > now)) {
        isActive = true
      }

      // Check if in trial
      if (subscription.status === 'TRIAL' && subscription.trialEnd) {
        const trialEnd = new Date(subscription.trialEnd)
        if (trialEnd > now) {
          isInTrial = true
          const diffTime = trialEnd.getTime() - now.getTime()
          remainingTrialDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        }
      }
    }

    // Set subscription cookies
    cookieStore.set('subscriptionActive', isActive ? 'true' : 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day (refreshed on login)
      path: '/'
    })

    cookieStore.set('isInTrial', isInTrial ? 'true' : 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    cookieStore.set('remainingTrialDays', remainingTrialDays.toString(), {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user

    console.log('Login successful for user:', email, 'role:', user.role)

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      isNewDevice,
      subscription: {
        isActive,
        isInTrial,
        remainingTrialDays
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    
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
