'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  Users,
  CreditCard,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Activity,
  Calendar,
  Video,
  FileQuestion,
  RefreshCw,
  Minus
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'

// Types
interface DailyRegistration {
  date: string
  count: number
}

interface ActiveUsersMetrics {
  dau: number
  wau: number
  mau: number
  totalStudents: number
  engagementRate: number
  dauTrend: number
}

interface EngagementMetrics {
  avgStudyTimePerSession: number
  totalStudyMinutes: number
  totalFocusSessions: number
  tasksCompleted: number
  avgTasksPerUser: number
  videosWatched: number
  questionsSolved: number
  revisionsCompleted: number
  dailyEngagement: DailyEngagement[]
}

interface DailyEngagement {
  date: string
  minutes: number
  tasks: number
}

interface SubscriptionStats {
  totalStudents: number
  trialUsers: number
  activeSubscriptions: number
  expiredSubscriptions: number
  cancelledSubscriptions: number
  conversionRate: number
  trialConversionRate: number
  monthlyTrend: MonthlyTrend[]
}

interface MonthlyTrend {
  month: string
  total: number
  active: number
}

interface AnalyticsData {
  dailyRegistrations: DailyRegistration[]
  activeUsersMetrics: ActiveUsersMetrics
  engagementMetrics: EngagementMetrics
  subscriptionStats: SubscriptionStats
}

// Chart colors
const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

