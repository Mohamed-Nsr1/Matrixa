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
  Plus,
  Loader2,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import PrivateLessonModal from '@/components/private-lessons/PrivateLessonModal'
import PrivateLessonCard from '@/components/private-lessons/PrivateLessonCard'

interface PrivateLesson {
  id: string
  teacherName: string
  subjectName: string
  centerName?: string | null
  daysOfWeek: string
  time: string
  duration: number
  location?: string | null
  notes?: string | null
  color?: string | null
  isActive: boolean
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

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function PrivateLessonsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [lessons, setLessons] = useState<PrivateLesson[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<PrivateLesson | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()

      if (!data.success) {
        window.location.href = '/auth/login'
        return
      }

      setUser(data.user)

      const lessonsRes = await fetch('/api/private-lessons')
      const lessonsData = await lessonsRes.json()

      if (lessonsData.success) {
        setLessons(lessonsData.privateLessons)
      }
    } catch {
      window.location.href = '/auth/login'
    } finally {
      setLoading(false)
    }
  }

  // Get lessons for a specific day
  const getLessonsForDay = (dayIndex: number) => {
    return lessons.filter(lesson => {
      try {
        const days: number[] = JSON.parse(lesson.daysOfWeek)
        return days.includes(dayIndex)
      } catch {
        return false
      }
    }).sort((a, b) => a.time.localeCompare(b.time))
  }

  // Format time to Arabic format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'م' : 'ص'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Open modal for new lesson
  const handleAddLesson = () => {
    setEditingLesson(null)
    setModalOpen(true)
  }

  // Open modal for editing
  const handleEditLesson = (lesson: PrivateLesson) => {
    setEditingLesson(lesson)
    setModalOpen(true)
  }

  // Handle lesson creation
  const handleLessonCreated = (newLesson: PrivateLesson) => {
    setLessons(prev => [...prev, newLesson])
    setModalOpen(false)
  }

  // Handle lesson update
  const handleLessonUpdated = (updatedLesson: PrivateLesson) => {
    setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l))
    setEditingLesson(null)
    setModalOpen(false)
  }

  // Handle lesson deletion
  const handleLessonDeleted = (lessonId: string) => {
    setLessons(prev => prev.filter(l => l.id !== lessonId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate total weekly study time from private lessons
  const totalWeeklyMinutes = lessons.reduce((total, lesson) => {
    try {
      const days: number[] = JSON.parse(lesson.daysOfWeek)
      return total + (lesson.duration * days.length)
    } catch {
      return total
    }
  }, 0)

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
              <GraduationCap className="w-5 h-5" />
              الدروس الخصوصية
            </h1>

            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
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
          {/* Stats Summary */}
          <div className="mb-6 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{lessons.length}</p>
                  <p className="text-xs text-muted-foreground">درس</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {Math.floor(totalWeeklyMinutes / 60)}:{(totalWeeklyMinutes % 60).toString().padStart(2, '0')}
                  </p>
                  <p className="text-xs text-muted-foreground">ساعة/أسبوع</p>
                </div>
              </div>
              <Button onClick={handleAddLesson}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة درس
              </Button>
            </div>
          </div>

          {/* Weekly Schedule View */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">الجدول الأسبوعي</h2>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS_AR.map((day, index) => {
                const dayLessons = getLessonsForDay(index)
                const isToday = new Date().getDay() === index

                return (
                  <div
                    key={day}
                    className={`p-4 rounded-xl bg-card border ${
                      isToday ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <div className="text-center mb-3 pb-3 border-b border-border">
                      <p className={`font-semibold ${isToday ? 'text-primary' : ''}`}>{day}</p>
                      {dayLessons.length > 0 && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {dayLessons.length} {dayLessons.length === 1 ? 'درس' : 'دروس'}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 min-h-[100px] max-h-[300px] overflow-y-auto">
                      {dayLessons.length > 0 ? (
                        dayLessons.map(lesson => (
                          <PrivateLessonCard
                            key={`${lesson.id}-${index}`}
                            lesson={lesson}
                            compact
                            onEdit={handleEditLesson}
                            onDelete={handleLessonDeleted}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          لا دروس
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All Lessons List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">جميع الدروس</h2>
            {lessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map(lesson => (
                  <PrivateLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onEdit={handleEditLesson}
                    onDelete={handleLessonDeleted}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">لا توجد دروس خصوصية بعد</p>
                <Button onClick={handleAddLesson}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة درس جديد
                </Button>
              </div>
            )}
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

      {/* Private Lesson Modal */}
      <PrivateLessonModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        lesson={editingLesson}
        onLessonCreated={handleLessonCreated}
        onLessonUpdated={handleLessonUpdated}
      />
    </div>
  )
}
