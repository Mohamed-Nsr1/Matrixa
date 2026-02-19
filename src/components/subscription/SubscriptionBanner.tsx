'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Clock,
  Crown,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface SubscriptionBannerProps {
  className?: string
  dismissible?: boolean
  variant?: 'banner' | 'card'
}

/**
 * Subscription Banner Component
 * 
 * Shows contextual messages based on subscription status:
 * - Trial: Shows remaining days with progress
 * - Grace Period: Warning that subscription expired but still has access
 * - Expired: Read-only mode with upgrade prompt
 */
export default function SubscriptionBanner({
  className,
  dismissible = true,
  variant = 'banner'
}: SubscriptionBannerProps) {
  const { status, isInTrial, isInGracePeriod, isReadOnly, remainingTrialDays, daysSinceExpiry, gracePeriodEnd, isLoading } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if loading or active subscription
  if (isLoading || status === 'ACTIVE') {
    return null
  }

  // Don't show if dismissed
  if (dismissed) {
    return null
  }

  // Calculate grace period remaining
  const getGracePeriodRemaining = () => {
    if (!gracePeriodEnd) return 0
    const now = new Date()
    const end = new Date(gracePeriodEnd)
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const graceRemaining = getGracePeriodRemaining()

  // Banner content based on status
  const getContent = () => {
    if (isInTrial && remainingTrialDays > 0) {
      return {
        icon: <Sparkles className="w-5 h-5" />,
        title: 'الفترة التجريبية',
        description: `متبقي ${remainingTrialDays} يوم - اشترك الآن للاستمرار في استخدام جميع المميزات`,
        progress: Math.max(0, 100 - (remainingTrialDays / 14) * 100),
        progressLabel: `${remainingTrialDays} يوم متبقي`,
        variant: 'trial' as const,
        cta: 'اشترك الآن',
        ctaLink: '/subscription'
      }
    }

    if (isInGracePeriod) {
      return {
        icon: <Clock className="w-5 h-5" />,
        title: 'انتهى الاشتراك',
        description: `متبقي ${graceRemaining} أيام للتجديد - بعد ذلك ستصبح حسابك للقراءة فقط`,
        progress: Math.max(0, 100 - (graceRemaining / 7) * 100),
        progressLabel: `${graceRemaining} يوم متبقي`,
        variant: 'warning' as const,
        cta: 'جدد الآن',
        ctaLink: '/subscription'
      }
    }

    if (isReadOnly) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'وضع القراءة فقط',
        description: 'انتهى اشتراكك - يمكنك عرض بياناتك ولكن لا يمكنك تعديلها. جدد اشتراكك لاستعادة الوصول الكامل.',
        progress: undefined,
        progressLabel: undefined,
        variant: 'error' as const,
        cta: 'جدد الاشتراك',
        ctaLink: '/subscription'
      }
    }

    return null
  }

  const content = getContent()
  if (!content) return null

  const variantStyles = {
    trial: {
      bg: 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent',
      border: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      buttonVariant: 'default' as const
    },
    warning: {
      bg: 'bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent',
      border: 'border-orange-500/20',
      iconColor: 'text-orange-400',
      titleColor: 'text-orange-300',
      buttonVariant: 'default' as const
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent',
      border: 'border-red-500/20',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
      buttonVariant: 'destructive' as const
    }
  }

  const styles = variantStyles[content.variant]

  if (variant === 'card') {
    return (
      <Card className={cn(
        'relative overflow-hidden border',
        styles.bg,
        styles.border,
        className
      )}>
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-lg bg-white/5', styles.iconColor)}>
              {content.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={cn('font-semibold mb-1', styles.titleColor)}>
                {content.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {content.description}
              </p>

              {content.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{content.progressLabel}</span>
                    <span>{Math.round(content.progress)}%</span>
                  </div>
                  <Progress value={content.progress} className="h-1.5" />
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Button asChild size="sm" variant={styles.buttonVariant}>
                  <Link href={content.ctaLink}>
                    <Crown className="w-4 h-4 ml-1" />
                    {content.cta}
                  </Link>
                </Button>
              </div>
            </div>

            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setDismissed(true)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Banner variant
  return (
    <div className={cn(
      'relative overflow-hidden border-b',
      styles.bg,
      styles.border,
      className
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('shrink-0', styles.iconColor)}>
              {content.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('font-medium text-sm', styles.titleColor)}>
                  {content.title}
                </span>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {content.description}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setDismissed(true)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button asChild size="sm" variant={styles.buttonVariant}>
              <Link href={content.ctaLink}>
                {content.cta}
                <ArrowRight className="w-4 h-4 mr-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
