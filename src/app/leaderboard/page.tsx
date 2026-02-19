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
  Trophy,
  Medal,
  Crown,
  Target,
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import OptInModal from '@/components/leaderboard/OptInModal'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string | null
  score: number
  studyMinutes: number
  tasksCompleted: number
  focusSessions: number
  isCurrentUser: boolean
}

interface User {
  id: string
  fullName: string | null
  email: string
}

interface OptInStatus {
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

const timePeriods = [
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'all', label: 'كل الوقت' },
]

export default function LeaderboardPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null)
  const [optInStatus, setOptInStatus] = useState<OptInStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [showOptInModal, setShowOptInModal] = useState(false)
  const [updatingOptIn, setUpdatingOptIn] = useState(false)

  const limit = 20

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

        // Fetch opt-in status
        const optInRes = await fetch('/api/leaderboard/opt-in')
        const optInData = await optInRes.json()
        
        if (optInData.success) {
          setOptInStatus(optInData)
          // Show modal if user hasn't made a choice yet
          if (!optInData.hasEntry) {
            setShowOptInModal(true)
          }
        }
      } catch {
        window.location.href = '/auth/login'
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchLeaderboard()
    }
  }, [user, period])

  const fetchLeaderboard = async (newOffset = 0) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?limit=${limit}&offset=${newOffset}&period=${period}`)
      const data = await res.json()

      if (data.success) {
        setEntries(newOffset === 0 ? data.entries : [...entries, ...data.entries])
        setCurrentUserRank(data.currentUserRank)
        setCurrentUserEntry(data.currentUserEntry)
        setHasMore(data.hasMore)
        setTotal(data.total)
        setOffset(newOffset)
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل لوحة المتصدرين'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOptInToggle = async (isOptedIn: boolean) => {
    setUpdatingOptIn(true)
    try {
      const res = await fetch('/api/leaderboard/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOptedIn })
      })

      const data = await res.json()

      if (data.success) {
        setOptInStatus(prev => prev ? { ...prev, isOptedIn } : null)
        toast({
          title: data.message
        })
        // Refresh leaderboard
        fetchLeaderboard(0)
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الإعدادات'
      })
    } finally {
      setUpdatingOptIn(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLeaderboard(offset + limit)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-l from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/30'
      case 2:
        return 'bg-gradient-to-l from-gray-400/20 via-gray-400/10 to-transparent border-gray-400/30'
      case 3:
        return 'bg-gradient-to-l from-amber-600/20 via-amber-600/10 to-transparent border-amber-600/30'
      default:
        return 'bg-card border-border'
    }
  }

  if (loading && entries.length === 0) {
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
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text hidden sm:block">Matrixa</span>
            </Link>

            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              لوحة المتصدرين
            </h1>

            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-yellow-500/20 via-card to-card rounded-2xl border border-yellow-500/20 p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  تنافس مع زملائك!
                </h2>
                <p className="text-muted-foreground text-sm">
                  اجمع النقاط من خلال المذاكرة وإكمال المهام. كل دقيقة مذاكرة = نقطة، وكل مهمة = 10 نقاط.
                </p>
              </div>
              
              {/* Opt-in Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={optInStatus?.isOptedIn ?? true}
                  onCheckedChange={handleOptInToggle}
                  disabled={updatingOptIn}
                />
                <Label className="text-sm whitespace-nowrap">
                  {optInStatus?.isOptedIn ? 'ظاهر' : 'مخفي'}
                </Label>
              </div>
            </div>
          </div>

          {/* Time Period Filter */}
          <div className="mb-6">
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                {timePeriods.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Current User Stats Card (if opted in) */}
          {currentUserEntry && optInStatus?.isOptedIn && (
            <Card className="mb-6 border-primary/50 bg-gradient-to-br from-primary/10 to-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-bold text-primary">#{currentUserRank}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{user?.fullName || 'أنت'}</p>
                      <p className="text-sm text-muted-foreground">ترتيبك الحالي</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-primary">{currentUserEntry.score}</p>
                      <p className="text-muted-foreground text-xs">نقطة</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{Math.floor(currentUserEntry.studyMinutes / 60)}س</p>
                      <p className="text-muted-foreground text-xs">مذاكرة</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{currentUserEntry.tasksCompleted}</p>
                      <p className="text-muted-foreground text-xs">مهام</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not opted in message */}
          {optInStatus && !optInStatus.isOptedIn && (
            <Card className="mb-6 border-dashed">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  أنت غير مشترك في لوحة المتصدرين. فعّل المشاركة أعلاه لتظهر في الترتيب.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>الترتيب</span>
                <Badge variant="secondary">{total} مشارك</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {entries.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد بيانات بعد</p>
                    <p className="text-sm">ابدأ المذاكرة لتظهر في اللوحة!</p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`p-4 flex items-center gap-4 transition-colors ${
                        entry.isCurrentUser 
                          ? 'bg-primary/10 border-l-4 border-l-primary' 
                          : ''
                      } ${getRankStyle(entry.rank)}`}
                    >
                      {/* Rank */}
                      <div className="w-10 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.name || 'مستخدم مجهول'}
                          {entry.isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-xs">أنت</Badge>
                          )}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-cyan">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(entry.studyMinutes / 60)}س</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald">
                          <Target className="w-4 h-4" />
                          <span>{entry.tasksCompleted}</span>
                        </div>
                        <div className="flex items-center gap-1 text-violet">
                          <TrendingUp className="w-4 h-4" />
                          <span>{entry.focusSessions}</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-left min-w-[60px]">
                        <p className="font-bold text-primary">{entry.score}</p>
                        <p className="text-xs text-muted-foreground">نقطة</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="p-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 ml-2" />
                    )}
                    تحميل المزيد
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Section */}
          <div className="mt-6 bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange" />
              كيف تزيد نقاطك؟
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-cyan" />
                </div>
                <div>
                  <p className="text-sm font-medium">دقيقة مذاكرة = نقطة واحدة</p>
                  <p className="text-xs text-muted-foreground">استخدم مؤقت التركيز لتتبع وقتك</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald" />
                </div>
                <div>
                  <p className="text-sm font-medium">مهمة مكتملة = 10 نقاط</p>
                  <p className="text-xs text-muted-foreground">أكمل مهامك اليومية لزيادة نقاطك</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-violet/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet" />
                </div>
                <div>
                  <p className="text-sm font-medium">جلسة تركيز = 5 نقاط إضافية</p>
                  <p className="text-xs text-muted-foreground">حافظ على تركيزك لجلسات أطول</p>
                </div>
              </div>
            </div>
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
              className="flex flex-col items-center gap-1 py-3 text-muted-foreground"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Opt-in Modal */}
      <OptInModal
        open={showOptInModal}
        onOpenChange={setShowOptInModal}
        onChoice={handleOptInToggle}
      />
    </div>
  )
}
