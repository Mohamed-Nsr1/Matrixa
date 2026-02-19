'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface LoginSuccess {
  role: string
  onboardingCompleted: boolean
}

export default function LoginPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState<LoginSuccess | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: data.isNewDevice ? 'تم تسجيل الدخول من جهاز جديد' : 'مرحباً بعودتك!'
        })
        
        // Show success with manual link instead of auto-redirect
        setLoginSuccess({
          role: data.user.role,
          onboardingCompleted: data.user.onboardingCompleted
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ في تسجيل الدخول',
          description: data.error || 'تحقق من بياناتك وأعد المحاولة'
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle redirect using window.location for full page navigation
  const handleContinue = () => {
    const redirectUrl = loginSuccess?.role === 'ADMIN' 
      ? '/admin' 
      : loginSuccess?.onboardingCompleted 
        ? '/dashboard' 
        : '/onboarding'
    
    // Use full page navigation instead of client-side routing
    // This avoids issues with preview proxy environments
    window.location.href = redirectUrl
  }

  // Show success message with redirect link
  if (loginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">تم تسجيل الدخول بنجاح!</h1>
          <p className="text-muted-foreground mb-6">
            مرحباً بك في Matrixa
          </p>
          
          <div className="p-4 rounded-xl bg-card border border-border mb-6">
            <p className="text-sm text-muted-foreground mb-2">حسابك:</p>
            <p className="font-medium">{formData.email}</p>
            <p className="text-sm text-muted-foreground mt-1">
              الدور: {loginSuccess.role === 'ADMIN' ? 'مدير' : 'طالب'}
            </p>
          </div>
          
          <Button 
            className="w-full bg-primary hover:bg-primary/90" 
            size="lg"
            onClick={handleContinue}
          >
            متابعة
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
          
          <p className="mt-4 text-xs text-muted-foreground">
            إذا لم يتم توجيهك تلقائياً، اضغط على زر "متابعة"
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet to-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Matrixa</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
          <p className="text-muted-foreground">مرحباً بعودتك! سجل دخولك للمتابعة</p>
        </div>

        {/* Form Card */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="pr-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10 pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              سجل الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
