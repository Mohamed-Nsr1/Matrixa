'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  CreditCard,
  BarChart3,
  Ticket,
  BookOpen,
  Settings,
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalSubscriptions: number
  activeSubscriptions: number
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
  }
  trialUsers: number
  newUsersToday: number
  expiredSubscriptions: number
  pendingPayments: number
}

export default function AdminPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    revenue: { total: 0, thisMonth: 0, lastMonth: 0 },
    trialUsers: 0,
    newUsersToday: 0,
    expiredSubscriptions: 0,
    pendingPayments: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(statsData.stats)
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout activeTab="dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">لوحة التحكم</h2>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم Matrixa</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newUsersToday} مستخدم جديد اليوم
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمين النشطين</CardTitle>
              <Users className="h-4 w-4 text-emerald" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                نشطين خلال 24 ساعة
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
              <CreditCard className="h-4 w-4 text-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.trialUsers} في الفترة التجريبية
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات (جنيه)</CardTitle>
              <DollarSign className="h-4 w-4 text-violet" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet">{stats.revenue.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                هذا الشهر: {stats.revenue.thisMonth.toLocaleString()} ج
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments Alert */}
        {stats.pendingPayments > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-400">طلبات دفع معلقة</p>
                  <p className="text-sm text-muted-foreground">
                    يوجد {stats.pendingPayments} طلب دفع بانتظار المراجعة
                  </p>
                </div>
                <Link href="/admin/manual-payments">
                  <Button variant="outline" size="sm">
                    مراجعة
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/invites"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">إنشاء كود دعوة</p>
                <p className="text-sm text-muted-foreground">دعوة مستخدمين جدد</p>
              </div>
            </Link>
            
            <Link
              href="/admin/curriculum"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="font-medium">إدارة المنهج</p>
                <p className="text-sm text-muted-foreground">إضافة/تعديل المواد</p>
              </div>
            </Link>
            
            <Link
              href="/admin/subscriptions"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald" />
              </div>
              <div>
                <p className="font-medium">إدارة الاشتراكات</p>
                <p className="text-sm text-muted-foreground">عرض وتعديل الاشتراكات</p>
              </div>
            </Link>
            
            <Link
              href="/admin/settings"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-amber" />
              </div>
              <div>
                <p className="font-medium">إعدادات النظام</p>
                <p className="text-sm text-muted-foreground">تكوين التطبيق</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                نظرة عامة على الاشتراكات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">اشتراكات نشطة</span>
                <span className="font-bold text-emerald">{stats.activeSubscriptions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">فترة تجريبية</span>
                <span className="font-bold text-cyan">{stats.trialUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">اشتراكات منتهية</span>
                <span className="font-bold text-red-400">{stats.expiredSubscriptions}</span>
              </div>
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                نشاط المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي المستخدمين</span>
                <span className="font-bold">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">نشطين اليوم</span>
                <span className="font-bold text-emerald">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">جدد اليوم</span>
                <span className="font-bold text-primary">{stats.newUsersToday}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              سيتم عرض النشاط الأخير للمستخدمين هنا
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
