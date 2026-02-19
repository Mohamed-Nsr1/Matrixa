'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader2, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [inviteOnly, setInviteOnly] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  })

  // Check if invite-only mode is enabled
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings?.inviteOnlyMode) {
          setInviteOnly(true)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمتا المرور غير متطابقتين'
      })
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          inviteCode: formData.inviteCode || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'تم إنشاء الحساب بنجاح',
          description: 'مرحباً بك في Matrixa!'
        })
        // Use full page navigation to ensure middleware sees new cookies
        window.location.href = '/onboarding'
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ في إنشاء الحساب',
          description: data.error || 'حدث خطأ، أعد المحاولة'
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet to-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Matrixa</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
          <p className="text-muted-foreground">ابدأ رحلتك الدراسية معنا</p>
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
              <p className="text-xs text-muted-foreground">8 أحرف على الأقل</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {inviteOnly && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode">كود الدعوة</Label>
                <div className="relative">
                  <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="XXXX-XXXX"
                    className="pr-10"
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                    required
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground">التسجيل بالدعوة فقط</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              سجل دخولك
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          بإنشاء حساب، أنت توافق على{' '}
          <Link href="/terms" className="hover:underline">شروط الاستخدام</Link>
          {' '}و{' '}
          <Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link>
        </p>
      </div>
    </div>
  )
}
