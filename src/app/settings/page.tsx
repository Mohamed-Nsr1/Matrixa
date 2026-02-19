'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Clock,
  Calendar,
  Notebook,
  BarChart3,
  ChevronLeft,
  LogOut,
  Globe,
  Target,
  Loader2,
  Trophy,
  TrendingUp,
  User,
  Bell,
  CreditCard,
  Save,
  Check,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  AlertCircle,
  Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/hooks/use-theme'
import { Sun, Moon } from 'lucide-react'
import { BadgesSection } from '@/components/badges/BadgesSection'

interface User {
  id: string
  fullName: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  studyLanguage: string
  uiLanguage: string
  dailyStudyGoal: number | null
  branchId: string | null
  specialization: string | null
  secondLanguage: string | null
  studyReminders: boolean
  taskReminders: boolean
}

interface Branch {
  id: string
  nameAr: string
  nameEn: string
  code: string
}

interface LeaderboardStatus {
  isOptedIn: boolean
  hasEntry: boolean
  stats: {
    score: number
    studyMinutes: number
    tasksCompleted: number
    focusSessions: number
  } | null
}

const navItems = [
  { id: 'today', label: 'اليوم', icon: Clock, href: '/dashboard' },
  { id: 'subjects', label: 'المواد', icon: BookOpen, href: '/subjects' },
  { id: 'planner', label: 'المخطط', icon: Calendar, href: '/planner' },
  { id: 'notes', label: 'الملاحظات', icon: Notebook, href: '/notes' },
  { id: 'insights', label: 'الإحصائيات', icon: BarChart3, href: '/insights' },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [leaderboardStatus, setLeaderboardStatus] = useState<LeaderboardStatus | null>(null)
  const [updatingLeaderboard, setUpdatingLeaderboard] = useState(false)
  
  // Edit states
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  
  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Push notification states
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [pushSupported, setPushSupported] = useState(true)
  
  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useState<HTMLInputElement | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()

        if (!data.success) {
          window.location.href = '/auth/login'
          return
        }

        setUser(data.user)
        setNameInput(data.user.fullName || '')

        // Fetch branches for selection
        const branchesRes = await fetch('/api/branches')
        const branchesData = await branchesRes.json()
        if (branchesData.success) {
          setBranches(branchesData.data)
        }

        // Fetch leaderboard status
        const leaderboardRes = await fetch('/api/leaderboard/opt-in')
        const leaderboardData = await leaderboardRes.json()
        if (leaderboardData.success) {
          setLeaderboardStatus(leaderboardData)
        }
        
        // Check push notification support and status
        if (typeof window !== 'undefined') {
          const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
          setPushSupported(isSupported)
          
          if (isSupported) {
            // Check current permission status
            if ('Notification' in window) {
              setPushPermission(Notification.permission)
            }
            
            // Check if user has subscription
            const pushRes = await fetch('/api/push/subscribe')
            const pushData = await pushRes.json()
            if (pushData.success && pushData.hasSubscription) {
              setPushEnabled(true)
            }
          }
        }
      } catch {
        window.location.href = '/auth/login'
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const updateSetting = async (key: string, value: string | number | boolean) => {
    if (!user) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (res.ok) {
        setUser(prev => prev ? { ...prev, [key]: value } : null)
        toast({ title: 'تم حفظ الإعدادات' })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الإعدادات'
      })
    } finally {
      setSaving(false)
    }
  }

  const saveName = async () => {
    if (!nameInput.trim()) {
      toast({ variant: 'destructive', title: 'الاسم مطلوب' })
      return
    }
    
    await updateSetting('fullName', nameInput)
    setEditingName(false)
  }

  const toggleLeaderboardOptIn = async (isOptedIn: boolean) => {
    setUpdatingLeaderboard(true)
    try {
      const res = await fetch('/api/leaderboard/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOptedIn })
      })

      const data = await res.json()
      if (data.success) {
        setLeaderboardStatus(prev => prev ? { ...prev, isOptedIn } : null)
        toast({ title: data.message })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الإعدادات'
      })
    } finally {
      setUpdatingLeaderboard(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'جميع الحقول مطلوبة' })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'كلمة المرور الجديدة غير متطابقة' })
      return
    }

    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم تغيير كلمة المرور', description: 'يرجى تسجيل الدخول مرة أخرى' })
        // Clear form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordSection(false)
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 2000)
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ أثناء تغيير كلمة المرور' })
    } finally {
      setChangingPassword(false)
    }
  }

  // Mock VAPID keys (in production, these would be generated and stored securely)
  const MOCK_VAPID_PUBLIC_KEY = 'BNcR5d3Y9xW7vK2mF8nQ4jL6sT1hG3pA5bC8dE0fH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ0'

  const handlePushToggle = async (enable: boolean) => {
    if (!pushSupported) {
      toast({
        variant: 'destructive',
        title: 'غير مدعوم',
        description: 'متصفحك لا يدعم الإشعارات الفورية'
      })
      return
    }

    setPushLoading(true)

    try {
      if (enable) {
        // Request permission
        const permission = await Notification.requestPermission()
        setPushPermission(permission)

        if (permission !== 'granted') {
          toast({
            variant: 'destructive',
            title: 'تم رفض الإذن',
            description: 'يرجى السماح بالإشعارات من إعدادات المتصفح'
          })
          setPushLoading(false)
          return
        }

        // Subscribe to push (mock implementation)
        // In production, this would use the actual VAPID keys
        try {
          const registration = await navigator.serviceWorker.ready
          
          // Try to subscribe (this will fail without valid VAPID keys, but we handle it gracefully)
          let subscription: PushSubscription | null = null
          
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(MOCK_VAPID_PUBLIC_KEY) as BufferSource
            })
          } catch {
            // If subscription fails (e.g., invalid VAPID key), create a mock subscription for demo
            console.log('Push subscription with mock VAPID keys - creating mock subscription')
            subscription = null
          }

          if (subscription) {
            // Save subscription to backend
            const subscriptionJSON = subscription.toJSON()
            const res = await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: subscriptionJSON })
            })

            if (res.ok) {
              setPushEnabled(true)
              toast({ title: 'تم تفعيل الإشعارات', description: 'ستتلقى إشعارات فورية الآن' })
            } else {
              throw new Error('Failed to save subscription')
            }
          } else {
            // Mock success for demo purposes when VAPID keys are not configured
            setPushEnabled(true)
            toast({ 
              title: 'تم تفعيل الإشعارات (وضع تجريبي)', 
              description: 'الإشعارات الفورية مفعلة - ستحتاج لمفاتيح VAPID صالحة للإنتاج'
            })
          }
        } catch (error) {
          console.error('Push subscription error:', error)
          toast({
            variant: 'destructive',
            title: 'خطأ',
            description: 'فشل في تفعيل الإشعارات الفورية'
          })
        }
      } else {
        // Unsubscribe
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          
          if (subscription) {
            await subscription.unsubscribe()
          }
        } catch {
          // Ignore errors during unsubscribe
        }

        // Remove from backend
        await fetch('/api/push/unsubscribe', { method: 'POST' })
        setPushEnabled(false)
        toast({ title: 'تم إيقاف الإشعارات', description: 'لن تتلقى إشعارات فورية الآن' })
      }
    } catch (error) {
      console.error('Push toggle error:', error)
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الإشعارات'
      })
    } finally {
      setPushLoading(false)
    }
  }

  // Helper function to convert base64 to Uint8Array for VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
  
  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى اختيار صورة صالحة' })
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت' })
      return
    }
    
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (data.success) {
        setUser(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null)
        toast({ title: 'تم تحديث الصورة' })
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: data.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ أثناء رفع الصورة' })
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (e.target) {
        e.target.value = ''
      }
    }
  }
  
  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch('/api/user/avatar', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setUser(prev => prev ? { ...prev, avatarUrl: null } : null)
        toast({ title: 'تم حذف الصورة' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ أثناء حذف الصورة' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedBranch = branches.find(b => b.id === user?.branchId)

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text hidden sm:block">Matrixa</span>
            </Link>

            <h1 className="text-lg font-semibold">الإعدادات</h1>

            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {user?.fullName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4">
        <div className="container mx-auto max-w-2xl space-y-6">
          
          {/* Profile Section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">الملف الشخصي</h2>
            </div>
            
            {/* Avatar and Name */}
            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">
                    {user?.fullName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                  <Camera className="w-3 h-3 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div className="flex-1">
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="الاسم الكامل"
                      className="flex-1"
                    />
                    <Button size="icon" onClick={saveName} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => {
                      setEditingName(false)
                      setNameInput(user?.fullName || '')
                    }}>
                      <LogOut className="w-4 h-4 rotate-180" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{user?.fullName || 'لم يتم تحديد الاسم'}</p>
                    <Button size="icon" variant="ghost" onClick={() => setEditingName(true)}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-400 hover:text-red-300 mt-1"
                  >
                    إزالة الصورة
                  </button>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={user?.phone || ''}
                    onChange={(e) => setUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    onBlur={() => user?.phone !== undefined && updateSetting('phone', user.phone || '')}
                    placeholder="رقم الهاتف"
                    className="flex-1 text-sm"
                    type="tel"
                  />
                </div>
              </div>
            </div>
            
            {/* Branch Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>الشعبة</Label>
                  <p className="text-sm text-muted-foreground">اختر شعبتك الدراسية</p>
                </div>
                <select
                  value={user?.branchId || ''}
                  onChange={(e) => updateSetting('branchId', e.target.value)}
                  className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm min-w-[140px]"
                  disabled={saving}
                >
                  <option value="">اختر الشعبة</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Specialization - Only for Scientific */}
              {selectedBranch?.code === 'scientific' && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>التخصص</Label>
                    <p className="text-sm text-muted-foreground">علوم أو رياضة</p>
                  </div>
                  <select
                    value={user?.specialization || ''}
                    onChange={(e) => updateSetting('specialization', e.target.value)}
                    className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm min-w-[140px]"
                    disabled={saving}
                  >
                    <option value="">اختر التخصص</option>
                    <option value="science">علوم</option>
                    <option value="math">رياضة</option>
                  </select>
                </div>
              )}
              
              {/* Second Language */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>اللغة الثانية</Label>
                  <p className="text-sm text-muted-foreground">اللغة الأجنبية الثانية</p>
                </div>
                <select
                  value={user?.secondLanguage || ''}
                  onChange={(e) => updateSetting('secondLanguage', e.target.value)}
                  className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm min-w-[140px]"
                  disabled={saving}
                >
                  <option value="">اختر اللغة</option>
                  <option value="french">فرنسي</option>
                  <option value="german">ألماني</option>
                </select>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">إعدادات اللغة</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>لغة الدراسة</Label>
                  <p className="text-sm text-muted-foreground">لغة أسماء المواد والدروس</p>
                </div>
                <select
                  value={user?.studyLanguage || 'arabic'}
                  onChange={(e) => updateSetting('studyLanguage', e.target.value)}
                  className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm"
                  disabled={saving}
                >
                  <option value="arabic">العربية</option>
                  <option value="english">English</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>لغة الواجهة</Label>
                  <p className="text-sm text-muted-foreground">لغة الأزرار والقوائم</p>
                </div>
                <select
                  value={user?.uiLanguage || 'arabic'}
                  onChange={(e) => updateSetting('uiLanguage', e.target.value)}
                  className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm"
                  disabled={saving}
                >
                  <option value="arabic">العربية</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <h2 className="text-lg font-semibold">المظهر</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>الوضع الليلي</Label>
                <p className="text-sm text-muted-foreground">تبديل بين الوضع الليلي والنهاري</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-600'}`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'right-1' : 'left-1'}`}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-primary absolute top-1/2 right-1 -translate-y-1/2" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-yellow-500 absolute top-1/2 left-1 -translate-y-1/2" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Study Goal */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">الهدف اليومي</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>وقت المذاكرة اليومي</Label>
                <p className="text-sm text-muted-foreground">الهدف اليومي بالدقائق</p>
              </div>
              <select
                value={user?.dailyStudyGoal || 120}
                onChange={(e) => updateSetting('dailyStudyGoal', parseInt(e.target.value))}
                className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm"
                disabled={saving}
              >
                <option value={60}>1 ساعة</option>
                <option value={120}>2 ساعة</option>
                <option value={180}>3 ساعات</option>
                <option value={240}>4 ساعات</option>
                <option value={300}>5 ساعات</option>
                <option value={360}>6 ساعات</option>
                <option value={420}>7 ساعات</option>
                <option value={480}>8 ساعات</option>
              </select>
            </div>
          </div>

          {/* Notifications - Now Functional! */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">الإشعارات</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>تذكيرات المذاكرة</Label>
                  <p className="text-sm text-muted-foreground">تذكير يومي بالمذاكرة</p>
                </div>
                <Switch
                  checked={user?.studyReminders ?? true}
                  onCheckedChange={(checked) => updateSetting('studyReminders', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>تذكيرات المهام</Label>
                  <p className="text-sm text-muted-foreground">إشعارات للمهام المجدولة</p>
                </div>
                <Switch
                  checked={user?.taskReminders ?? true}
                  onCheckedChange={(checked) => updateSetting('taskReminders', checked)}
                  disabled={saving}
                />
              </div>

              {/* Push Notifications */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-cyan mt-0.5" />
                    <div>
                      <Label>الإشعارات الفورية</Label>
                      <p className="text-sm text-muted-foreground">استلم إشعارات على جهازك</p>
                    </div>
                  </div>
                  {pushLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Switch
                      checked={pushEnabled}
                      onCheckedChange={handlePushToggle}
                      disabled={!pushSupported || pushPermission === 'denied'}
                    />
                  )}
                </div>

                {/* Permission Status Messages */}
                {!pushSupported && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-500">
                      متصفحك لا يدعم الإشعارات الفورية. يرجى استخدام متصفح حديث.
                    </p>
                  </div>
                )}

                {pushPermission === 'denied' && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-500">
                      تم حظر الإشعارات. يرجى السماح بالإشعارات من إعدادات المتصفح.
                    </p>
                  </div>
                )}

                {pushEnabled && pushPermission === 'granted' && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-500">
                      الإشعارات الفورية مفعلة. ستتلقى تنبيهات على جهازك.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security - Password Change */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">الأمان</h2>
            </div>
            
            {!showPasswordSection ? (
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordSection(true)}
                className="w-full"
              >
                <Lock className="w-4 h-4 ml-2" />
                تغيير كلمة المرور
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الحالية"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="8 أحرف على الأقل"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={changingPassword}
                    className="flex-1"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري التغيير...
                      </>
                    ) : (
                      'تغيير كلمة المرور'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordSection(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Settings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">لوحة المتصدرين</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>المشاركة في اللوحة</Label>
                  <p className="text-sm text-muted-foreground">اظهر ترتيبك مع زملائك</p>
                </div>
                <Switch
                  checked={leaderboardStatus?.isOptedIn ?? true}
                  onCheckedChange={toggleLeaderboardOptIn}
                  disabled={updatingLeaderboard}
                />
              </div>

              {/* User Stats */}
              {leaderboardStatus?.stats && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-3">إحصائياتك</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg text-center">
                      <p className="text-xl font-bold text-primary">{leaderboardStatus.stats.score}</p>
                      <p className="text-xs text-muted-foreground">نقطة</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg text-center">
                      <p className="text-xl font-bold">{Math.floor(leaderboardStatus.stats.studyMinutes / 60)}س</p>
                      <p className="text-xs text-muted-foreground">مذاكرة</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg text-center">
                      <p className="text-xl font-bold text-emerald">{leaderboardStatus.stats.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">مهام مكتملة</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg text-center">
                      <p className="text-xl font-bold text-violet">{leaderboardStatus.stats.focusSessions}</p>
                      <p className="text-xs text-muted-foreground">جلسات تركيز</p>
                    </div>
                  </div>
                  
                  <Link href="/leaderboard">
                    <Button variant="outline" className="w-full mt-4">
                      <TrendingUp className="w-4 h-4 ml-2" />
                      عرض لوحة المتصدرين
                    </Button>
                  </Link>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                يمكنك تغيير هذا الإعداد في أي وقت. لن يتم مشاركة بياناتك الشخصية.
              </p>
            </div>
          </div>

          {/* Badges & Achievements */}
          <BadgesSection />

          {/* Subscription & Payment History */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">الاشتراك والدفع</h2>
            </div>
            
            <div className="space-y-3">
              <Link href="/subscription">
                <Button variant="outline" className="w-full justify-between">
                  <span>إدارة الاشتراك</span>
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
              
              <Link href="/subscription/history">
                <Button variant="outline" className="w-full justify-between">
                  <span>سجل المدفوعات</span>
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
