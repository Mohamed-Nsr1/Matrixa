/**
 * Subscription History API Route
 * 
 * Returns the user's subscription and payment history
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all user subscriptions with plan details
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      include: {
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format the history
    const history = subscriptions.map(sub => ({
      id: sub.id,
      status: sub.status,
      planName: sub.plan?.nameAr || 'خطة مخصصة',
      planNameEn: sub.plan?.name || 'Custom Plan',
      price: sub.plan?.price || 0,
      durationDays: sub.plan?.durationDays || 0,
      startDate: sub.startDate,
      endDate: sub.endDate,
      trialStart: sub.trialStart,
      trialEnd: sub.trialEnd,
      paymobOrderId: sub.paymobOrderId,
      paymobPaymentId: sub.paymobPaymentId,
      createdAt: sub.createdAt
    }))

    return NextResponse.json({
      success: true,
      history
    })
  } catch (error) {
    console.error('Error fetching subscription history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription history' },
      { status: 500 }
    )
  }
}
