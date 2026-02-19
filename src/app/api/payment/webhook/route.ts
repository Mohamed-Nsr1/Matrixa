/**
 * Payment Webhook API Route
 * 
 * Handles mock payment completion and activates subscription.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'

const webhookSchema = z.object({
  paymentId: z.string(),
  planId: z.string(),
  success: z.boolean()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = webhookSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const { paymentId, planId, success } = validation.data

    // Find the pending subscription
    const subscription = await prisma.subscription.findFirst({
      where: { paymobOrderId: paymentId }
    })

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (!success) {
      // Mark as expired if payment failed
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json({
        success: false,
        error: 'Payment failed'
      })
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Calculate end date
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + plan.durationDays)

    // Deactivate any existing active/trial subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: subscription.userId,
        status: { in: ['TRIAL', 'ACTIVE', 'PAUSED'] },
        id: { not: subscription.id }
      },
      data: { status: 'CANCELLED' }
    })

    // Activate the subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startDate: now,
        endDate,
        paymobPaymentId: paymentId
      }
    })

    // Update subscription cookies for the user
    const cookieStore = await cookies()
    
    cookieStore.set('subscriptionActive', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/'
    })

    cookieStore.set('isInTrial', 'false', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/'
    })

    cookieStore.set('remainingTrialDays', '0', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/'
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: subscription.userId,
        action: 'SUBSCRIPTION_ACTIVATED',
        entityType: 'Subscription',
        entityId: subscription.id,
        newValue: JSON.stringify({
          planId,
          planName: plan.nameAr,
          endDate
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        planName: plan.nameAr,
        endDate
      }
    })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
