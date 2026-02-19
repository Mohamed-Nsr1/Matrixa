'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CreditCard,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  User,
  Image as ImageIcon,
  Loader2,
  Eye,
  X,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPlan {
  id: string
  name: string
  nameAr: string
  price: number
  durationDays: number
}

interface ManualPaymentRequest {
  id: string
  amount: number
  paymentMethod: string
  senderPhone: string | null
  senderInstaPayUsername: string | null
  receiptImageUrl: string
  status: string
  adminNotes: string | null
  followUpMessage: string | null
  createdAt: string
  plan: {
    nameAr: string
    durationDays: number
  }
}

interface PaymentSettings {
  manualPaymentEnabled: boolean
  paymobEnabled: boolean
  vodafoneCashNumber: string
  etisalatCashNumber: string
  orangeCashNumber: string
  instaPayUsername: string
  vodafoneCashEnabled: boolean
  etisalatCashEnabled: boolean
  orangeCashEnabled: boolean
  instaPayEnabled: boolean
}

const PAYMENT_METHODS = [
  { id: 'VODAFONE_CASH', name: 'فودافون كاش', icon: '📱', color: 'bg-red-500' },
  { id: 'ETISALAT_CASH', name: 'اتصالات كاش', icon: '📱', color: 'bg-green-500' },
  { id: 'ORANGE_CASH', name: 'أورنج كاش', icon: '📱', color: 'bg-orange-500' },
  { id: 'INSTAPAY', name: 'انستاباي', icon: '🏦', color: 'bg-blue-500' },
]

function ManualPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [existingRequests, setExistingRequests] = useState<ManualPaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderInstaPayUsername, setSenderInstaPayUsername] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string>('')
  const [userResponse, setUserResponse] = useState('')
  const [additionalReceiptFile, setAdditionalReceiptFile] = useState<File | null>(null)
  
  const preselectedPlanId = searchParams.get('plan')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansRes, settingsRes, requestsRes] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/payment/manual/settings'),
        fetch('/api/payment/manual')
      ])

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans || [])
        
        // Preselect plan if provided
        if (preselectedPlanId) {
          const plan = (data.plans || []).find((p: SubscriptionPlan) => p.id === preselectedPlanId)
          if (plan) setSelectedPlan(plan)
        }
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setExistingRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في تحميل البيانات'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP)'
        })
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت'
        })
        return
      }

      setReceiptFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload/receipt', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      const data = await res.json()
      return data.url
    }
    return null
  }

  const handleSubmit = async () => {
    if (!selectedPlan) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب اختيار خطة الاشتراك' })
      return
    }

    if (!paymentMethod) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب اختيار طريقة الدفع' })
      return
    }

    if (paymentMethod === 'INSTAPAY' && !senderInstaPayUsername.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب إدخال اسم المستخدم في انستاباي' })
      return
    }

    if (paymentMethod !== 'INSTAPAY' && !/^01[0-9]{9}$/.test(senderPhone)) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب إدخال رقم هاتف صحيح (01xxxxxxxxx)' })
      return
    }

    if (!receiptFile) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب رفع صورة الإيصال' })
      return
    }

    setSubmitting(true)

    try {
      // Upload receipt
      const receiptUrl = await uploadReceipt(receiptFile)
      if (!receiptUrl) {
        throw new Error('فشل في رفع الصورة')
      }

      // Submit payment request
      const res = await fetch('/api/payment/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod,
          senderPhone: paymentMethod !== 'INSTAPAY' ? senderPhone : null,
          senderInstaPayUsername: paymentMethod === 'INSTAPAY' ? senderInstaPayUsername : null,
          receiptImageUrl: receiptUrl
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'تم الإرسال',
          description: 'تم إرسال طلب الدفع بنجاح. سيتم مراجعته خلال 24 ساعة'
        })
        // Refresh data
        fetchData()
        // Reset form
        setSelectedPlan(null)
        setPaymentMethod('')
        setSenderPhone('')
        setSenderInstaPayUsername('')
        setReceiptFile(null)
        setReceiptPreview('')
      } else {
        throw new Error(data.error || 'حدث خطأ')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال الطلب'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFollowUpResponse = async (requestId: string) => {
    if (!userResponse.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب كتابة رد' })
      return
    }

    try {
      let additionalReceiptUrl: string | null = null
      if (additionalReceiptFile) {
        additionalReceiptUrl = await uploadReceipt(additionalReceiptFile)
      }

      const res = await fetch('/api/payment/manual', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          userResponse,
          additionalReceiptUrl
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'تم الإرسال', description: 'تم إرسال ردك بنجاح' })
        fetchData()
        setUserResponse('')
        setAdditionalReceiptFile(null)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">قيد المراجعة</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">تم القبول</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">مرفوض</Badge>
      case 'NEEDS_INFO':
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">يحتاج معلومات</Badge>
      case 'INFO_PROVIDED':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">تم الرد</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPaymentNumber = (method: string) => {
    if (!settings) return ''
    switch (method) {
      case 'VODAFONE_CASH':
        return settings.vodafoneCashNumber
      case 'ETISALAT_CASH':
        return settings.etisalatCashNumber
      case 'ORANGE_CASH':
        return settings.orangeCashNumber
      case 'INSTAPAY':
        return settings.instaPayUsername
      default:
        return ''
    }
  }

  const isPaymentMethodEnabled = (method: string) => {
    if (!settings) return false
    switch (method) {
      case 'VODAFONE_CASH':
        return settings.vodafoneCashEnabled
      case 'ETISALAT_CASH':
        return settings.etisalatCashEnabled
      case 'ORANGE_CASH':
        return settings.orangeCashEnabled
      case 'INSTAPAY':
        return settings.instaPayEnabled
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pendingRequest = existingRequests.find(r => 
    ['PENDING', 'NEEDS_INFO', 'INFO_PROVIDED'].includes(r.status)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/subscription')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">الدفع اليدوي</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Existing Requests */}
        {existingRequests.length > 0 && (
          <Card className="bg-slate-800/50 border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                طلباتك السابقة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-700/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{req.plan.nameAr}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.amount} جنيه - {PAYMENT_METHODS.find(m => m.id === req.paymentMethod)?.name}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  
                  {/* Receipt Preview */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(req.receiptImageUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض الإيصال
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  {/* Admin Notes */}
                  {req.adminNotes && (
                    <div className="p-3 bg-slate-600/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">ملاحظات المشرف:</p>
                      <p className="text-sm text-muted-foreground">{req.adminNotes}</p>
                    </div>
                  )}

                  {/* Follow-up Message */}
                  {req.status === 'NEEDS_INFO' && req.followUpMessage && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-orange-400" />
                        <p className="text-sm font-medium text-orange-400">رسالة من المشرف:</p>
                      </div>
                      <p className="text-sm">{req.followUpMessage}</p>
                      
                      <Textarea
                        placeholder="اكتب ردك هنا..."
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        className="bg-slate-800"
                      />
                      
                      <div className="flex items-center gap-2">
                        <Label className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAdditionalReceiptFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="w-4 h-4 ml-1" />
                              إيصال إضافي (اختياري)
                            </span>
                          </Button>
                        </Label>
                        {additionalReceiptFile && (
                          <span className="text-xs text-muted-foreground">{additionalReceiptFile.name}</span>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleFollowUpResponse(req.id)}
                        className="w-full"
                      >
                        إرسال الرد
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* If there's a pending request, don't show the form */}
        {pendingRequest ? (
          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">لديك طلب قيد المراجعة</h3>
              <p className="text-muted-foreground mb-4">
                لا يمكنك تقديم طلب جديد حتى يتم مراجعة طلبك الحالي
              </p>
              {pendingRequest.status === 'NEEDS_INFO' && (
                <p className="text-orange-400 text-sm">
                  يرجى الرد على رسالة المشرف في الأعلى
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Payment Instructions */}
            {settings?.manualPaymentEnabled && (
              <Card className="bg-slate-800/50 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    تعليمات الدفع
                  </CardTitle>
                  <CardDescription>
                    اختر طريقة الدفع المناسبة وأرسل المبلغ إلى الرقم المحدد
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {PAYMENT_METHODS.filter(m => isPaymentMethodEnabled(m.id)).map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {method.id === 'INSTAPAY' ? 'تحويل بنكي' : 'محفظة إلكترونية'}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-mono text-primary">
                            {getPaymentNumber(method.id) || 'غير محدد'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400">
                      ℹ️ بعد إرسال المبلغ، التقط صورة واضحة للإيصال أو لقطة شاشة وأرفقها في الطلب
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Form */}
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">تقديم طلب الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Selection */}
                <div className="space-y-2">
                  <Label>اختر خطة الاشتراك</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-lg border text-right transition-all ${
                          selectedPlan?.id === plan.id
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 bg-slate-700/30 hover:bg-slate-700/50'
                        }`}
                      >
                        <p className="font-medium">{plan.nameAr}</p>
                        <p className="text-2xl font-bold text-primary">{plan.price} ج</p>
                        <p className="text-xs text-muted-foreground">{plan.durationDays} يوم</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_METHODS.filter(m => isPaymentMethodEnabled(m.id)).map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-lg border text-right transition-all ${
                          paymentMethod === method.id
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 bg-slate-700/30 hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="text-xl">{method.icon}</span>
                        <p className="font-medium text-sm mt-1">{method.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sender Info */}
                {paymentMethod && (
                  <div className="space-y-2">
                    <Label>
                      {paymentMethod === 'INSTAPAY' 
                        ? 'اسم المستخدم في انستاباي' 
                        : 'رقم الهاتف المرسل منه'}
                    </Label>
                    <div className="relative">
                      {paymentMethod === 'INSTAPAY' ? (
                        <Input
                          value={senderInstaPayUsername}
                          onChange={(e) => setSenderInstaPayUsername(e.target.value)}
                          placeholder="@username"
                          className="bg-slate-700/50"
                        />
                      ) : (
                        <Input
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="01xxxxxxxxx"
                          className="bg-slate-700/50"
                          dir="ltr"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {paymentMethod === 'INSTAPAY'
                        ? 'أدخل اسم المستخدم الذي أرسلت منه التحويل'
                        : 'أدخل رقم الهاتف الذي أرسلت منه المبلغ'}
                    </p>
                  </div>
                )}

                {/* Receipt Upload */}
                <div className="space-y-2">
                  <Label>صورة الإيصال</Label>
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
                    {receiptPreview ? (
                      <div className="relative">
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 w-8 h-8"
                          onClick={() => {
                            setReceiptFile(null)
                            setReceiptPreview('')
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">اضغط لرفع الصورة</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, WebP - حتى 10MB
                        </p>
                      </Label>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      إرسال طلب الدفع
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            سيتم مراجعة طلبك خلال 24 ساعة عمل. في حالة القبول، سيتم تفعيل اشتراكك فوراً.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            للاستفسارات، يرجى التواصل مع الدعم الفني
          </p>
        </div>
      </main>
    </div>
  )
}

export default function ManualPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    }>
      <ManualPaymentContent />
    </Suspense>
  )
}
