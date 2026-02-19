'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Clock,
  Calendar,
  Notebook,
  BarChart3,
  Settings,
  Loader2,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  ChevronLeft,
  TrendingDown,
  Minus,
  Sparkles
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WeakAreasSection } from '@/components/insights/WeakAreasSection'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts'

interface Stats {
  totalStudyMinutes: number
  tasksCompleted: number
  focusSessions: number
  currentStreak: number
  subjectProgress: Array<{
    id: string
    nameAr: string
    nameEn: string
    color?: string
    progress: number
    totalLessons: number
    completedLessons: number
  }>
  weeklyStudyTime: Array<{
    day: string
    dayIndex: number
    minutes: number
  }>
  focusSessionsTrend: Array<{
    date: string
    sessions: number
    minutes: number
  }>
  taskCompletionTrend: Array<{
    date: string
    completed: number
  }>
  weeklyMinutes: number
  weeklyChange: number
  avgDailyMinutes: number
  mostProductiveDay: string | null
}

interface User {
  id: string
  fullName: string | null
  email: string
  studyLanguage: string
}

const navItems = [
  { id: 'today', label: 'اليوم', icon: Clock, href: '/dashboard' },
  { id: 'subjects', label: 'المواد', icon: BookOpen, href: '/subjects' },
  { id: 'planner', label: 'المخطط', icon: Calendar, href: '/planner' },
  { id: 'notes', label: 'الملاحظات', icon: Notebook, href: '/notes' },
  { id: 'insights', label: 'الإحصائيات', icon: BarChart3, href: '/insights' },
]

// Chart colors - vibrant for dark theme
const chartColors = [
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316', // orange
]

// Weekly study time chart config
const weeklyChartConfig = {
  minutes: {
    label: 'دقائق المذاكرة',
    color: '#8b5cf6',
  },
} satisfies ChartConfig

// Focus sessions trend chart config
const focusTrendChartConfig = {
  sessions: {
    label: 'جلسات التركيز',
    color: '#06b6d4',
  },
  minutes: {
    label: 'دقائق المذاكرة',
    color: '#8b5cf6',
  },
} satisfies ChartConfig

// Task completion chart config
const taskChartConfig = {
  completed: {
    label: 'مهام مكتملة',
    color: '#10b981',
  },
} satisfies ChartConfig

