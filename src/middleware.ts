/**
 * Next.js Middleware
 * 
 * Handles route protection, authentication checks, and subscription gating.
 * Uses edge-compatible JWT verification (no Prisma).
 * 
 * IMPORTANT: Uses 'abc' header for correct HTTPS redirects in preview environments
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth-edge'

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/landing',
  '/onboarding',
  '/subscription',
  '/access-denied'
]

// Routes exempt from maintenance mode
const maintenanceExemptRoutes = [
  '/admin',
  '/api/admin',
  '/auth/login',
  '/api/auth'
]

// Routes that require admin role
const adminRoutes = [
  '/admin'
]

// Routes excluded from subscription check
const subscriptionExemptRoutes = [
  '/subscription',
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/api/auth',
  '/api/subscription',
  '/api/payment'
]

/**
 * Get the correct redirect URL using preview proxy headers
 * CRITICAL: Must return a valid externally-accessible URL
 */
function getRedirectUrl(request: NextRequest, path: string): URL {
  // Preview proxy sends external hostname in 'abc' header
  const previewHost = request.headers.get('abc')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const hostHeader = request.headers.get('host')
  
  // Check if we have a valid external domain (contains a dot for TLD)
  const isValidExternalDomain = (domain: string | null): boolean => {
    if (!domain) return false
    // Must contain at least one dot (domain.tld pattern)
    // And not start with common internal prefixes
    if (!domain.includes('.')) return false
    if (domain.startsWith('localhost')) return false
    if (domain.startsWith('127.')) return false
    if (domain.startsWith('10.')) return false
    if (domain.startsWith('192.168.')) return false
    if (domain.startsWith('172.')) return false
    // Also check it's not an internal hostname like 'preview-chat-xxx'
    if (domain.startsWith('preview-')) return false
    return true
  }
  
  // Priority 1: Preview host (abc header) - most reliable for preview environments
  if (isValidExternalDomain(previewHost)) {
    return new URL(`https://${previewHost}${path}`)
  }
  
  // Priority 2: Forwarded host (from reverse proxy)
  if (isValidExternalDomain(forwardedHost)) {
    const protocol = forwardedProto || 'https'
    return new URL(`${protocol}://${forwardedHost}${path}`)
  }
  
  // Priority 3: Host header (might be external)
  if (isValidExternalDomain(hostHeader)) {
    const protocol = forwardedProto || 'https'
    return new URL(`${protocol}://${hostHeader}${path}`)
  }
  
  // Priority 4: Check if abc header exists even without a dot (might be a local development proxy)
  if (previewHost && previewHost.length > 0) {
    return new URL(`https://${previewHost}${path}`)
  }
  
  // Priority 5: For development/localhost - use the request's own URL structure
  // This works for localhost:3000 style URLs
  const url = request.nextUrl.clone()
  url.pathname = path
  return url
}

/**
 * Create redirect response with no-cache headers
 */
function redirect(url: URL): NextResponse {
  const response = NextResponse.redirect(url)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('X-Redirect-Reason', 'middleware')
  return response
}

/**
 * Check subscription system enabled
 */
function isSubscriptionEnabledFromCookie(request: NextRequest): boolean {
  const cookie = request.cookies.get('subscriptionEnabled')?.value
  if (!cookie) return true
  return cookie === 'true'
}

/**
 * Check subscription access
 * Returns detailed subscription status for UI handling
 */
function getSubscriptionStatusFromCookies(request: NextRequest): {
  hasAccess: boolean
  isReadOnly: boolean
  reason: string
  status: 'active' | 'trial' | 'grace_period' | 'expired' | 'access_denied'
  isAccessDenied: boolean
} {
  const subscriptionActive = request.cookies.get('subscriptionActive')?.value
  const isInTrial = request.cookies.get('isInTrial')?.value
  const isInGracePeriod = request.cookies.get('isInGracePeriod')?.value
  const isAccessDenied = request.cookies.get('isAccessDenied')?.value
  const remainingTrialDays = parseInt(request.cookies.get('remainingTrialDays')?.value || '0', 10)

  // Check if access is completely denied
  if (isAccessDenied === 'true') {
    return { 
      hasAccess: false, 
      isReadOnly: true, 
      reason: 'access_denied', 
      status: 'access_denied',
      isAccessDenied: true 
    }
  }

  // Active subscription - full access
  if (subscriptionActive === 'true') {
    return { hasAccess: true, isReadOnly: false, reason: 'subscription_active', status: 'active', isAccessDenied: false }
  }

  // Active trial - full access
  if (isInTrial === 'true' && remainingTrialDays > 0) {
    return { hasAccess: true, isReadOnly: false, reason: 'trial_active', status: 'trial', isAccessDenied: false }
  }

  // Grace period - read-only access (can view but not edit)
  if (isInGracePeriod === 'true') {
    return { hasAccess: true, isReadOnly: true, reason: 'grace_period', status: 'grace_period', isAccessDenied: false }
  }

  // Expired - read-only access (can view but not edit)
  // We allow access to dashboard so users can see their data
  return { hasAccess: true, isReadOnly: true, reason: 'no_subscription', status: 'expired', isAccessDenied: false }
}

