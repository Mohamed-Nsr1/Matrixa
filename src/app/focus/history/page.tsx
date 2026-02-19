'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight,
  Clock, 
  Video, 
  FileQuestion, 
  RefreshCw,
  Calendar,
  BookOpen,
  Filter,
  X,
  Lock,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSubscription } from '@/contexts/SubscriptionContext'
import UpgradeModal from '@/components/subscription/UpgradeModal'

interface FocusSession {
  id: string
  startedAt: string
  endedAt: string | null
  duration: number
  actualDuration: number | null
  wasCompleted: boolean
  brainDump: string | null
  notes: string | null
  videosWatched: number
  questionsSolved: number
  revisionsCompleted: number
  subjectId: string | null
  lessonId: string | null
  subject: { id: string; nameAr: string; nameEn: string } | null
  lesson: { id: string; nameAr: string; nameEn: string } | null
}

interface Subject {
  id: string
  nameAr: string
  nameEn: string
}

export default function FocusHistoryPage() {
  const router = useRouter()
  const { isReadOnly, getFeatureLimit, isActive, isInTrial, isInGracePeriod } = useSubscription()
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Get the limit for focus sessions for expired users
  const sessionsLimit = getFeatureLimit('focusSessions')

  // Apply limit to sessions for expired users
  const limitedSessions = useMemo(() => {
    if (isActive || isInTrial || isInGracePeriod) return sessions
    return sessions.slice(0, sessionsLimit)
  }, [sessions, isActive, isInTrial, isInGracePeriod, sessionsLimit])

  useEffect(() => {
    fetchSessions()
    fetchSubjects()
  }, [selectedSubjectId])

  const fetchSessions = async () => {
    try {
      const url = selectedSubjectId && selectedSubjectId !== 'all'
        ? `/api/focus-sessions?subjectId=${selectedSubjectId}&limit=100`
        : '/api/focus-sessions?limit=100'
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects')
      const data = await res.json()
      if (data.success) {
        setSubjects(data.subjects)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remainingMins = mins % 60
      return `${hours}س ${remainingMins > 0 ? `${remainingMins}د` : ''}`
    }
    return `${mins}د`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'اليوم'
    if (diffDays === 1) return 'أمس'
    if (diffDays < 7) return `منذ ${diffDays} أيام`
    
    return date.toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Group sessions by date
  const groupedSessions = limitedSessions.reduce((groups, session) => {
    const date = new Date(session.startedAt).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(session)
    return groups
  }, {} as Record<string, FocusSession[]>)

  // Calculate stats
  const totalMinutes = limitedSessions.reduce((acc, s) => acc + (s.actualDuration || s.duration) / 60, 0)
  const totalVideos = limitedSessions.reduce((acc, s) => acc + s.videosWatched, 0)
  const totalQuestions = limitedSessions.reduce((acc, s) => acc + s.questionsSolved, 0)
  const totalRevisions = limitedSessions.reduce((acc, s) => acc + s.revisionsCompleted, 0)

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/focus')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">سجل جلسات التركيز</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Read-Only Warning Banner */}
        {isReadOnly && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-400">وضع القراءة فقط</p>
                <p className="text-sm text-muted-foreground">
                  انتهى اشتراكك. يمكنك مشاهدة {sessionsLimit} جلسة فقط. جدد اشتراكك للوصول الكامل.
                </p>
              </div>
              <Link href="/subscription">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                  تجديد الاشتراك
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-card rounded-xl p-3 text-center border">
            <div className="text-xl font-bold text-primary">{Math.round(totalMinutes)}</div>
            <div className="text-xs text-muted-foreground">دقيقة</div>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border">
            <div className="text-xl font-bold text-emerald">{totalVideos}</div>
            <div className="text-xs text-muted-foreground">فيديو</div>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border">
            <div className="text-xl font-bold text-blue">{totalQuestions}</div>
            <div className="text-xs text-muted-foreground">أسئلة</div>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border">
            <div className="text-xl font-bold text-purple">{totalRevisions}</div>
            <div className="text-xs text-muted-foreground">مراجعة</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={selectedSubjectId}
            onValueChange={(value) => setSelectedSubjectId(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل المواد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المواد</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : limitedSessions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد جلسات سابقة</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              ابدأ جلسة تركيز جديدة لتظهر هنا
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-6">
              {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(dateSessions[0].startedAt)}
                  </h3>
                  <div className="space-y-2">
                    {dateSessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-card rounded-xl border p-4"
                      >
                        {/* Time and Duration */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{formatTime(session.startedAt)}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium">
                              {formatDuration(session.actualDuration || session.duration)}
                            </span>
                          </div>
                          {session.wasCompleted ? (
                            <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20 text-xs">
                              مكتملة
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber/10 text-amber border-amber/20 text-xs">
                              جزئية
                            </Badge>
                          )}
                        </div>

                        {/* Subject/Lesson */}
                        {(session.subject || session.lesson) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <BookOpen className="w-4 h-4" />
                            <span>
                              {session.subject?.nameAr}
                              {session.lesson && ` - ${session.lesson.nameAr}`}
                            </span>
                          </div>
                        )}

                        {/* Progress Markers */}
                        {(session.videosWatched > 0 || session.questionsSolved > 0 || session.revisionsCompleted > 0) && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {session.videosWatched > 0 && (
                              <Badge 
                                variant="outline" 
                                className="bg-emerald/10 text-emerald border-emerald/20 text-xs"
                              >
                                <Video className="w-3 h-3 ml-1" />
                                {session.videosWatched}
                              </Badge>
                            )}
                            {session.questionsSolved > 0 && (
                              <Badge 
                                variant="outline" 
                                className="bg-blue/10 text-blue border-blue/20 text-xs"
                              >
                                <FileQuestion className="w-3 h-3 ml-1" />
                                {session.questionsSolved}
                              </Badge>
                            )}
                            {session.revisionsCompleted > 0 && (
                              <Badge 
                                variant="outline" 
                                className="bg-purple/10 text-purple border-purple/20 text-xs"
                              >
                                <RefreshCw className="w-3 h-3 ml-1" />
                                {session.revisionsCompleted}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {session.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {session.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal />
    </div>
  )
}
