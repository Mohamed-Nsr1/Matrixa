/**
 * Subscription Helper Functions
 * 
 * Provides utilities for checking subscription status, trial periods,
 * grace periods, and feature access gating.
 */

import { prisma } from './db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './auth'

// Default grace period (fallback if not configured in admin)
const DEFAULT_GRACE_PERIOD_DAYS = 7

// Feature limits defaults (fallback if not configured)
const DEFAULT_EXPIRED_LIMITS = {
  timetableDays: 5,
  notesLimit: 20,
  focusSessionsLimit: 10,
  privateLessonsLimit: 5
}

// Subscription status type
export type SubscriptionStatusType = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED' | 'GRACE_PERIOD'

// Feature access result
export interface FeatureAccessResult {
  hasAccess: boolean
  reason: string
  subscriptionStatus?: SubscriptionStatusType
  remainingTrialDays?: number
  daysUntilExpiry?: number
  daysSinceExpiry?: number
  isInGracePeriod: boolean
  gracePeriodEnd?: Date
  isActive: boolean
  isInTrial: boolean
  isAccessDenied?: boolean
  signInRestricted?: boolean
  featureLimits?: {
    timetableDays: number
    notesLimit: number
    focusSessionsLimit: number
    privateLessonsLimit: number
  }
}

