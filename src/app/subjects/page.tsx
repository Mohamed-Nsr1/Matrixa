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
  ChevronLeft,
  Check,
  Loader2,
  StickyNote
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import NoteModal from '@/components/notes/NoteModal'

// Types
interface LessonProgress {
  doneVideo: boolean
  doneQuestions: boolean
  doneRevision: boolean
  confidenceLevel: string
}

interface Lesson {
  id: string
  nameAr: string
  nameEn: string
  progress: LessonProgress | null
}

interface Unit {
  id: string
  nameAr: string
  nameEn: string
  lessons: Lesson[]
}

interface Subject {
  id: string
  nameAr: string
  nameEn: string
  color: string | null
  xpPerLesson: number
  units: Unit[]
}

interface User {
  id: string
  fullName: string | null
  email: string
  studyLanguage: string
}

// Navigation items
const navItems = [
  { id: 'today', label: 'اليوم', icon: Clock, href: '/dashboard' },
  { id: 'subjects', label: 'المواد', icon: BookOpen, href: '/subjects' },
  { id: 'planner', label: 'المخطط', icon: Calendar, href: '/planner' },
  { id: 'notes', label: 'الملاحظات', icon: Notebook, href: '/notes' },
  { id: 'insights', label: 'الإحصائيات', icon: BarChart3, href: '/insights' },
]

