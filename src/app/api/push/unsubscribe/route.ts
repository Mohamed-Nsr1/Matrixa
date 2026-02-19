/**
 * Push Unsubscribe API Route
 * 
 * POST - Remove push subscription for the current user
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * POST /api/push/unsubscribe
 * Remove push subscription for the current user
 */
export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove subscription by setting to null
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pushSubscription: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully'
    })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}