// Subscription status result
export interface SubscriptionStatusResult {
  status: SubscriptionStatusType
  isActive: boolean
  isInTrial: boolean
  trialEnd?: Date
  subscriptionEnd?: Date
  gracePeriodEnd?: Date
  remainingTrialDays: number
  daysUntilExpiry?: number
  daysSinceExpiry?: number
  isInGracePeriod: boolean
  hasLimitedAccess: boolean
  isAccessDenied?: boolean
  signInRestricted?: boolean
  featureLimits?: {
    timetableDays: number
    notesLimit: number
    focusSessionsLimit: number
    privateLessonsLimit: number
  }
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
 * Get grace period days from admin settings
 */
export async function getGracePeriodDays(): Promise<number> {
  const days = await getSystemSetting('gracePeriodDays')
  return parseInt(days || String(DEFAULT_GRACE_PERIOD_DAYS), 10)
}

/**
 * Check if sign-in restriction is enabled
 */
export async function isSignInRestrictionEnabled(): Promise<boolean> {
  const enabled = await getSystemSetting('enableSignInRestriction')
  return enabled === 'true'
}

/**
 * Get sign-in restriction days
 */
export async function getSignInRestrictionDays(): Promise<number> {
  const days = await getSystemSetting('signInRestrictionDays')
  return parseInt(days || '30', 10)
}

/**
 * Get feature limits for expired users
 */
export async function getExpiredUserLimits(): Promise<{
  timetableDays: number
  notesLimit: number
  focusSessionsLimit: number
  privateLessonsLimit: number
}> {
  const [timetableDays, notesLimit, focusSessionsLimit, privateLessonsLimit] = await Promise.all([
    getSystemSetting('expiredTimetableDays'),
    getSystemSetting('expiredNotesLimit'),
    getSystemSetting('expiredFocusSessionsLimit'),
    getSystemSetting('expiredPrivateLessonsLimit')
  ])
  
  return {
    timetableDays: parseInt(timetableDays || String(DEFAULT_EXPIRED_LIMITS.timetableDays), 10),
    notesLimit: parseInt(notesLimit || String(DEFAULT_EXPIRED_LIMITS.notesLimit), 10),
    focusSessionsLimit: parseInt(focusSessionsLimit || String(DEFAULT_EXPIRED_LIMITS.focusSessionsLimit), 10),
    privateLessonsLimit: parseInt(privateLessonsLimit || String(DEFAULT_EXPIRED_LIMITS.privateLessonsLimit), 10)
  }
}

/**
 * Calculate grace period end date
 */
export async function calculateGracePeriodEnd(endDate: Date): Promise<Date> {
  const gracePeriodDays = await getGracePeriodDays()
  const graceEnd = new Date(endDate)
  graceEnd.setDate(graceEnd.getDate() + gracePeriodDays)
  return graceEnd
}

/**
 * Check if user should be completely denied access
 */
export async function checkAccessDenied(
  subscriptionEnd: Date | undefined,
  gracePeriodEnd: Date | undefined
): Promise<{ denied: boolean; signInRestricted: boolean }> {
  const signInRestrictionEnabled = await isSignInRestrictionEnabled()
  
  if (!signInRestrictionEnabled) {
    return { denied: false, signInRestricted: false }
  }
  
  const signInRestrictionDays = await getSignInRestrictionDays()
  const now = new Date()
  
  // Calculate the total access period end date
  let accessEnd: Date
  if (gracePeriodEnd) {
    accessEnd = new Date(gracePeriodEnd)
  } else if (subscriptionEnd) {
    const gracePeriodDays = await getGracePeriodDays()
    accessEnd = new Date(subscriptionEnd)
    accessEnd.setDate(accessEnd.getDate() + gracePeriodDays)
  } else {
    return { denied: false, signInRestricted: false }
  }
  
  // Add the sign-in restriction days
  const totalAccessEnd = new Date(accessEnd)
  totalAccessEnd.setDate(totalAccessEnd.getDate() + signInRestrictionDays)
  
  if (now > accessEnd && now <= totalAccessEnd) {
    // In the sign-in restriction period (can view limited, but prompted to renew)
    return { denied: false, signInRestricted: true }
  } else if (now > totalAccessEnd) {
    // Completely denied
    return { denied: true, signInRestricted: true }
  }
  
  return { denied: false, signInRestricted: false }
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
  const featureLimits = await getExpiredUserLimits()

  // No subscription found
  if (!subscription) {
    const accessCheck = await checkAccessDenied(undefined, undefined)
    return {
      status: 'EXPIRED',
      isActive: false,
      isInTrial: false,
      remainingTrialDays: 0,
      isInGracePeriod: false,
      hasLimitedAccess: true,
      isAccessDenied: accessCheck.denied,
      signInRestricted: accessCheck.signInRestricted,
      featureLimits
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

  // Calculate grace period
  let isInGracePeriod = false
  let gracePeriodEnd: Date | undefined
  let daysUntilExpiry: number | undefined
  let daysSinceExpiry: number | undefined

  if (subscription.endDate) {
    const endDate = new Date(subscription.endDate)
    const diffTime = endDate.getTime() - now.getTime()
    
    if (diffTime > 0) {
      // Subscription not yet expired
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } else {
      // Subscription expired
      daysSinceExpiry = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24))
      
      // Check grace period
      const graceEnd = subscription.gracePeriodEnd 
        ? new Date(subscription.gracePeriodEnd)
        : await calculateGracePeriodEnd(endDate)
      
      gracePeriodEnd = graceEnd
      
      if (now <= graceEnd) {
        isInGracePeriod = true
      }
    }
  }

  // Determine actual status
  let actualStatus: SubscriptionStatusType = subscription.status as SubscriptionStatusType
  if (trialExpired) {
    actualStatus = isInGracePeriod ? 'GRACE_PERIOD' : 'EXPIRED'
  } else if (isInTrial) {
    actualStatus = 'TRIAL'
  } else if (isActive) {
    actualStatus = 'ACTIVE'
  } else if (isInGracePeriod) {
    actualStatus = 'GRACE_PERIOD'
  }

  // Determine if user has limited access (can view but not edit)
  const hasLimitedAccess = !isActive && !isInTrial && !isInGracePeriod

  // Check if access should be denied completely
  const accessCheck = await checkAccessDenied(
    subscription.endDate ? new Date(subscription.endDate) : undefined,
    gracePeriodEnd
  )

  return {
    status: actualStatus,
    isActive: !!(isActive || isInTrial),
    isInTrial: !!isInTrial,
    trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : undefined,
    subscriptionEnd: subscription.endDate ? new Date(subscription.endDate) : undefined,
    gracePeriodEnd,
    remainingTrialDays,
    daysUntilExpiry,
    daysSinceExpiry,
    isInGracePeriod,
    hasLimitedAccess,
    isAccessDenied: accessCheck.denied,
    signInRestricted: accessCheck.signInRestricted,
    featureLimits,
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
      isInTrial: false,
      isInGracePeriod: false,
      featureLimits: await getExpiredUserLimits()
    }
  }

