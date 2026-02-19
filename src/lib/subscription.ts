/**
 * Subscription Helper Functions
 * 
 * Provides utilities for checking subscription status, trial periods,
 * and feature access gating.
 */

import { prisma } from './db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './auth'

// Subscription status type
export type SubscriptionStatusType = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED'

// Feature access result
export interface FeatureAccessResult {
  hasAccess: boolean
  reason: string
  subscriptionStatus?: SubscriptionStatusType
  remainingTrialDays?: number
  isActive: boolean
  isInTrial: boolean
}

// Subscription status result
export interface SubscriptionStatusResult {
  status: SubscriptionStatusType
  isActive: boolean
  isInTrial: boolean
  trialEnd?: Date
  subscriptionEnd?: Date
  remainingTrialDays: number
  plan?: {
    id: string
    name: string
    nameAr: string
    price: number
    durationDays: number
  }
}

/**
 * Get system setting value
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  const setting = await prisma.systemSettings.findUnique({
    where: { key }
  })
  return setting?.value ?? null
}

/**
 * Check if subscription system is enabled
 */
export async function isSubscriptionEnabled(): Promise<boolean> {
  const enabled = await getSystemSetting('subscriptionEnabled')
  return enabled !== 'false' // Default to true if not set
}

/**
 * Get trial days configuration
 */
export async function getTrialDays(): Promise<number> {
  const days = await getSystemSetting('trialDays')
  return parseInt(days || '14', 10)
}

/**
 * Check if trial is enabled
 */
export async function isTrialEnabled(): Promise<boolean> {
  const enabled = await getSystemSetting('trialEnabled')
  return enabled !== 'false' // Default to true if not set
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResult> {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    include: {
      plan: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const now = new Date()

  // No subscription found
  if (!subscription) {
    return {
      status: 'EXPIRED',
      isActive: false,
      isInTrial: false,
      remainingTrialDays: 0
    }
  }

  // Calculate trial status
  const isInTrial = subscription.status === 'TRIAL' && 
    subscription.trialEnd && 
    new Date(subscription.trialEnd) > now

  // Calculate remaining trial days
  let remainingTrialDays = 0
  if (subscription.trialEnd) {
    const trialEndDate = new Date(subscription.trialEnd)
    const diffTime = trialEndDate.getTime() - now.getTime()
    remainingTrialDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  // Check if active
  const isActive = subscription.status === 'ACTIVE' && 
    (!subscription.endDate || new Date(subscription.endDate) > now)

  // Check if trial expired
  const trialExpired = subscription.status === 'TRIAL' && 
    subscription.trialEnd && 
    new Date(subscription.trialEnd) <= now

  // Determine actual status
  let actualStatus: SubscriptionStatusType = subscription.status as SubscriptionStatusType
  if (trialExpired) {
    actualStatus = 'EXPIRED'
  } else if (isInTrial) {
    actualStatus = 'TRIAL'
  } else if (isActive) {
    actualStatus = 'ACTIVE'
  }

  return {
    status: actualStatus,
    isActive: !!(isActive || isInTrial),
    isInTrial: !!isInTrial,
    trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : undefined,
    subscriptionEnd: subscription.endDate ? new Date(subscription.endDate) : undefined,
    remainingTrialDays,
    plan: subscription.plan ? {
      id: subscription.plan.id,
      name: subscription.plan.name,
      nameAr: subscription.plan.nameAr,
      price: subscription.plan.price,
      durationDays: subscription.plan.durationDays
    } : undefined
  }
}

/**
 * Check if user is in trial period
 */
export async function isInTrial(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.isInTrial
}

/**
 * Get remaining trial days for user
 */
export async function getRemainingTrialDays(userId: string): Promise<number> {
  const status = await getSubscriptionStatus(userId)
  return status.remainingTrialDays
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: string, 
  feature?: string
): Promise<FeatureAccessResult> {
  // Check if subscription system is enabled
  const subscriptionEnabled = await isSubscriptionEnabled()
  
  if (!subscriptionEnabled) {
    return {
      hasAccess: true,
      reason: 'subscription_disabled',
      isActive: true,
      isInTrial: false
    }
  }

  const status = await getSubscriptionStatus(userId)

  // Active subscription
  if (status.isActive) {
    return {
      hasAccess: true,
      reason: status.isInTrial ? 'trial_active' : 'subscription_active',
      subscriptionStatus: status.status,
      remainingTrialDays: status.remainingTrialDays,
      isActive: true,
      isInTrial: status.isInTrial
    }
  }

  // No access
  return {
    hasAccess: false,
    reason: status.isInTrial ? 'trial_expired' : 'no_subscription',
    subscriptionStatus: status.status,
    remainingTrialDays: 0,
    isActive: false,
    isInTrial: false
  }
}

/**
 * Middleware helper for API routes requiring subscription
 */
export async function requireSubscription(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Admins bypass subscription check
  if (user.role === 'ADMIN') {
    return handler(user.id)
  }

  const access = await hasFeatureAccess(user.id)

  if (!access.hasAccess) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        reason: access.reason
      },
      { status: 402 } // Payment Required
    )
  }

  return handler(user.id)
}

/**
 * Get all active subscription plans
 */
export async function getActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })
}

/**
 * Create or update user subscription after payment
 */
export async function activateSubscription(
  userId: string,
  planId: string,
  paymentId?: string
): Promise<void> {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + plan.durationDays)

  // Deactivate existing subscriptions
  await prisma.subscription.updateMany({
    where: { 
      userId,
      status: { in: ['TRIAL', 'ACTIVE'] }
    },
    data: { status: 'CANCELLED' }
  })

  // Create new subscription
  await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'ACTIVE',
      startDate: now,
      endDate,
      paymobPaymentId: paymentId
    }
  })
}

/**
 * Update expired subscriptions
 */
export async function updateExpiredSubscriptions(): Promise<void> {
  const now = new Date()

  // Update expired trials
  await prisma.subscription.updateMany({
    where: {
      status: 'TRIAL',
      trialEnd: { lt: now }
    },
    data: { status: 'EXPIRED' }
  })

  // Update expired active subscriptions
  await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now }
    },
    data: { status: 'EXPIRED' }
  })
}