export default function SubjectsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [expandedUnits, setExpandedUnits] = useState<string[]>([])

  // Note modal states
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteSubjectId, setNoteSubjectId] = useState<string | null>(null)
  const [noteLessonId, setNoteLessonId] = useState<string | null>(null)

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

        const subjectsRes = await fetch('/api/subjects')
        const subjectsData = await subjectsRes.json()

        if (subjectsData.success) {
          setSubjects(subjectsData.subjects)
          if (subjectsData.subjects.length > 0) {
            setSelectedSubject(subjectsData.subjects[0])
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

  const getSubjectProgress = (subject: Subject): number => {
    let total = 0
    let completed = 0

    subject.units.forEach(unit => {
      unit.lessons.forEach(lesson => {
        total += 3
        if (lesson.progress?.doneVideo) completed++
        if (lesson.progress?.doneQuestions) completed++
        if (lesson.progress?.doneRevision) completed++
      })
    })

    return total === 0 ? 0 : Math.round((completed / total) * 100)
  }

  const updateLessonProgress = (subjects: Subject[], lessonId: string, progress: LessonProgress): Subject[] => {
    return subjects.map(subject => ({
      ...subject,
      units: subject.units.map(unit => ({
        ...unit,
        lessons: unit.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, progress }
          }
          return lesson
        })
      }))
    }))
  }

  const toggleProgress = async (lessonId: string, type: 'video' | 'questions' | 'revision') => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const data = await res.json()

      if (data.success) {
        setSubjects(prev => updateLessonProgress(prev, lessonId, data.progress))

        if (selectedSubject) {
          const updatedSubjects = updateLessonProgress(subjects, lessonId, data.progress)
          const updated = updatedSubjects.find(s => s.id === selectedSubject.id)
          if (updated) {
            setSelectedSubject(updated)
          }
        }
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث التقدم'
      })
    }
  }

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }

  // Open note modal for a specific subject
  const openNoteForSubject = (subjectId: string) => {
    setNoteSubjectId(subjectId)
    setNoteLessonId(null)
    setShowNoteModal(true)
  }

  // Open note modal for a specific lesson
  const openNoteForLesson = (subjectId: string, lessonId: string) => {
    setNoteSubjectId(subjectId)
    setNoteLessonId(lessonId)
    setShowNoteModal(true)
  }

  const handleNoteCreated = () => {
    toast({ title: 'تم إنشاء الملاحظة' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedProgress = selectedSubject ? getSubjectProgress(selectedSubject) : 0

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

            <h1 className="text-lg font-semibold">المواد الدراسية</h1>

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
          <div className="grid grid-cols-12 gap-6">
            {/* Subject List */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="sticky top-20 bg-card rounded-2xl border border-border p-4">
                <h2 className="font-semibold mb-4">المواد</h2>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {subjects.map((subject) => {
                    const progress = getSubjectProgress(subject)
                    const progressColor = progress >= 80 ? 'text-emerald' : progress >= 40 ? 'text-yellow' : 'text-red'

                    return (
                      <div
                        key={subject.id}
                        className={`w-full p-3 rounded-xl text-right transition-all ${
                          selectedSubject?.id === subject.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <button
                            className="flex-1 text-right"
                            onClick={() => setSelectedSubject(subject)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {user?.studyLanguage === 'arabic' ? subject.nameAr : subject.nameEn}
                              </span>
                              <span className={`text-sm font-medium ${progressColor}`}>{progress}%</span>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 mr-2"
                            onClick={() => openNoteForSubject(subject.id)}
                            title="إضافة ملاحظة للمادة"
                          >
                            <StickyNote className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </aside>

            {/* Subject Content */}
            <section className="col-span-12 lg:col-span-8">
              {selectedSubject ? (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      {selectedSubject.color && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: selectedSubject.color }}
                        />
                      )}
                      <h2 className="text-2xl font-bold">
                        {user?.studyLanguage === 'arabic' ? selectedSubject.nameAr : selectedSubject.nameEn}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">
                        الإنجاز: {selectedProgress}%
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNoteForSubject(selectedSubject.id)}
                        className="gap-1.5"
                      >
                        <StickyNote className="w-4 h-4" />
                        <span className="hidden sm:inline">ملاحظة</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedSubject.units.map((unit) => (
                      <div key={unit.id} className="border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleUnit(unit.id)}
                          className="w-full p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <span className="font-medium">
                            {user?.studyLanguage === 'arabic' ? unit.nameAr : unit.nameEn}
                          </span>
                          <ChevronLeft className={`w-4 h-4 transition-transform ${expandedUnits.includes(unit.id) ? 'rotate-90' : ''}`} />
                        </button>

                        {expandedUnits.includes(unit.id) && (
                          <div className="p-4 space-y-3">
                            {unit.lessons.map((lesson) => (
                              <div key={lesson.id} className="p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="font-medium">
                                    {user?.studyLanguage === 'arabic' ? lesson.nameAr : lesson.nameEn}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openNoteForLesson(selectedSubject.id, lesson.id)}
                                    title="إضافة ملاحظة للدرس"
                                  >
                                    <StickyNote className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleProgress(lesson.id, 'video')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                      lesson.progress?.doneVideo
                                        ? 'bg-emerald/20 text-emerald border border-emerald/30'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                                    }`}
                                  >
                                    {lesson.progress?.doneVideo && <Check className="w-3 h-3" />}
                                    شرح
                                  </button>

                                  <button
                                    onClick={() => toggleProgress(lesson.id, 'questions')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                      lesson.progress?.doneQuestions
                                        ? 'bg-blue/20 text-blue border border-blue/30'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                                    }`}
                                  >
                                    {lesson.progress?.doneQuestions && <Check className="w-3 h-3" />}
                                    حل
                                  </button>

                                  <button
                                    onClick={() => toggleProgress(lesson.id, 'revision')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                      lesson.progress?.doneRevision
                                        ? 'bg-violet/20 text-violet border border-violet/30'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                                    }`}
                                  >
                                    {lesson.progress?.doneRevision && <Check className="w-3 h-3" />}
                                    مراجعة
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    لا توجد مواد متاحة حالياً
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Note Modal */}
      <NoteModal
        open={showNoteModal}
        onOpenChange={setShowNoteModal}
        defaultSubjectId={noteSubjectId}
        defaultLessonId={noteLessonId}
        onNoteCreated={handleNoteCreated}
        studyLanguage={user?.studyLanguage}
      />

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 ${
                item.id === 'subjects' ? 'text-primary' : 'text-muted-foreground'
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
