'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  BarChart3, 
  Notebook,
  Settings,
  LogOut,
  Flame,
  Plus,
  Zap,
  Play,
  Check,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { FocusSuggestions } from '@/components/insights/FocusSuggestions'
import { ExamCountdown } from '@/components/dashboard/ExamCountdown'

// Types
interface Task {
  id: string
  title: string
  taskType: 'VIDEO' | 'QUESTIONS' | 'REVISION'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  duration: number
  lesson?: {
    nameAr: string
    nameEn: string
    unit: {
      subject: {
        nameAr: string
        nameEn: string
        color: string | null
      }
    }
  }
}

interface User {
  id: string
  fullName: string | null
  email: string
  studyLanguage: string
  dailyStudyGoal: number | null
}

interface Streak {
  currentStreak: number
  longestStreak: number
}

// Navigation items
const navItems = [
  { id: 'today', label: 'اليوم', labelEn: 'Today', icon: Clock, href: '/dashboard' },
  { id: 'subjects', label: 'المواد', labelEn: 'Subjects', icon: BookOpen, href: '/subjects' },
  { id: 'planner', label: 'المخطط', labelEn: 'Planner', icon: Calendar, href: '/planner' },
  { id: 'notes', label: 'الملاحظات', labelEn: 'Notes', icon: Notebook, href: '/notes' },
  { id: 'insights', label: 'الإحصائيات', labelEn: 'Insights', icon: BarChart3, href: '/insights' },
]

