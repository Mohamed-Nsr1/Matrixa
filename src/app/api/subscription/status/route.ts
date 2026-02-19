/**
 * Subscription Status API
 * 
 * Returns current subscription status for the authenticated user.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSubscriptionStatus, hasFeatureAccess, isSubscriptionEnabled } from '@/lib/subscription'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Admins always have access
    if (user.role === 'ADMIN') {
      return NextResponse.json({
        success: true,
        subscription: {
          status: 'ACTIVE',
          isActive: true,
          isInTrial: false,
          remainingTrialDays: 0
        },
        access: {
          hasAccess: true,
          reason: 'admin'
        },
        subscriptionEnabled: true
      })
    }

    const subscriptionEnabled = await isSubscriptionEnabled()
    const status = await getSubscriptionStatus(user.id)
    const access = await hasFeatureAccess(user.id)

    return NextResponse.json({
      success: true,
      subscription: status,
      access,
      subscriptionEnabled
    })
  } catch (error) {
    console.error('Get subscription status error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