export default function InsightsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

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

        // Fetch stats
        const statsRes = await fetch('/api/insights')
        const statsData = await statsRes.json()

        if (statsData.success) {
          setStats(statsData.stats)
        }
      } catch {
        window.location.href = '/auth/login'
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Subject progress chart data with colors
  const subjectChartData = stats?.subjectProgress?.map((subject, index) => ({
    name: user?.studyLanguage === 'arabic' ? subject.nameAr : subject.nameEn,
    value: subject.progress,
    color: subject.color || chartColors[index % chartColors.length],
    totalLessons: subject.totalLessons,
    completedLessons: subject.completedLessons,
  })) || []

  // Calculate weekly change indicator
  const WeeklyChangeIndicator = () => {
    if (!stats) return null
    const change = stats.weeklyChange

    if (change === 0) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Minus className="w-3 h-3" />
          <span>نفس الأسبوع الماضي</span>
        </div>
      )
    }

    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald text-xs">
          <TrendingUp className="w-3 h-3" />
          <span>+{change}% من الأسبوع الماضي</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1 text-orange text-xs">
        <TrendingDown className="w-3 h-3" />
        <span>{change}% من الأسبوع الماضي</span>
      </div>
    )
  }

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

            <h1 className="text-lg font-semibold">الإحصائيات</h1>

            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Link>
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
        <div className="container mx-auto max-w-6xl">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card border border-border">
              <Clock className="w-5 h-5 text-cyan mb-2" />
              <p className="text-2xl font-bold">
                {stats ? Math.floor(stats.totalStudyMinutes / 60) : 0}س
              </p>
              <p className="text-xs text-muted-foreground">وقت المذاكرة</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <Target className="w-5 h-5 text-emerald mb-2" />
              <p className="text-2xl font-bold">{stats?.tasksCompleted || 0}</p>
              <p className="text-xs text-muted-foreground">مهام مكتملة</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <TrendingUp className="w-5 h-5 text-violet mb-2" />
              <p className="text-2xl font-bold">{stats?.focusSessions || 0}</p>
              <p className="text-xs text-muted-foreground">جلسات تركيز</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <Flame className="w-5 h-5 text-orange mb-2" />
              <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
              <p className="text-xs text-muted-foreground">أيام متتالية</p>
            </div>
          </div>

          {/* Insights Banner */}
          {stats && stats.weeklyMinutes > 0 && (
            <div className="bg-gradient-to-br from-violet/20 via-card to-cyan/10 rounded-2xl border border-violet/20 p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-violet/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-violet" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-2">رؤى هذا الأسبوع</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي وقت المذاكرة</p>
                      <p className="text-xl font-bold text-violet">
                        {Math.floor(stats.weeklyMinutes / 60)}س {stats.weeklyMinutes % 60}د
                      </p>
                      <WeeklyChangeIndicator />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">متوسط يومي</p>
                      <p className="text-xl font-bold text-cyan">
                        {stats.avgDailyMinutes} دقيقة
                      </p>
                    </div>
                    {stats.mostProductiveDay && (
                      <div>
                        <p className="text-sm text-muted-foreground">أكثر يوم إنتاجية</p>
                        <p className="text-xl font-bold text-emerald">
                          {stats.mostProductiveDay}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Study Time Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet" />
                  وقت المذاكرة الأسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={weeklyChartConfig} className="h-64 w-full">
                  <BarChart
                    data={stats?.weeklyStudyTime || []}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                    <XAxis
                      type="number"
                      className="text-xs"
                      tickFormatter={(value) => `${value}د`}
                    />
                    <YAxis
                      dataKey="day"
                      type="category"
                      className="text-xs"
                      width={50}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${value} دقيقة`, 'وقت المذاكرة']}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      className="fill-violet"
                    />
                  </BarChart>
                </ChartContainer>
                {(!stats?.weeklyStudyTime || stats.weeklyStudyTime.every(d => d.minutes === 0)) && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    لا توجد بيانات مذاكرة هذا الأسبوع
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Subject Progress Pie Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan" />
                  تقدم المواد
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      progress: { label: 'التقدم', color: '#8b5cf6' }
                    }}
                    className="h-64 w-full"
                  >
                    <PieChart>
                      <Pie
                        data={subjectChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {subjectChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            className="stroke-card stroke-1"
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    لا توجد مواد لعرض التقدم
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Focus Sessions Trend */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald" />
                  اتجاه جلسات التركيز (30 يوم)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={focusTrendChartConfig} className="h-64 w-full">
                  <LineChart
                    data={stats?.focusSessionsTrend || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      className="text-xs"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#06b6d4' }}
                    />
                  </LineChart>
                </ChartContainer>
                {(!stats?.focusSessionsTrend || stats.focusSessionsTrend.every(d => d.sessions === 0)) && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    لا توجد جلسات تركيز في الـ 30 يوم الماضية
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Task Completion Rate */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange" />
                  معدل إتمام المهام (30 يوم)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={taskChartConfig} className="h-64 w-full">
                  <AreaChart
                    data={stats?.taskCompletionTrend || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      className="text-xs"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                  </AreaChart>
                </ChartContainer>
                {(!stats?.taskCompletionTrend || stats.taskCompletionTrend.every(d => d.completed === 0)) && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    لا توجد مهام مكتملة في الـ 30 يوم الماضية
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subject Progress Details */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-base">تفاصيل تقدم المواد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.subjectProgress && stats.subjectProgress.length > 0 ? (
                  stats.subjectProgress.map((subject, index) => (
                    <div key={subject.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject.color || chartColors[index % chartColors.length] }}
                          />
                          <span className="text-sm font-medium">
                            {user?.studyLanguage === 'arabic' ? subject.nameAr : subject.nameEn}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {subject.completedLessons}/{subject.totalLessons} درس ({subject.progress}%)
                        </span>
                      </div>
                      <Progress
                        value={subject.progress}
                        className="h-2"
                        style={{
                          backgroundColor: 'transparent',
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    لا توجد بيانات كافية لعرض التقدم
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weak Areas Section */}
          <WeakAreasSection className="mb-8" />

          {/* Tips */}
          <div className="bg-gradient-to-br from-primary/20 via-card to-card rounded-2xl border border-primary/20 p-6">
            <h2 className="text-lg font-semibold mb-4">نصائح للتحسين</h2>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm">📚 حاول المذاكرة في نفس الوقت يومياً لبناء روتين</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm">🎯 ركز على المواد ذات النسبة الأقل أولاً</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm">⏰ استخدم جلسات التركيز القصيرة للفهم العميق</p>
              </div>
            </div>
          </div>

          {/* Leaderboard Link */}
          <Link href="/leaderboard" className="block">
            <div className="bg-gradient-to-br from-yellow-500/20 via-card to-card rounded-2xl border border-yellow-500/20 p-6 mt-6 hover:border-yellow-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">لوحة المتصدرين</h3>
                    <p className="text-sm text-muted-foreground">تنافس مع زملائك!</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 ${
                item.id === 'insights' ? 'text-primary' : 'text-muted-foreground'
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
