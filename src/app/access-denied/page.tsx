'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Lock, Shield, ArrowRight, Clock, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionPlan {
  id: string
  name: string
  nameAr: string
  price: number
  durationDays: number
  features?: string[]
}

function AccessDeniedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  const reason = searchParams.get('reason') || 'subscription_expired'
  const daysSince = searchParams.get('days')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscription/plans')
      const data = await res.json()
      if (data.success) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) return
    
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id })
      })
      
      const data = await res.json()
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error('Payment error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      <div className="relative max-w-4xl w-full space-y-6">
        {/* Header Card */}
        <Card className="border-red-500/30 bg-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              تم حجب الوصول
            </h1>
            
            <p className="text-lg text-gray-300 mb-6">
              انتهت صلاحية اشتراكك وتم حجب الوصول إلى حسابك
            </p>

            <div className="bg-slate-700/50 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center gap-3 justify-center text-gray-300">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>بياناتك محفوظة وآمنة</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                جميع ملاحظاتك وجلساتك وتقدمك محفوظة. قم بتجديد الاشتراك لاستعادة الوصول الكامل.
              </p>
            </div>

            {daysSince && (
              <p className="text-sm text-gray-400 mt-4">
                مر {daysSince} يوم منذ انتهاء اشتراكك
              </p>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white text-center">
            اختر خطة الاشتراك المناسبة
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <Card className="bg-slate-800/50">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">لا توجد خطط متاحة حالياً</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push('/auth/login')}
                >
                  العودة لتسجيل الدخول
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedPlan?.id === plan.id 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                      : 'bg-slate-800/50 hover:bg-slate-700/50 border-transparent'
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-white">{plan.nameAr}</CardTitle>
                    <CardDescription>{plan.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 mr-1">جنيه</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {plan.durationDays} يوم
                    </p>
                    {plan.features && plan.features.length > 0 && (
                      <ul className="mt-4 space-y-2 text-right">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Subscribe Button */}
        {selectedPlan && (
          <Card className="bg-slate-800/50 border-primary/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-white font-medium">
                    الخطة المختارة: {selectedPlan.nameAr}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedPlan.price} جنيه
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto"
                  onClick={handleSubscribe}
                >
                  اشترك الآن
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-medium text-white mb-1">بياناتك محفوظة</h3>
              <p className="text-xs text-gray-400">
                جميع بياناتك تبقى محفوظة حتى بعد انتهاء الاشتراك
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="font-medium text-white mb-1">تفعيل فوري</h3>
              <p className="text-xs text-gray-400">
                يتم تفعيل اشتراكك فوراً بعد إتمام الدفع
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="font-medium text-white mb-1">دفع آمن</h3>
              <p className="text-xs text-gray-400">
                جميع المعاملات مشفرة وآمنة عبر Paymob
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-500">
          <p>
            هل تحتاج مساعدة؟{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              تواصل معنا
            </Link>
            {' '}|{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              تسجيل الخروج
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  )
}
