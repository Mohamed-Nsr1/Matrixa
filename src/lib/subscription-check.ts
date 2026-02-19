/**
 * Subscription Access Check for API Routes
 * 
 * Provides middleware-like helpers for checking subscription status
 * in API routes, with support for read-only mode.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasFeatureAccess } from '@/lib/subscription'

/**
 * Check if user can perform write operations
 * Returns null if allowed, or a NextResponse with error if not
 */
export async function requireWriteAccess(): Promise<NextResponse | null> {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Admins bypass subscription checks
  if (user.role === 'ADMIN') {
    return null // Allow
  }

  const access = await hasFeatureAccess(user.id)

  // Allow if active subscription or trial
  if (access.isActive || access.isInTrial) {
    return null // Allow
  }

  // Grace period - allow limited access
  if (access.isInGracePeriod) {
    // Could implement partial restrictions here
    return null // Allow for now during grace period
  }

  // No access - return payment required
  return NextResponse.json(
    {
      success: false,
      error: 'Subscription required',
      code: 'SUBSCRIPTION_REQUIRED',
      reason: access.reason,
      isReadOnly: true
    },
    { status: 402 } // Payment Required
  )
}

/**
 * Higher-order function to wrap API handlers with subscription checks
 */
export function withSubscriptionCheck(
  handler: (userId: string) => Promise<NextResponse>,
  options: {
    requireWrite?: boolean
  } = {}
): () => Promise<NextResponse> {
  return async () => {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Admins bypass subscription checks
    if (user.role === 'ADMIN') {
      return handler(user.id)
    }

    const access = await hasFeatureAccess(user.id)

    // Check write access if required
    if (options.requireWrite && !access.isActive && !access.isInTrial && !access.isInGracePeriod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription required for this action',
          code: 'SUBSCRIPTION_REQUIRED',
          reason: access.reason
        },
        { status: 402 }
      )
    }

    return handler(user.id)
  }
}

/**
 * Get current subscription status for API responses
 */
export async function getSubscriptionHeader() {
  const user = await getCurrentUser()
  
  if (!user || user.role === 'ADMIN') {
    return {
      'x-subscription-status': 'active',
      'x-subscription-readonly': 'false'
    }
  }

  const access = await hasFeatureAccess(user.id)
  
  return {
    'x-subscription-status': access.subscriptionStatus?.toLowerCase() || 'unknown',
    'x-subscription-readonly': (!access.isActive && !access.isInTrial).toString()
  }
}
