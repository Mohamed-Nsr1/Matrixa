/**
 * Payment Webhook API Route
 * 
 * Handles payment completion and activates subscription.
 * SECURITY: HMAC signature verification for webhook authenticity.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const webhookSchema = z.object({
  paymentId: z.string(),
  planId: z.string(),
  success: z.boolean(),
  // Paymob webhook fields
  obj: z.record(z.string(), z.unknown()).optional(),
  hmac: z.string().optional(),
})

/**
 * Verify Paymob webhook HMAC signature
 * SECURITY: Prevents fraudulent webhook calls
 */
function verifyPaymobHMAC(data: Record<string, unknown>, receivedHmac: string): boolean {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET
  
  // If no HMAC secret configured, reject in production
  if (!hmacSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('PAYMOB_HMAC_SECRET not configured - rejecting webhook')
      return false
    }
    // Allow in development for testing
    console.warn('WARNING: PAYMOB_HMAC_SECRET not configured - allowing webhook in development')
    return true
  }

  if (!receivedHmac) {
    return false
  }

  try {
    // Build the HMAC string from Paymob data
    // The order matters for Paymob HMAC calculation
    const hmacFields = [
      'amount_cents',
      'created_at', 
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'is_voided',
      'order.id',
      'owner',
      'pending',
      'source_data.pan',
      'source_data.sub_type',
      'source_data.type',
      'success',
    ]

    const values: string[] = []
    for (const field of hmacFields) {
      const value = getNestedValue(data, field)
      values.push(value !== undefined && value !== null ? String(value) : '')
    }

    const hmacString = values.join('')
    
    // Calculate HMAC
    const calculatedHmac = crypto
      .createHmac('sha512', hmacSecret)
      .update(hmacString)
      .digest('hex')

    // Constant time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'hex'),
      Buffer.from(receivedHmac, 'hex')
    )
  } catch (error) {
    console.error('HMAC verification error:', error)
    return false
  }
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Verify mock payment signature for testing
 * SECURITY: Uses CRON_SECRET or a dedicated webhook secret
 */
function verifyMockSignature(paymentId: string, signature: string | null): boolean {
  const secret = process.env.CRON_SECRET || process.env.PAYMOB_HMAC_SECRET
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return false
    }
    // In development, allow without signature
    return true
  }

  if (!signature) {
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(paymentId)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    return false
  }
}

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

    const { paymentId, planId, success, obj, hmac } = validation.data

    // SECURITY: Verify webhook signature
    // For real Paymob webhooks, verify HMAC
    if (obj && hmac) {
      if (!verifyPaymobHMAC(obj, hmac)) {
        console.error('Paymob webhook HMAC verification failed')
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      // For mock payments, verify signature header
      const signature = request.headers.get('x-webhook-signature')
      if (!verifyMockSignature(paymentId, signature)) {
        console.error('Mock webhook signature verification failed')
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

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

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: subscription.userId,
          action: 'PAYMENT_FAILED',
          entityType: 'Subscription',
          entityId: subscription.id,
          newValue: JSON.stringify({ paymentId, planId })
        }
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
          endDate,
          paymentId
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
