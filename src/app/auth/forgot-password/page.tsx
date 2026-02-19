'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  KeyRound, 
  Mail, 
  Loader2, 
  ArrowRight, 
  Lock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token')
  const emailFromUrl = searchParams.get('email')

  const [mode, setMode] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState(emailFromUrl || '')
  const [token, setToken] = useState(tokenFromUrl || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [devToken, setDevToken] = useState('')

  // Check if we have a token in URL on mount
  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
      setMode('reset')
      verifyToken(tokenFromUrl)
    }
  }, [tokenFromUrl])

  const verifyToken = async (tokenToVerify: string) => {
    setVerifying(true)
    try {
      const res = await fetch(`/api/auth/forgot-password?token=${tokenToVerify}`)
      const data = await res.json()
      
      if (!data.valid) {
        setError('الرمز غير صالح أو منتهي الصلاحية')
        setMode('request')
      }
    } catch {
      setError('حدث خطأ أثناء التحقق من الرمز')
      setMode('request')
    } finally {
      setVerifying(false)
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        // In development, show the token
        if (data.devToken) {
          setDevToken(data.devToken)
        }
      } else {
        setError(data.error || 'حدث خطأ')
      }
    } catch {
      setError('حدث خطأ أثناء إرسال الطلب')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'حدث خطأ')
      }
    } catch {
      setError('حدث خطأ أثناء تغيير كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحقق من الرمز...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet to-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl gradient-text">Matrixa</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {mode === 'request' ? 'تم إرسال الطلب' : 'تم تغيير كلمة المرور'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {mode === 'request' 
                  ? 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور'
                  : 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة'}
              </p>

              {/* Development only - show reset link */}
              {devToken && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-right">
                  <p className="text-amber text-sm mb-2">وضع التطوير - رابط إعادة التعيين:</p>
                  <Link 
                    href={`/auth/forgot-password?token=${devToken}&email=${encodeURIComponent(email)}`}
                    className="text-primary hover:underline text-sm break-all"
                  >
                    اضغط هنا لإعادة تعيين كلمة المرور
                  </Link>
                </div>
              )}

              <Link href="/auth/login">
                <Button className="w-full">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">
                  {mode === 'request' ? 'نسيت كلمة المرور؟' : 'إعادة تعيين كلمة المرور'}
                </h1>
                <p className="text-muted-foreground">
                  {mode === 'request' 
                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور'
                    : 'أدخل كلمة المرور الجديدة'}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {mode === 'request' ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'إرسال رابط إعادة التعيين'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="password">كلمة المرور الجديدة</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'تغيير كلمة المرور'
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <Link 
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 text-muted-foreground hover:text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>العودة لتسجيل الدخول</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
