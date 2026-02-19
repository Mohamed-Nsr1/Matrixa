'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  CreditCard,
  Ticket,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Trophy,
  Megaphone,
  FileText,
  Mail,
  DollarSign,
  Flame,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Admin navigation items
const adminNavItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, href: '/admin' },
  { id: 'users', label: 'المستخدمين', icon: Users, href: '/admin/users' },
  { id: 'streaks', label: 'المسارات', icon: Flame, href: '/admin/streaks' },
  { id: 'badges', label: 'الشارات', icon: Award, href: '/admin/badges' },
  { id: 'leaderboard', label: 'لوحة المتصدرين', icon: Trophy, href: '/admin/leaderboard' },
  { id: 'curriculum', label: 'المنهج', icon: BookOpen, href: '/admin/curriculum' },
  { id: 'announcements', label: 'الإعلانات', icon: Megaphone, href: '/admin/announcements' },
  { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCard, href: '/admin/subscriptions' },
  { id: 'manual-payments', label: 'الدفع اليدوي', icon: DollarSign, href: '/admin/manual-payments' },
  { id: 'invites', label: 'دعوات', icon: Ticket, href: '/admin/invites' },
  { id: 'email', label: 'البريد الإلكتروني', icon: Mail, href: '/admin/email' },
  { id: 'analytics', label: 'الإحصائيات', icon: BarChart3, href: '/admin/analytics' },
  { id: 'audit-logs', label: 'سجل النشاط', icon: FileText, href: '/admin/audit-logs' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, href: '/admin/settings' },
]

interface AdminLayoutProps {
  children: ReactNode
  activeTab: string
}

export function AdminLayout({ children, activeTab }: AdminLayoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()

        if (!data.success || data.user.role !== 'ADMIN') {
          router.push('/auth/login')
          return
        }
      } catch {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-card border-l border-border transform transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-primary flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Matrixa Admin</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:mr-64">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {adminNavItems.find(item => item.id === activeTab)?.label || 'لوحة التحكم'}
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            عرض الموقع
            <ChevronLeft className="w-4 h-4 inline mr-1" />
          </Link>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
