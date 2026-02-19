/**
 * Payment API Route
 * 
 * Creates mock payment intent for subscription.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const paymentSchema = z.object({
  planId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = paymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const { planId } = validation.data

    // Verify plan exists and is active
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: planId, isActive: true }
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // Generate mock payment ID
    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Create pending subscription record
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'PAUSED', // Will be activated on payment success
        startDate: new Date(),
        paymobOrderId: paymentId
      }
    })

    // Get test mode setting
    const testModeSetting = await prisma.systemSettings.findUnique({
      where: { key: 'testMode' }
    })
    const isTestMode = testModeSetting?.value !== 'false'

    // Mock payment URL (in real implementation, this would be Paymob's URL)
    const mockPaymentUrl = isTestMode
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?payment=${paymentId}`
      : `https://accept.paymob.com/api/acceptance/iframes/${paymentId}`

    return NextResponse.json({
      success: true,
      paymentId,
      paymentUrl: mockPaymentUrl,
      amount: plan.price,
      currency: 'EGP',
      planName: plan.nameAr
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