/**
 * Check if user is banned
 */
function isUserBannedFromCookie(request: NextRequest): boolean {
  return request.cookies.get('isBanned')?.value === 'true'
}

/**
 * Check if maintenance mode is enabled
 */
function isMaintenanceModeFromCookie(request: NextRequest): boolean {
  return request.cookies.get('maintenanceMode')?.value === 'true'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Handle public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    // Redirect authenticated users away from auth pages
    if (pathname.startsWith('/auth/')) {
      const accessToken = request.cookies.get('accessToken')?.value
      if (accessToken) {
        const payload = await verifyAccessToken(accessToken)
        if (payload) {
          const dest = payload.role === 'ADMIN' ? '/admin' : '/dashboard'
          return redirect(getRedirectUrl(request, dest))
        }
      }
    }
    
    // Handle onboarding page
    if (pathname === '/onboarding') {
      const accessToken = request.cookies.get('accessToken')?.value
      if (accessToken) {
        const payload = await verifyAccessToken(accessToken)
        if (payload) {
          const completed = payload.onboardingCompleted === true || 
            request.cookies.get('onboardingCompleted')?.value === 'true'
          if (completed) {
            return redirect(getRedirectUrl(request, '/dashboard'))
          }
        }
      }
    }
    
    return NextResponse.next()
  }

  // Protected routes - check authentication
  const accessToken = request.cookies.get('accessToken')?.value

  if (!accessToken) {
    const loginUrl = getRedirectUrl(request, '/auth/login')
    loginUrl.searchParams.set('redirect', pathname)
    return redirect(loginUrl)
  }

  const payload = await verifyAccessToken(accessToken)

  if (!payload) {
    const loginUrl = getRedirectUrl(request, '/auth/login')
    loginUrl.searchParams.set('redirect', pathname)
    return redirect(loginUrl)
  }

  // Check if banned
  if (payload.role !== 'ADMIN' && isUserBannedFromCookie(request)) {
    const loginUrl = getRedirectUrl(request, '/auth/login')
    loginUrl.searchParams.set('banned', 'true')
    const response = redirect(loginUrl)
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')
    return response
  }

  // Check maintenance mode (non-admins only, exempt routes bypass)
  if (payload.role !== 'ADMIN' && isMaintenanceModeFromCookie(request)) {
    const isExempt = maintenanceExemptRoutes.some(route => pathname.startsWith(route))
    if (!isExempt) {
      return redirect(getRedirectUrl(request, '/maintenance'))
    }
  }

  // Admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (payload.role !== 'ADMIN') {
      return redirect(getRedirectUrl(request, '/dashboard'))
    }
    return NextResponse.next()
  }

  // Redirect admins to admin panel
  if (payload.role === 'ADMIN') {
    return redirect(getRedirectUrl(request, '/admin'))
  }

  // Check onboarding
  const hasCompletedOnboarding = payload.onboardingCompleted === true || 
    request.cookies.get('onboardingCompleted')?.value === 'true'

  if (!hasCompletedOnboarding && pathname !== '/onboarding') {
    return redirect(getRedirectUrl(request, '/onboarding'))
  }

  // Skip subscription check for exempt routes
  if (subscriptionExemptRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Subscription check - Soft Lock Approach
  // We allow access to dashboard even with expired subscription (read-only mode)
  // The UI will show banners and restrict write operations
  const subscriptionEnabled = isSubscriptionEnabledFromCookie(request)
  
  if (subscriptionEnabled) {
    const status = getSubscriptionStatusFromCookies(request)
    
    // If access is completely denied, redirect to access-denied page
    if (status.isAccessDenied) {
      const deniedUrl = getRedirectUrl(request, '/access-denied')
      deniedUrl.searchParams.set('reason', status.reason)
      return redirect(deniedUrl)
    }
    
    // Set headers for frontend to use
    const response = NextResponse.next()
    response.headers.set('x-subscription-status', status.status)
    response.headers.set('x-subscription-readonly', status.isReadOnly ? 'true' : 'false')
    response.headers.set('x-subscription-reason', status.reason)
    
    // Still redirect to subscription page if explicitly on a "create new" page and expired
    // But allow viewing existing data
    const isCreationRoute = pathname.includes('/new') || pathname.includes('/create')
    if (isCreationRoute && status.isReadOnly) {
      const subUrl = getRedirectUrl(request, '/subscription')
      subUrl.searchParams.set('reason', status.reason)
      subUrl.searchParams.set('redirect', pathname)
      return redirect(subUrl)
    }
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)']
}
