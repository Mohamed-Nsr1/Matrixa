'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Subscription Context
 * 
 * Provides global subscription state management with:
 * - Read-only mode for expired subscriptions
 * - Grace period handling
 * - Trial status tracking
 * - Visual indicators for subscription status
 * - Feature limits for expired users
 */

export type SubscriptionStatusType = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED' | 'GRACE_PERIOD' | 'NO_SUBSCRIPTION'

export interface FeatureLimits {
  timetableDays: number
  notesLimit: number
  focusSessionsLimit: number
  privateLessonsLimit: number
}

export interface SubscriptionState {
  status: SubscriptionStatusType
  isActive: boolean
  isInTrial: boolean
  isInGracePeriod: boolean
  isReadOnly: boolean // True when user can view but not edit
  isAccessDenied: boolean // True when user is completely denied access
  remainingTrialDays: number
  daysUntilExpiry?: number
  daysSinceExpiry?: number
  gracePeriodEnd?: Date
  subscriptionEnd?: Date
  plan?: {
    id: string
    name: string
    nameAr: string
    price: number
    durationDays: number
  }
  featureLimits?: FeatureLimits
  isLoading: boolean
  lastChecked?: Date
}

interface SubscriptionContextType extends SubscriptionState {
  refresh: () => Promise<void>
  checkAccess: (feature?: string) => Promise<boolean>
  showUpgradeModal: () => void
  hideUpgradeModal: () => void
  isUpgradeModalOpen: boolean
  canViewFeature: (feature: 'timetable' | 'notes' | 'focusSessions' | 'privateLessons', count?: number) => boolean
  getFeatureLimit: (feature: 'timetable' | 'notes' | 'focusSessions' | 'privateLessons') => number
}

const defaultFeatureLimits: FeatureLimits = {
  timetableDays: 5,
  notesLimit: 20,
  focusSessionsLimit: 10,
  privateLessonsLimit: 5
}

const defaultState: SubscriptionState = {
  status: 'NO_SUBSCRIPTION',
  isActive: false,
  isInTrial: false,
  isInGracePeriod: false,
  isReadOnly: true,
  isAccessDenied: false,
  remainingTrialDays: 0,
  featureLimits: defaultFeatureLimits,
  isLoading: true
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(defaultState)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription/status')
      const data = await res.json()

      if (data.success) {
        const sub = data.subscription
        const now = new Date()

        // Determine if user is in read-only mode
        // Read-only when: not active, not in trial, and not in grace period
        const isReadOnly = !sub.isActive && !sub.isInTrial && !sub.isInGracePeriod

        setState({
          status: sub.status || 'NO_SUBSCRIPTION',
          isActive: sub.isActive || false,
          isInTrial: sub.isInTrial || false,
          isInGracePeriod: sub.isInGracePeriod || false,
          isReadOnly,
          isAccessDenied: sub.isAccessDenied || false,
          remainingTrialDays: sub.remainingTrialDays || 0,
          daysUntilExpiry: sub.daysUntilExpiry,
          daysSinceExpiry: sub.daysSinceExpiry,
          gracePeriodEnd: sub.gracePeriodEnd ? new Date(sub.gracePeriodEnd) : undefined,
          subscriptionEnd: sub.subscriptionEnd ? new Date(sub.subscriptionEnd) : undefined,
          plan: sub.plan,
          featureLimits: sub.featureLimits || defaultFeatureLimits,
          isLoading: false,
          lastChecked: now
        })
      } else {
        setState(prev => ({
          ...prev,
          status: 'NO_SUBSCRIPTION',
          isReadOnly: true,
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
      setState(prev => ({
        ...prev,
        isLoading: false
      }))
    }
  }, [])

  const checkAccess = useCallback(async (feature?: string): Promise<boolean> => {
    if (state.isActive || state.isInTrial || state.isInGracePeriod) {
      return true
    }

    // Show upgrade modal if no access
    setIsUpgradeModalOpen(true)
    return false
  }, [state.isActive, state.isInTrial, state.isInGracePeriod])

  const showUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(true)
  }, [])

  const hideUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false)
  }, [])

  // Check if user can view a specific feature (with optional count check)
  const canViewFeature = useCallback((feature: 'timetable' | 'notes' | 'focusSessions' | 'privateLessons', count?: number): boolean => {
    // Active users have full access
    if (state.isActive || state.isInTrial || state.isInGracePeriod) {
      return true
    }

    // For read-only users, check against limits
    const limits = state.featureLimits || defaultFeatureLimits
    const limit = feature === 'timetable' ? limits.timetableDays :
                  feature === 'notes' ? limits.notesLimit :
                  feature === 'focusSessions' ? limits.focusSessionsLimit :
                  limits.privateLessonsLimit

    if (count === undefined) {
      return true // Can view the feature, just limited
    }

    return count < limit
  }, [state.isActive, state.isInTrial, state.isInGracePeriod, state.featureLimits])

  // Get the limit for a specific feature
  const getFeatureLimit = useCallback((feature: 'timetable' | 'notes' | 'focusSessions' | 'privateLessons'): number => {
    const limits = state.featureLimits || defaultFeatureLimits
    return feature === 'timetable' ? limits.timetableDays :
           feature === 'notes' ? limits.notesLimit :
           feature === 'focusSessions' ? limits.focusSessionsLimit :
           limits.privateLessonsLimit
  }, [state.featureLimits])

  // Fetch subscription status on mount and route change
  useEffect(() => {
    // Skip for public routes
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/subscription', '/landing']
    if (publicRoutes.some(route => pathname?.startsWith(route))) {
      return
    }

    refresh()
  }, [pathname, refresh])

  // Refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        refresh,
        checkAccess,
        showUpgradeModal,
        hideUpgradeModal,
        isUpgradeModalOpen,
        canViewFeature,
        getFeatureLimit
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

/**
 * Hook to check if user can perform write operations
 * Returns true if subscription allows writes, shows upgrade modal if not
 */
export function useCanWrite() {
  const { isReadOnly, showUpgradeModal, isActive, isInTrial, isInGracePeriod } = useSubscription()

  const canWrite = !isReadOnly

  const requireWrite = useCallback(() => {
    if (isReadOnly) {
      showUpgradeModal()
      return false
    }
    return true
  }, [isReadOnly, showUpgradeModal])

  return { canWrite, requireWrite, isReadOnly, isActive, isInTrial, isInGracePeriod }
}
