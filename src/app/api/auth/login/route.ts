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
import { 
  getSystemSetting, 
  getGracePeriodDays, 
  isSignInRestrictionEnabled, 
  getSignInRestrictionDays,
  getExpiredUserLimits
} from '@/lib/subscription'
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
    
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
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
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is banned
    if (user.isBanned) {
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
    const previewHost = request.headers.get('abc')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttps = previewHost ? true : (forwardedProto === 'https' || request.url.startsWith('https://'))
    const useSecureCookies = process.env.NODE_ENV === 'production' || isHttps

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
    let isInGracePeriod = false
    let isAccessDenied = false
    let remainingTrialDays = 0
    let daysSinceExpiry = 0

    // Get admin-configured settings
    const gracePeriodDays = await getGracePeriodDays()
    const signInRestrictionEnabled = await isSignInRestrictionEnabled()
    const signInRestrictionDays = await getSignInRestrictionDays()
    const featureLimits = await getExpiredUserLimits()

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

      // Check if in grace period (configurable days after subscription end)
      if (subscription.endDate && !isActive && !isInTrial) {
        const endDate = new Date(subscription.endDate)
        const gracePeriodEnd = subscription.gracePeriodEnd 
          ? new Date(subscription.gracePeriodEnd)
          : new Date(endDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)
        
        // Calculate days since expiry
        const diffTime = now.getTime() - endDate.getTime()
        daysSinceExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        
        if (now <= gracePeriodEnd) {
          isInGracePeriod = true
        } else if (signInRestrictionEnabled) {
          // Check if past the total access period (grace + sign-in restriction days)
          const totalAccessEnd = new Date(gracePeriodEnd.getTime() + signInRestrictionDays * 24 * 60 * 60 * 1000)
          if (now > totalAccessEnd) {
            isAccessDenied = true
          }
        }
      }
    } else if (signInRestrictionEnabled) {
      // No subscription at all - check if should be denied
      // If no subscription, we deny access immediately if restriction is enabled
      // Actually, let them through but with limited access
      isAccessDenied = false
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

    cookieStore.set('isInGracePeriod', isInGracePeriod ? 'true' : 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    // Set access denied cookie
    cookieStore.set('isAccessDenied', isAccessDenied ? 'true' : 'false', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    })

    // Set feature limits cookie (JSON string)
    cookieStore.set('featureLimits', JSON.stringify(featureLimits), {
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
      isNewDevice,
      subscription: {
        isActive,
        isInTrial,
        remainingTrialDays
      }
    })
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error')
    
    // SECURITY: Generic error message in production
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
