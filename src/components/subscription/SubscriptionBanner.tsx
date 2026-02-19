'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, Clock, CreditCard, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionStatus {
  status: string
  isActive: boolean
  isInTrial: boolean
  remainingTrialDays: number
  subscriptionEnd?: string
  plan?: {
    id: string
    name: string
    nameAr: string
  }
}

interface SubscriptionBannerProps {
  onStatusChange?: (status: SubscriptionStatus) => void
}

export function SubscriptionBanner({ onStatusChange }: SubscriptionBannerProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/subscription/status')
      const data = await res.json()
      
      if (data.success) {
        setStatus(data.subscription)
        onStatusChange?.(data.subscription)
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  // Don't show banner while loading
  if (loading || !status) {
    return null
  }

  // Don't show if subscription is active (not in trial)
  if (status.isActive && !status.isInTrial) {
    return null
  }

  // Don't show if dismissed and in trial (will show again next session)
  if (dismissed && status.isInTrial) {
    return null
  }

  // Trial banner - amber/yellow theme
  if (status.isInTrial && status.remainingTrialDays > 0) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  الفترة التجريبية
                </p>
                <p className="text-xs text-muted-foreground">
                  متبقي <span className="text-amber-400 font-semibold">{status.remainingTrialDays}</span> يوم
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/subscription">
                <Button size="sm" variant="outline" className="border-amber-500/30 hover:bg-amber-500/10">
                  <CreditCard className="w-3.5 h-3.5 ml-1" />
                  اشترك الآن
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setDismissed(true)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Expired banner - red theme
  if (!status.isActive || (status.isInTrial && status.remainingTrialDays <= 0)) {
    return (
      <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-b border-red-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">
                  انتهت صلاحية الاشتراك
                </p>
                <p className="text-xs text-muted-foreground">
                  اشترك الآن للوصول إلى جميع المميزات
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/subscription">
                <Button size="sm" className="bg-red-500 hover:bg-red-600">
                  <CreditCard className="w-3.5 h-3.5 ml-1" />
                  تجديد الاشتراك
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Compact version for showing in other places
export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus | null }) {
  if (!status) return null

  if (status.isInTrial && status.remainingTrialDays > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs">
        <Clock className="w-3 h-3" />
        <span>تجريبي: {status.remainingTrialDays} يوم</span>
      </div>
    )
  }

  if (status.isActive) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
        <CreditCard className="w-3 h-3" />
        <span>مشترك</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
      <AlertCircle className="w-3 h-3" />
      <span>غير مشترك</span>
    </div>
  )
}
