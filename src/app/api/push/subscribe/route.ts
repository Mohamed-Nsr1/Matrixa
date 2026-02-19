/**
 * Push Subscription API Route
 * 
 * GET - Check if user has a push subscription
 * POST - Save push subscription for the current user
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  expirationTime?: number | null
}

/**
 * GET /api/push/subscribe
 * Check if user has an active push subscription
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const hasSubscription = !!user.pushSubscription

    return NextResponse.json({
      success: true,
      hasSubscription,
      subscription: hasSubscription ? JSON.parse(user.pushSubscription as string) : null
    })
  } catch (error) {
    console.error('Error checking push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check subscription' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/push/subscribe
 * Save push subscription for the current user
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subscription } = body as { subscription: PushSubscriptionJSON }

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Store subscription as JSON string
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pushSubscription: JSON.stringify(subscription)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully'
    })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}
