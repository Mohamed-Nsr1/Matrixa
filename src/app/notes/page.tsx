'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Clock,
  Calendar,
  Notebook,
  BarChart3,
  Settings,
  Search,
  Plus,
  Loader2,
  LayoutGrid,
  Layers,
  ChevronDown,
  ChevronLeft,
  FileText,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import NoteModal from '@/components/notes/NoteModal'
import NoteCard from '@/components/notes/NoteCard'
import type { NoteFrontend as Note } from '@/types'

interface Subject {
  id: string
  nameAr: string
  nameEn: string
  color: string | null
  units: {
    id: string
    nameAr: string
    nameEn: string
    lessons: {
      id: string
      nameAr: string
      nameEn: string
    }[]
  }[]
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

type ViewMode = 'all' | 'grouped'

export default function NotesPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null)
  const [filterLessonId, setFilterLessonId] = useState<string | null>(null)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [defaultSubjectId, setDefaultSubjectId] = useState<string | null>(null)
  const [defaultLessonId, setDefaultLessonId] = useState<string | null>(null)

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

        // Fetch notes and subjects in parallel
        const [notesRes, subjectsRes] = await Promise.all([
          fetch('/api/notes'),
          fetch('/api/subjects')
        ])

        const notesData = await notesRes.json()
        const subjectsData = await subjectsRes.json()

        if (notesData.success) {
          setNotes(notesData.notes)
        }

        if (subjectsData.success) {
          setSubjects(subjectsData.subjects)
        }
      } catch {
        window.location.href = '/auth/login'
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get all lessons for filter dropdown
  const allLessons = useMemo(() => {
    if (!filterSubjectId) return []
    const subject = subjects.find(s => s.id === filterSubjectId)
    if (!subject) return []
    return subject.units.flatMap(unit =>
      unit.lessons.map(lesson => ({
        id: lesson.id,
        nameAr: lesson.nameAr,
        nameEn: lesson.nameEn,
        unitName: unit.nameAr
      }))
    )
  }, [subjects, filterSubjectId])

  // Filter notes based on search and filters
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          note.title?.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.subject?.nameAr.toLowerCase().includes(query) ||
          note.subject?.nameEn.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Subject filter
      if (filterSubjectId && note.subjectId !== filterSubjectId) {
        return false
      }

      // Lesson filter
      if (filterLessonId && note.lessonId !== filterLessonId) {
        return false
      }

      return true
    })
  }, [notes, searchQuery, filterSubjectId, filterLessonId])

  // Group notes by subject
  const groupedNotes = useMemo(() => {
    const groups: {
      subject: Subject
      notes: Note[]
      lessons: Map<string, Note[]>
    }[] = []

    subjects.forEach(subject => {
      const subjectNotes = filteredNotes.filter(n => n.subjectId === subject.id)
      if (subjectNotes.length > 0) {
        const lessonsMap = new Map<string, Note[]>()
        subjectNotes.forEach(note => {
          if (note.lessonId) {
            const existing = lessonsMap.get(note.lessonId) || []
            existing.push(note)
            lessonsMap.set(note.lessonId, existing)
          }
        })

        groups.push({
          subject,
          notes: subjectNotes,
          lessons: lessonsMap
        })
      }
    })

    // Add notes without subjects
    const ungroupedNotes = filteredNotes.filter(n => !n.subjectId)
    if (ungroupedNotes.length > 0) {
      groups.push({
        subject: {
          id: 'ungrouped',
          nameAr: 'بدون تصنيف',
          nameEn: 'Uncategorized',
          color: null,
          units: []
        },
        notes: ungroupedNotes,
        lessons: new Map()
      })
    }

    return groups
  }, [subjects, filteredNotes])

  const handleCreateNote = () => {
    setEditingNote(null)
    setDefaultSubjectId(filterSubjectId)
    setDefaultLessonId(filterLessonId)
    setShowModal(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDefaultSubjectId(null)
    setDefaultLessonId(null)
    setShowModal(true)
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setNotes(notes.filter(n => n.id !== noteId))
        toast({ title: 'تم حذف الملاحظة' })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الملاحظة'
      })
    }
  }

  const handleNoteCreated = (note: Note) => {
    setNotes([note, ...notes])
  }

  const handleNoteUpdated = (updatedNote: Note) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n))
  }

  const handleSubjectClick = (subjectId: string) => {
    setFilterSubjectId(subjectId)
    setFilterLessonId(null)
    setViewMode('all')
  }

  const handleLessonClick = (lessonId: string) => {
    const note = notes.find(n => n.lessonId === lessonId)
    if (note?.subjectId) {
      setFilterSubjectId(note.subjectId)
    }
    setFilterLessonId(lessonId)
    setViewMode('all')
  }

  const clearFilters = () => {
    setFilterSubjectId(null)
    setFilterLessonId(null)
    setSearchQuery('')
  }

  // Reset lesson filter when subject changes
  const handleSubjectFilterChange = (value: string) => {
    if (value === 'all') {
      setFilterSubjectId(null)
      setFilterLessonId(null)
    } else {
      setFilterSubjectId(value)
      setFilterLessonId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const getSubjectName = (subject: Subject) => {
    return user?.studyLanguage === 'arabic' ? subject.nameAr : subject.nameEn
  }

  const getLessonName = (lesson: { nameAr: string; nameEn: string }) => {
    return user?.studyLanguage === 'arabic' ? lesson.nameAr : lesson.nameEn
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

            <h1 className="text-lg font-semibold">الملاحظات</h1>

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
        <div className="container mx-auto max-w-4xl">
          {/* Search, Filters, and Create */}
          <div className="space-y-3 mb-6">
            {/* Search and Create Row */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="بحث في الملاحظات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button onClick={handleCreateNote}>
                <Plus className="w-4 h-4 ml-1" />
                جديد
              </Button>
            </div>

            {/* View Toggle and Filters Row */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              {/* View Mode Toggle */}
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as ViewMode)}
                className="justify-start"
              >
                <ToggleGroupItem value="all" aria-label="عرض الكل" className="gap-1.5">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">الكل</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="grouped" aria-label="حسب المادة" className="gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">حسب المادة</span>
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Subject Filter */}
              <div className="flex gap-2 items-center flex-1 justify-end">
                <Select
                  value={filterSubjectId || 'all'}
                  onValueChange={handleSubjectFilterChange}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="فلترة بالمادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المواد</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          {subject.color && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subject.color }}
                            />
                          )}
                          <span>{getSubjectName(subject)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Lesson Filter - Only show if subject is selected */}
                {filterSubjectId && allLessons.length > 0 && (
                  <Select
                    value={filterLessonId || 'all'}
                    onValueChange={(value) => setFilterLessonId(value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="فلترة بالدرس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الدروس</SelectItem>
                      {allLessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          <span className="text-sm">{getLessonName(lesson)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Clear Filters */}
                {(filterSubjectId || filterLessonId || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4 ml-1" />
                    مسح
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterSubjectId || filterLessonId) && (
              <div className="flex flex-wrap gap-2">
                {filterSubjectId && subjects.find(s => s.id === filterSubjectId) && (
                  <Badge
                    variant="secondary"
                    className="gap-1"
                    style={{
                      backgroundColor: subjects.find(s => s.id === filterSubjectId)?.color
                        ? `${subjects.find(s => s.id === filterSubjectId)?.color}20`
                        : undefined
                    }}
                  >
                    {subjects.find(s => s.id === filterSubjectId)?.color && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: subjects.find(s => s.id === filterSubjectId)?.color || undefined }}
                      />
                    )}
                    <BookOpen className="w-3 h-3" />
                    {getSubjectName(subjects.find(s => s.id === filterSubjectId)!)}
                    <button onClick={() => setFilterSubjectId(null)}>
                      <X className="w-3 h-3 mr-1" />
                    </button>
                  </Badge>
                )}
                {filterLessonId && allLessons.find(l => l.id === filterLessonId) && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="w-3 h-3" />
                    {getLessonName(allLessons.find(l => l.id === filterLessonId)!)}
                    <button onClick={() => setFilterLessonId(null)}>
                      <X className="w-3 h-3 mr-1" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Notes Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredNotes.length} ملاحظة
          </div>

          {/* Notes Display */}
          {filteredNotes.length > 0 ? (
            viewMode === 'all' ? (
              // All Notes View
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    studyLanguage={user?.studyLanguage}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onSubjectClick={handleSubjectClick}
                    onLessonClick={handleLessonClick}
                  />
                ))}
              </div>
            ) : (
              // Grouped View
              <Accordion type="multiple" className="space-y-4" defaultValue={groupedNotes.map(g => g.subject.id)}>
                {groupedNotes.map((group) => (
                  <AccordionItem
                    key={group.subject.id}
                    value={group.subject.id}
                    className="border rounded-xl overflow-hidden bg-card"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        {group.subject.color && group.subject.id !== 'ungrouped' && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.subject.color }}
                          />
                        )}
                        <span className="font-semibold">{getSubjectName(group.subject)}</span>
                        <Badge variant="secondary" className="mr-2">
                          {group.notes.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Notes grouped by lesson */}
                        {Array.from(group.lessons.entries()).map(([lessonId, lessonNotes]) => {
                          const subject = subjects.find(s => s.id === group.subject.id)
                          const lesson = subject?.units
                            .flatMap(u => u.lessons)
                            .find(l => l.id === lessonId)

                          if (!lesson) return null

                          return (
                            <div key={lessonId} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                <span>{getLessonName(lesson)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {lessonNotes.length}
                                </Badge>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2 pr-6">
                                {lessonNotes.map((note) => (
                                  <NoteCard
                                    key={note.id}
                                    note={note}
                                    studyLanguage={user?.studyLanguage}
                                    onEdit={handleEditNote}
                                    onDelete={handleDeleteNote}
                                    onSubjectClick={handleSubjectClick}
                                    onLessonClick={handleLessonClick}
                                    compact
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })}

                        {/* Notes without lessons */}
                        {group.notes.filter(n => !n.lessonId).length > 0 && (
                          <div className="space-y-2">
                            {group.lessons.size > 0 && (
                              <div className="text-sm text-muted-foreground">ملاحظات عامة</div>
                            )}
                            <div className="grid gap-3 sm:grid-cols-2">
                              {group.notes
                                .filter(n => !n.lessonId)
                                .map((note) => (
                                  <NoteCard
                                    key={note.id}
                                    note={note}
                                    studyLanguage={user?.studyLanguage}
                                    onEdit={handleEditNote}
                                    onDelete={handleDeleteNote}
                                    onSubjectClick={handleSubjectClick}
                                    onLessonClick={handleLessonClick}
                                    compact
                                  />
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Notebook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterSubjectId || filterLessonId
                  ? 'لا توجد ملاحظات مطابقة'
                  : 'لا توجد ملاحظات بعد'}
              </p>
              <Button onClick={handleCreateNote}>
                <Plus className="w-4 h-4 ml-1" />
                إنشاء ملاحظة
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Note Modal */}
      <NoteModal
        open={showModal}
        onOpenChange={setShowModal}
        note={editingNote}
        defaultSubjectId={defaultSubjectId}
        defaultLessonId={defaultLessonId}
        onNoteCreated={handleNoteCreated}
        onNoteUpdated={handleNoteUpdated}
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
                item.id === 'notes' ? 'text-primary' : 'text-muted-foreground'
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