// Time range options
const TIME_RANGES = [
  { value: '7', label: '7 أيام' },
  { value: '30', label: '30 يوم' },
  { value: 'all', label: 'الكل' }
]

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`)
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
  }

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('ar-EG', { month: 'short' })
  }

  // Chart configs
  const registrationsChartConfig = {
    count: {
      label: 'التسجيلات',
      color: '#8b5cf6'
    }
  }

  const engagementChartConfig = {
    minutes: {
      label: 'دقائق الدراسة',
      color: '#06b6d4'
    },
    tasks: {
      label: 'المهام المكتملة',
      color: '#10b981'
    }
  }

  const subscriptionChartConfig = {
    active: {
      label: 'نشط',
      color: '#10b981'
    },
    trial: {
      label: 'تجريبي',
      color: '#f59e0b'
    },
    expired: {
      label: 'منتهي',
      color: '#ef4444'
    },
    cancelled: {
      label: 'ملغي',
      color: '#6b7280'
    }
  }

  // Pie chart data for subscription distribution
  const getSubscriptionPieData = () => {
    if (!analytics) return []
    return [
      { name: 'نشط', value: analytics.subscriptionStats.activeSubscriptions, color: '#10b981' },
      { name: 'تجريبي', value: analytics.subscriptionStats.trialUsers, color: '#f59e0b' },
      { name: 'منتهي', value: analytics.subscriptionStats.expiredSubscriptions, color: '#ef4444' },
      { name: 'ملغي', value: analytics.subscriptionStats.cancelledSubscriptions, color: '#6b7280' }
    ].filter(d => d.value > 0)
  }

  // Render loading state
  if (loading && !analytics) {
    return (
      <AdminLayout activeTab="analytics">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  // Render empty state
  if (!analytics) {
    return (
      <AdminLayout activeTab="analytics">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">فشل في تحميل البيانات</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeTab="analytics">
      <div className="space-y-6">
        {/* Header with Time Range Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">الإحصائيات المتقدمة</h2>
            <p className="text-muted-foreground">نظرة شاملة على أداء المنصة</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList>
                {TIME_RANGES.map(range => (
                  <TabsTrigger key={range.value} value={range.value}>
                    {range.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={fetchAnalytics}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* DAU/WAU/MAU Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="المستخدمين النشطين يومياً"
            value={analytics.activeUsersMetrics.dau}
            subtitle="DAU"
            icon={Activity}
            trend={analytics.activeUsersMetrics.dauTrend}
            color="violet"
          />
          <MetricCard
            title="المستخدمين النشطين أسبوعياً"
            value={analytics.activeUsersMetrics.wau}
            subtitle="WAU"
            icon={Calendar}
            color="cyan"
          />
          <MetricCard
            title="المستخدمين النشطين شهرياً"
            value={analytics.activeUsersMetrics.mau}
            subtitle="MAU"
            icon={Users}
            color="emerald"
          />
          <MetricCard
            title="معدل التفاعل"
            value={`${analytics.activeUsersMetrics.engagementRate}%`}
            subtitle="MAU / Total"
            icon={Target}
            color="amber"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet" />
                نمو المستخدمين
              </CardTitle>
              <CardDescription>التسجيلات اليومية الجديدة</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.dailyRegistrations.length > 0 ? (
                <ChartContainer config={registrationsChartConfig} className="h-72">
                  <AreaChart data={analytics.dailyRegistrations}>
                    <defs>
                      <linearGradient id="registrationsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#registrationsGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-muted-foreground">لا توجد بيانات</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan" />
                توزيع الاشتراكات
              </CardTitle>
              <CardDescription>
                معدل التحويل: {analytics.subscriptionStats.conversionRate}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getSubscriptionPieData().length > 0 ? (
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getSubscriptionPieData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getSubscriptionPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-muted-foreground">لا توجد بيانات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet/10">
                  <Clock className="w-5 h-5 text-violet" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط وقت الجلسة</p>
                  <p className="text-xl font-bold">
                    {analytics.engagementMetrics.avgStudyTimePerSession} دقيقة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan/10">
                  <Zap className="w-5 h-5 text-cyan" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">جلسات التركيز</p>
                  <p className="text-xl font-bold">
                    {analytics.engagementMetrics.totalFocusSessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald/10">
                  <Target className="w-5 h-5 text-emerald" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المهام المكتملة</p>
                  <p className="text-xl font-bold">
                    {analytics.engagementMetrics.tasksCompleted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber/10">
                  <BarChart3 className="w-5 h-5 text-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي دقائق الدراسة</p>
                  <p className="text-xl font-bold">
                    {Math.round(analytics.engagementMetrics.totalStudyMinutes).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan" />
                التفاعل اليومي
              </CardTitle>
              <CardDescription>آخر 7 أيام</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.engagementMetrics.dailyEngagement.length > 0 ? (
                <ChartContainer config={engagementChartConfig} className="h-72">
                  <BarChart data={analytics.engagementMetrics.dailyEngagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="minutes" name="دقائق" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tasks" name="مهام" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-muted-foreground">لا توجد بيانات</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Markers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald" />
                مؤشرات التقدم
              </CardTitle>
              <CardDescription>إجمالي النشاط الدراسي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ProgressItem
                  icon={Video}
                  label="فيديوهات مشاهدة"
                  value={analytics.engagementMetrics.videosWatched}
                  color="emerald"
                />
                <ProgressItem
                  icon={FileQuestion}
                  label="أسئلة محلولة"
                  value={analytics.engagementMetrics.questionsSolved}
                  color="cyan"
                />
                <ProgressItem
                  icon={RefreshCw}
                  label="مراجعات مكتملة"
                  value={analytics.engagementMetrics.revisionsCompleted}
                  color="violet"
                />
                <ProgressItem
                  icon={Target}
                  label="متوسط المهام/المستخدم"
                  value={analytics.engagementMetrics.avgTasksPerUser}
                  color="amber"
                  isDecimal
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet" />
              اتجاه الاشتراكات الشهري
            </CardTitle>
            <CardDescription>
              معدل تحويل التجربة: {analytics.subscriptionStats.trialConversionRate}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.subscriptionStats.monthlyTrend.length > 0 ? (
              <ChartContainer config={subscriptionChartConfig} className="h-64">
                <LineChart data={analytics.subscriptionStats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="إجمالي"
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active" 
                    name="نشط"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">لا توجد بيانات كافية</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-violet/10 to-transparent border-violet/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold mt-1">
                    {analytics.activeUsersMetrics.totalStudents.toLocaleString()}
                  </p>
                </div>
                <Users className="w-10 h-10 text-violet opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald/10 to-transparent border-emerald/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">اشتراكات نشطة</p>
                  <p className="text-3xl font-bold mt-1">
                    {analytics.subscriptionStats.activeSubscriptions.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="w-10 h-10 text-emerald opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan/10 to-transparent border-cyan/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">معدل التحويل</p>
                  <p className="text-3xl font-bold mt-1">
                    {analytics.subscriptionStats.conversionRate}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-cyan opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  color: 'violet' | 'cyan' | 'emerald' | 'amber'
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    violet: 'text-violet bg-violet/10',
    cyan: 'text-cyan bg-cyan/10',
    emerald: 'text-emerald bg-emerald/10',
    amber: 'text-amber bg-amber/10'
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 text-${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald" />
                <span className="text-sm text-emerald">+{trend}%</span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{trend}%</span>
              </>
            ) : (
              <>
                <Minus className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">0%</span>
              </>
            )}
            <span className="text-xs text-muted-foreground mr-1">مقارنة بالأسبوع السابق</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Progress Item Component
interface ProgressItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: 'violet' | 'cyan' | 'emerald' | 'amber'
  isDecimal?: boolean
}

function ProgressItem({ icon: Icon, label, value, color, isDecimal }: ProgressItemProps) {
  const colorClasses = {
    violet: 'bg-violet text-violet',
    cyan: 'bg-cyan text-cyan',
    emerald: 'bg-emerald text-emerald',
    amber: 'bg-amber text-amber'
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${colorClasses[color].split(' ')[0]}/10`}>
        <Icon className={`w-5 h-5 ${colorClasses[color].split(' ')[1]}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm">{label}</span>
          <span className="font-bold">
            {isDecimal ? value.toFixed(1) : value.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
