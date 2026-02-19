'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Crown,
  Sparkles,
  Check,
  ArrowRight,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface UpgradeModalProps {
  feature?: string
  message?: string
}

/**
 * Upgrade Modal Component
 * 
 * Shows when user tries to perform a premium action without active subscription
 */
export default function UpgradeModal({ feature, message }: UpgradeModalProps) {
  const { isUpgradeModalOpen, hideUpgradeModal, isInTrial, remainingTrialDays, daysSinceExpiry } = useSubscription()
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setProcessingPlan(planId)
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      const data = await res.json()

      if (data.success) {
        // Simulate payment for mock mode
        setTimeout(() => {
          completePayment(planId, data.paymentId)
        }, 2000)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setProcessingPlan(null)
    }
  }

  const completePayment = async (planId: string, paymentId: string) => {
    try {
      const res = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          planId,
          success: true
        })
      })

      const data = await res.json()

      if (data.success) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Payment completion error:', error)
    } finally {
      setProcessingPlan(null)
    }
  }

  const getMessage = () => {
    if (message) return message
    if (feature) return `هذه الميزة "${feature}" تتطلب اشتراك فعال`
    if (isInTrial && remainingTrialDays <= 0) {
      return 'انتهت فترتك التجريبية - اشترك الآن للاستمرار'
    }
    if (daysSinceExpiry) {
      return `انتهى اشتراكك منذ ${daysSinceExpiry} يوم - جدد الآن لاستعادة الوصول الكامل`
    }
    return 'اشترك الآن للوصول إلى جميع المميزات'
  }

  const plans = [
    {
      id: 'monthly',
      name: 'شهري',
      price: 99,
      duration: 30,
      popular: false
    },
    {
      id: 'quarterly',
      name: 'ربع سنوي',
      price: 249,
      duration: 90,
      popular: true,
      savings: 'وفر 15%'
    },
    {
      id: 'annual',
      name: 'سنوي',
      price: 899,
      duration: 365,
      popular: false,
      savings: 'وفر 25%'
    }
  ]

  return (
    <Dialog open={isUpgradeModalOpen} onOpenChange={(open) => !open && hideUpgradeModal()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-primary">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl">ترقية الاشتراك</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {getMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:border-primary/50 ${
                plan.popular ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
              onClick={() => !processingPlan && handleSubscribe(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3 ml-1" />
                  الأفضل قيمة
                </Badge>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {plan.duration} يوم
                  </p>
                </div>

                <div className="text-left">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">ج.م</span>
                  </div>
                  {plan.savings && (
                    <span className="text-xs text-emerald-400">{plan.savings}</span>
                  )}
                </div>
              </div>

              {processingPlan === plan.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <Check className="w-4 h-4 inline ml-1 text-emerald-400" />
            جميع المميزات متضمنة
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={hideUpgradeModal}>
              لاحقاً
            </Button>
            <Button asChild>
              <Link href="/subscription">
                عرض كل الخطط
                <ArrowRight className="w-4 h-4 mr-1" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