  const status = await getSubscriptionStatus(userId)

  // Check if access is completely denied
  if (status.isAccessDenied) {
    return {
      hasAccess: false,
      reason: 'access_denied',
      subscriptionStatus: status.status,
      daysSinceExpiry: status.daysSinceExpiry,
      remainingTrialDays: 0,
      isActive: false,
      isInTrial: false,
      isInGracePeriod: false,
      isAccessDenied: true,
      signInRestricted: true,
      featureLimits: status.featureLimits
    }
  }

  // Active subscription
  if (status.isActive) {
    return {
      hasAccess: true,
      reason: status.isInTrial ? 'trial_active' : 'subscription_active',
      subscriptionStatus: status.status,
      remainingTrialDays: status.remainingTrialDays,
      daysUntilExpiry: status.daysUntilExpiry,
      isActive: true,
      isInTrial: status.isInTrial,
      isInGracePeriod: false,
      featureLimits: status.featureLimits
    }
  }

  // Grace period - limited access but can view
  if (status.isInGracePeriod) {
    return {
      hasAccess: true, // Allow access during grace period
      reason: 'grace_period',
      subscriptionStatus: 'GRACE_PERIOD',
      daysSinceExpiry: status.daysSinceExpiry,
      gracePeriodEnd: status.gracePeriodEnd,
      isActive: false,
      isInTrial: false,
      isInGracePeriod: true,
      featureLimits: status.featureLimits
    }
  }

  // Sign-in restricted (can view limited data)
  if (status.signInRestricted) {
    return {
      hasAccess: true, // Allow limited viewing
      reason: 'sign_in_restricted',
      subscriptionStatus: status.status,
      daysSinceExpiry: status.daysSinceExpiry,
      isActive: false,
      isInTrial: false,
      isInGracePeriod: false,
      signInRestricted: true,
      featureLimits: status.featureLimits
    }
  }

  // No access
  return {
    hasAccess: false,
    reason: status.isInTrial ? 'trial_expired' : 'no_subscription',
    subscriptionStatus: status.status,
    daysSinceExpiry: status.daysSinceExpiry,
    remainingTrialDays: 0,
    isActive: false,
    isInTrial: false,
    isInGracePeriod: false,
    featureLimits: status.featureLimits
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
  
  // Calculate grace period end
  const gracePeriodEnd = await calculateGracePeriodEnd(endDate)

  // Deactivate existing subscriptions
  await prisma.subscription.updateMany({
    where: { 
      userId,
      status: { in: ['TRIAL', 'ACTIVE'] }
    },
    data: { status: 'CANCELLED' }
  })

  // Create new subscription with grace period
  await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'ACTIVE',
      startDate: now,
      endDate,
      gracePeriodEnd,
      paymobPaymentId: paymentId
    }
  })
}

/**
 * Update expired subscriptions and set grace periods
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

  // Update expired active subscriptions to grace period
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now },
      gracePeriodEnd: { gte: now }
    }
  })

  for (const sub of expiredSubscriptions) {
    // Set grace period if not already set
    if (!sub.gracePeriodEnd && sub.endDate) {
      const graceEnd = await calculateGracePeriodEnd(new Date(sub.endDate))
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { 
          status: 'EXPIRED',
          gracePeriodEnd: graceEnd
        }
      })
    }
  }

  // Update subscriptions past grace period
  await prisma.subscription.updateMany({
    where: {
      status: 'EXPIRED',
      gracePeriodEnd: { lt: now }
    },
    data: { 
      // Keep as expired, but we could add another status if needed
    }
  })
}
