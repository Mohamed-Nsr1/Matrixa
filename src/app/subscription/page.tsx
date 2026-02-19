'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

interface Plan {
  id: string
  name: string
  nameAr: string
  description: string | null
  descriptionAr: string | null
  price: number
  durationDays: number
  features: string | null
}

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
    price: number
    durationDays: number
  }
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  const reason = searchParams.get('reason')
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statusRes, plansRes] = await Promise.all([
        fetch('/api/subscription/status'),
        fetch('/api/subscription/plans')
      ])

      const statusData = await statusRes.json()
      const plansData = await plansRes.json()

      if (statusData.success) {
        setStatus(statusData.subscription)
      }

      if (plansData.success) {
        setPlans(plansData.plans)
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في تحميل البيانات'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    setProcessingPlan(plan.id)
    setSelectedPlan(plan)

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id })
      })

      const data = await res.json()

      if (data.success) {
        // In mock mode, simulate payment completion
        toast({
          title: 'جاري معالجة الدفع...',
          description: 'سيتم توجيهك إلى صفحة الدفع'
        })

        // Simulate payment completion for mock mode
        setTimeout(() => {
          completePayment(plan.id, data.paymentId)
        }, 2000)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في بدء عملية الدفع'
      })
      setProcessingPlan(null)
      setSelectedPlan(null)
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
        toast({
          title: 'تم الاشتراك بنجاح!',
          description: 'مرحباً بك في Matrixa'
        })
        
        // Redirect after successful subscription
        setTimeout(() => {
          window.location.href = redirect || '/dashboard'
        }, 1500)
      } else {
        throw new Error(data.error)
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في إكمال الاشتراك'
      })
    } finally {
      setProcessingPlan(null)
      setSelectedPlan(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={redirect || '/dashboard'}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Link>
          
          <h1 className="text-2xl font-bold mb-2">الاشتراك</h1>
          <p className="text-muted-foreground">
            اختر الخطة المناسبة لك واستمتع بجميع مميزات Matrixa
          </p>
        </div>

        {/* Current Status */}
        {status && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {status.isInTrial && status.remainingTrialDays > 0 ? (
                    <div className="p-3 rounded-xl bg-amber-500/10">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                  ) : status.isActive ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10">
                      <Check className="w-6 h-6 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-500/10">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold">حالة الاشتراك</h3>
                    {status.isInTrial && status.remainingTrialDays > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        فترة تجريبية - متبقي <span className="text-amber-400 font-medium">{status.remainingTrialDays}</span> يوم
                      </p>
                    ) : status.isActive ? (
                      <p className="text-sm text-muted-foreground">
                        مشترك - {status.plan?.nameAr || 'خطة نشطة'}
                      </p>
                    ) : (
                      <p className="text-sm text-red-400">
                        انتهت صلاحية الاشتراك
                      </p>
                    )}
                  </div>
                </div>

                {status.isInTrial && status.remainingTrialDays > 0 && (
                  <div className="w-full md:w-48">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">الفترة التجريبية</span>
                      <span>{status.remainingTrialDays} يوم</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (status.remainingTrialDays / 14) * 100)} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning Banner */}
        {reason === 'no_subscription' && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm">
                يجب الاشتراك للوصول إلى هذه الصفحة
              </p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="py-12 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  لا توجد خطط متاحة حالياً
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  يرجى التواصل مع الإدارة
                </p>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan, index) => (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden ${
                  index === 1 ? 'border-primary/50' : ''
                }`}
              >
                {index === 1 && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet to-primary" />
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.nameAr}</CardTitle>
                    {index === 1 && (
                      <Badge className="bg-primary/10 text-primary">
                        <Sparkles className="w-3 h-3 ml-1" />
                        الأكثر شيوعاً
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{plan.descriptionAr || plan.name}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Price */}
                  <div>
                    <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-muted-foreground text-sm mr-2">
                      / {plan.durationDays} يوم
                    </span>
                  </div>

                  {/* Features */}
                  {plan.features && (
                    <ul className="space-y-2">
                      {JSON.parse(plan.features).map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Default Features */}
                  {!plan.features && (
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400" />
                        الوصول الكامل لجميع المواد
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400" />
                        تتبع التقدم والإحصائيات
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400" />
                        جلسات التركيز
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400" />
                        المخطط الأسبوعي
                      </li>
                    </ul>
                  )}

                  {/* Subscribe Button */}
                  <Button
                    className="w-full"
                    variant={index === 1 ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    disabled={!!processingPlan}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 ml-2" />
                        اشترك الآن
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          الدفع آمن عبر Paymob • يمكنك الإلغاء في أي وقت
        </p>
      </div>
    </div>
  )
}
