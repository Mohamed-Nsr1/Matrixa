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
  ChevronRight,
  Loader2,
  CreditCard,
  Receipt,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface SubscriptionHistory {
  id: string
  status: string
  planName: string
  planNameEn: string
  price: number
  durationDays: number
  startDate: string
  endDate: string | null
  trialStart: string | null
  trialEnd: string | null
  paymobOrderId: string | null
  paymobPaymentId: string | null
  createdAt: string
}

const navItems = [
  { id: 'today', label: 'اليوم', icon: Clock, href: '/dashboard' },
  { id: 'subjects', label: 'المواد', icon: BookOpen, href: '/subjects' },
  { id: 'planner', label: 'المخطط', icon: Calendar, href: '/planner' },
  { id: 'notes', label: 'الملاحظات', icon: Notebook, href: '/notes' },
  { id: 'insights', label: 'الإحصائيات', icon: BarChart3, href: '/insights' },
]

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  TRIAL: { label: 'تجريبية', color: 'text-blue-400 bg-blue-400/10', icon: ClockIcon },
  ACTIVE: { label: 'نشطة', color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle },
  EXPIRED: { label: 'منتهية', color: 'text-red-400 bg-red-400/10', icon: XCircle },
  CANCELLED: { label: 'ملغاة', color: 'text-gray-400 bg-gray-400/10', icon: XCircle },
  PAUSED: { label: 'موقفة', color: 'text-yellow-400 bg-yellow-400/10', icon: AlertCircle }
}

export default function SubscriptionHistoryPage() {
  const [history, setHistory] = useState<SubscriptionHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/subscription/history')
        const data = await res.json()

        if (data.success) {
          setHistory(data.history)
        }
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/settings" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
              <span>العودة للإعدادات</span>
            </Link>

            <h1 className="text-lg font-semibold">سجل المدفوعات</h1>

            <div className="w-24" /> {/* Spacer for balance */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4">
        <div className="container mx-auto max-w-2xl">
          
          {/* Summary Card */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">ملخص الاشتراكات</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary">{history.length}</p>
                <p className="text-sm text-muted-foreground">اشتراكات</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl text-center">
                <p className="text-2xl font-bold">
                  {history.filter(h => h.status === 'ACTIVE').length > 0 ? 'نشط' : 'لا يوجد'}
                </p>
                <p className="text-sm text-muted-foreground">الاشتراك الحالي</p>
              </div>
            </div>
          </div>

          {/* History List */}
          {history.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">لا يوجد سجل مدفوعات</p>
              <p className="text-sm text-muted-foreground mb-6">
                لم تقم بأي اشتراكات بعد
              </p>
              <Link href="/subscription">
                <Button>
                  اشترك الآن
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const config = statusConfig[item.status] || statusConfig.EXPIRED
                const StatusIcon = config.icon
                
                return (
                  <div key={item.id} className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.planName}</h3>
                        <p className="text-sm text-muted-foreground">{item.planNameEn}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">السعر</p>
                        <p className="font-semibold">{item.price} ج.م</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">المدة</p>
                        <p className="font-semibold">{item.durationDays} يوم</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">تاريخ البدء</p>
                        <p className="font-semibold">
                          {item.startDate ? format(new Date(item.startDate), 'dd MMM yyyy', { locale: ar }) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">تاريخ الانتهاء</p>
                        <p className="font-semibold">
                          {item.endDate ? format(new Date(item.endDate), 'dd MMM yyyy', { locale: ar }) : '-'}
                        </p>
                      </div>
                    </div>
                    
                    {item.trialStart && item.trialEnd && (
                      <div className="p-3 bg-blue-500/10 rounded-lg text-sm text-blue-400 mb-4">
                        <p>فترة تجريبية: {format(new Date(item.trialStart), 'dd MMM', { locale: ar })} - {format(new Date(item.trialEnd), 'dd MMM yyyy', { locale: ar })}</p>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                      <p>تم الإنشاء: {format(new Date(item.createdAt), 'dd MMM yyyy - HH:mm', { locale: ar })}</p>
                      {item.paymobOrderId && (
                        <p className="mt-1">رقم الطلب: {item.paymobOrderId}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Subscribe Button */}
          <div className="mt-6">
            <Link href="/subscription">
              <Button className="w-full" size="lg">
                <CreditCard className="w-4 h-4 ml-2" />
                إدارة الاشتراك
              </Button>
            </Link>
          </div>
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