// Task type labels
const taskTypeLabels = {
  VIDEO: { ar: 'شرح', en: 'Video', color: 'text-emerald' },
  QUESTIONS: { ar: 'حل', en: 'Questions', color: 'text-blue' },
  REVISION: { ar: 'مراجعة', en: 'Revision', color: 'text-violet' }
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [examDate, setExamDate] = useState<string | null>(null)
  const [focusTimer, setFocusTimer] = useState<{
    active: boolean
    minutes: number
    task: Task | null
  }>({
    active: false,
    minutes: 25,
    task: null
  })

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Dashboard] Fetching user data...')
        const res = await fetch('/api/auth/me')
        console.log('[Dashboard] Response status:', res.status)
        const data = await res.json()
        console.log('[Dashboard] Response data:', { success: data.success, hasUser: !!data.user })

        if (data.success) {
          setUser(data.user)
          setStreak(data.streak)
          console.log('[Dashboard] User loaded successfully')
        } else {
          console.log('[Dashboard] Not authenticated, redirecting to login')
          // Use full page navigation to ensure middleware runs
          window.location.href = '/auth/login'
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching user:', error)
        // Use full page navigation to ensure middleware runs
        window.location.href = '/auth/login'
      } finally {
        setLoading(false)
        console.log('[Dashboard] Loading complete')
      }
    }

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[Dashboard] Timeout reached, forcing loading to complete')
      setLoading(false)
    }, 10000) // 10 seconds timeout

    fetchData()

    return () => clearTimeout(timeout)
  }, []) // Remove router dependency since we're using window.location

  // Fetch today's tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks/today')
        const data = await res.json()
        if (data.success) {
          setTodayTasks(data.tasks)
        }
      } catch (error) {
        // Handle silently
      }
    }

    // Fetch exam date
    const fetchExamDate = async () => {
      try {
        const res = await fetch('/api/settings/exam-date')
        const data = await res.json()
        if (data.success) {
          setExamDate(data.examDate)
        }
      } catch (error) {
        // Handle silently - component will use default
      }
    }

    if (user) {
      fetchTasks()
      fetchExamDate()
    }
  }, [user])

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const totalMinutes = todayTasks.reduce((sum, task) => sum + task.duration, 0)
    const completedMinutes = todayTasks
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, task) => sum + task.duration, 0)
    const completedCount = todayTasks.filter(t => t.status === 'COMPLETED').length
    const dailyGoal = user?.dailyStudyGoal || 120
    const progressPercent = Math.min(100, Math.round((completedMinutes / dailyGoal) * 100))

    return {
      totalMinutes,
      completedMinutes,
      completedCount,
      totalCount: todayTasks.length,
      remainingMinutes: totalMinutes - completedMinutes,
      progressPercent
    }
  }, [todayTasks, user])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}د`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}س ${mins}د` : `${hours}س`
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const handleStartFocus = (task: Task) => {
    setFocusTimer({ active: true, minutes: 25, task })
  }

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        setTodayTasks(tasks =>
          tasks.map(t =>
            t.id === taskId ? { ...t, status: data.status } : t
          )
        )
        toast({
          title: data.status === 'COMPLETED' ? 'تم إكمال المهمة!' : 'تم إعادة فتح المهمة'
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث المهمة'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text hidden sm:block">Matrixa</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.id === 'today'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {user?.studyLanguage === 'arabic' ? item.label : item.labelEn}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Streak */}
              {streak && streak.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-sm">
                  <Flame className="w-4 h-4" />
                  <span className="font-medium">{streak.currentStreak}</span>
                </div>
              )}

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {user?.fullName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {/* Dropdown */}
                {mobileMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-card border border-border shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b border-border">
                      <p className="font-medium text-sm">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5"
                      >
                        <Settings className="w-4 h-4" />
                        الإعدادات
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-red-400 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-2 border-t border-border pt-4 grid grid-cols-5 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs ${
                    item.id === 'today'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Hero Section */}
          <section className="mb-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    مرحباً، {user?.fullName?.split(' ')[0] || 'طالب'}! 👋
                  </h1>
                  <p className="text-muted-foreground">
                    {todayStats.totalCount > 0
                      ? `لديك ${todayStats.totalCount} مهمة اليوم`
                      : 'لا مهام مجدولة لليوم'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Exam Countdown */}
          <section className="mb-8">
            <ExamCountdown examDate={examDate} />
          </section>

          {/* Today's Focus Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">تقدمك اليوم</h2>
              <Link href="/planner" className="text-sm text-primary hover:underline">
                تعديل المخطط
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">الهدف اليومي</p>
                <p className="text-2xl font-bold">{formatTime(user?.dailyStudyGoal || 120)}</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">المكتمل</p>
                <p className="text-2xl font-bold text-emerald">{formatTime(todayStats.completedMinutes)}</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">المتبقي</p>
                <p className="text-2xl font-bold text-cyan">{formatTime(todayStats.remainingMinutes)}</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">المهام المكتملة</p>
                <p className="text-2xl font-bold">{todayStats.completedCount}/{todayStats.totalCount}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">التقدم</span>
                <span className="font-medium">{todayStats.progressPercent}%</span>
              </div>
              <Progress value={todayStats.progressPercent} className="h-2" />
            </div>
          </section>

          {/* Focus Suggestions - Weak Areas */}
          <section className="mb-8">
            <FocusSuggestions maxItems={3} />
          </section>

          {/* Quick Focus Timer */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">بدء جلسة تركيز</h2>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center">
                  <Zap className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    اختر مدة الجلسة وابدأ المذاكرة
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {[25, 45, 60].map((mins) => (
                      <Button
                        key={mins}
                        variant={focusTimer.minutes === mins ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFocusTimer(prev => ({ ...prev, minutes: mins }))}
                      >
                        {mins} دقيقة
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    size="lg"
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-violet to-primary hover:opacity-90"
                    onClick={() => window.location.href = '/focus'}
                  >
                    <div className="flex flex-col items-center">
                      <Play className="w-8 h-8 mb-1" />
                      <span className="text-sm">ابدأ</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Today's Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">مهام اليوم</h2>
              <Link href="/planner">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة مهمة
                </Button>
              </Link>
            </div>

            {todayTasks.length > 0 ? (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      task.status === 'COMPLETED'
                        ? 'bg-card/50 border-border opacity-60'
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald border-emerald text-white'
                            : 'border-muted-foreground hover:border-primary'
                        }`}
                      >
                        {task.status === 'COMPLETED' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.lesson && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {user?.studyLanguage === 'arabic'
                              ? task.lesson.unit.subject.nameAr
                              : task.lesson.unit.subject.nameEn}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-xs font-medium ${taskTypeLabels[task.taskType].color}`}>
                            {user?.studyLanguage === 'arabic'
                              ? taskTypeLabels[task.taskType].ar
                              : taskTypeLabels[task.taskType].en}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {task.duration} دقيقة
                          </span>
                        </div>
                      </div>

                      {/* Start Button */}
                      {task.status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartFocus(task)}
                          className="flex-shrink-0"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">لا مهام مجدولة لليوم</p>
                <Link href="/planner">
                  <Button>
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة مهمة جديدة
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 ${
                item.id === 'today' ? 'text-primary' : 'text-muted-foreground'
              }`}
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
