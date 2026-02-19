'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  List,
  Layers,
  ChevronDown,
  ChevronLeft,
  FileText,
  X,
  Star,
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Sparkles,
  Filter,
  SortAsc,
  Grid3X3,
  Palette,
  Tag,
  FolderPlus,
  Keyboard,
  Moon,
  Sun,
  Eye,
  Edit3,
  Copy,
  Share2,
  Download,
  Lock
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useSubscription, useCanWrite } from '@/contexts/SubscriptionContext'
import UpgradeModal from '@/components/subscription/UpgradeModal'
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

type ViewMode = 'grid' | 'list' | 'compact'
type SortOption = 'updated' | 'created' | 'title' | 'subject'

// Color palette for notes
const noteColors = [
  { name: 'Default', value: null },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
]

export default function NotesPage() {
  const { toast } = useToast()
  const { canWrite, requireWrite, isReadOnly, getFeatureLimit, isActive, isInTrial, isInGracePeriod } = useCanWrite()
  const subscription = useSubscription()
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('updated')
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null)
  const [filterLessonId, setFilterLessonId] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [defaultSubjectId, setDefaultSubjectId] = useState<string | null>(null)
  const [defaultLessonId, setDefaultLessonId] = useState<string | null>(null)

  // Get the limit for notes for expired users
  const notesLimit = subscription.getFeatureLimit('notes')

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // N - New note
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleCreateNote()
      }

      // / - Focus search
      if (e.key === '/') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }

      // F - Toggle favorites
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setShowFavorites(!showFavorites)
      }

      // 1, 2, 3 - Switch view modes
      if (e.key === '1') setViewMode('grid')
      if (e.key === '2') setViewMode('list')
      if (e.key === '3') setViewMode('compact')

      // Escape - Clear filters
      if (e.key === 'Escape') {
        clearFilters()
      }

      // ? - Show shortcuts
      if (e.key === '?') {
        setShowKeyboardShortcuts(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showFavorites])

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

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note => {
      // Don't show archived notes unless explicitly requested
      if (!showArchived && note.isArchived) return false
      if (showArchived && !note.isArchived) return false

      // Favorites filter
      if (showFavorites && !note.isFavorite) return false

      // Color filter
      if (selectedColor && note.color !== selectedColor) return false

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

    // Sort
    result.sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return (a.title || '').localeCompare(b.title || '', 'ar')
        case 'subject':
          return (a.subject?.nameAr || '').localeCompare(b.subject?.nameAr || '', 'ar')
        default:
          return 0
      }
    })

    // Limit for expired users (only for read-only users)
    if (isReadOnly && !isActive && !isInTrial && !isInGracePeriod) {
      result = result.slice(0, notesLimit)
    }

    return result
  }, [notes, searchQuery, filterSubjectId, filterLessonId, showFavorites, showArchived, selectedColor, sortBy, isReadOnly, isActive, isInTrial, isInGracePeriod, notesLimit])

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

  const handleCreateNote = useCallback(() => {
    if (!canWrite) {
      requireWrite()
      return
    }
    setEditingNote(null)
    setDefaultSubjectId(filterSubjectId)
    setDefaultLessonId(filterLessonId)
    setShowModal(true)
  }, [canWrite, requireWrite, filterSubjectId, filterLessonId])

  const handleEditNote = useCallback((note: Note) => {
    if (!canWrite) {
      requireWrite()
      return
    }
    setEditingNote(note)
    setDefaultSubjectId(null)
    setDefaultLessonId(null)
    setShowModal(true)
  }, [canWrite, requireWrite])

  const handleDeleteNote = async (noteId: string) => {
    if (!canWrite) {
      requireWrite()
      return
    }
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

  const handleToggleFavorite = async (noteId: string) => {
    if (!canWrite) {
      requireWrite()
      return
    }
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !note.isFavorite })
      })

      if (res.ok) {
        setNotes(notes.map(n => 
          n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
        ))
        toast({ 
          title: note.isFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة' 
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ'
      })
    }
  }

  const handleTogglePin = async (noteId: string) => {
    if (!canWrite) {
      requireWrite()
      return
    }
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned })
      })

      if (res.ok) {
        setNotes(notes.map(n => 
          n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
        ))
        toast({ 
          title: note.isPinned ? 'تم فك التثبيت' : 'تم التثبيت' 
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ'
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
  }

  const handleLessonClick = (lessonId: string) => {
    const note = notes.find(n => n.lessonId === lessonId)
    if (note?.subjectId) {
      setFilterSubjectId(note.subjectId)
    }
    setFilterLessonId(lessonId)
  }

  const clearFilters = () => {
    setFilterSubjectId(null)
    setFilterLessonId(null)
    setSearchQuery('')
    setShowFavorites(false)
    setShowArchived(false)
    setSelectedColor(null)
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

  // Stats
  const stats = useMemo(() => ({
    total: notes.length,
    favorites: notes.filter(n => n.isFavorite).length,
    pinned: notes.filter(n => n.isPinned).length,
    archived: notes.filter(n => n.isArchived).length,
  }), [notes])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-500/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">جاري التحميل...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 lg:pb-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-primary bg-clip-text text-transparent hidden sm:block">Matrixa</span>
            </Link>

            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Notebook className="w-5 h-5 text-violet-400" />
              الملاحظات
            </h1>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-white/5"
                onClick={() => setShowKeyboardShortcuts(true)}
              >
                <Keyboard className="w-5 h-5" />
              </Button>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <Avatar className="w-8 h-8 ring-2 ring-violet-500/20">
                <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-primary/20 text-primary text-sm">
                  {user?.fullName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 relative">
        <div className="container mx-auto max-w-5xl">
          {/* Stats Bar */}
          <div className="flex items-center gap-4 mb-6 p-4 glass rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <FileText className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي</p>
                <p className="font-semibold">{stats.total}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <button 
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center gap-2 transition-colors ${showFavorites ? 'text-amber-400' : 'hover:text-amber-400'}`}
            >
              <Star className={`w-4 h-4 ${showFavorites ? 'fill-amber-400' : ''}`} />
              <span className="text-sm">{stats.favorites}</span>
            </button>
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-cyan-400" />
              <span className="text-sm">{stats.pinned}</span>
            </div>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 transition-colors ${showArchived ? 'text-muted-foreground' : 'hover:text-muted-foreground'}`}
            >
              <Archive className="w-4 h-4" />
              <span className="text-sm">{stats.archived}</span>
            </button>
          </div>

          {/* Read-Only Warning Banner */}
          {isReadOnly && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-400">وضع القراءة فقط</p>
                  <p className="text-sm text-muted-foreground">
                    انتهى اشتراكك. يمكنك مشاهدة {notesLimit} ملاحظة فقط. جدد اشتراكك للوصول الكامل.
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

          {/* Search, Filters, and Create */}
          <div className="space-y-3 mb-6">
            {/* Search and Create Row */}
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-violet-400 transition-colors" />
                <Input
                  id="search-input"
                  placeholder="بحث في الملاحظات... (اضغط /)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-white/5 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20"
                />
              </div>
              <Button 
                onClick={handleCreateNote}
                className="bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90 shadow-lg shadow-violet-500/20"
              >
                <Plus className="w-4 h-4 ml-1" />
                جديدة
              </Button>
            </div>

            {/* View Toggle and Filters Row */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as ViewMode)}
                  className="justify-start bg-white/5 rounded-lg p-1"
                >
                  <ToggleGroupItem value="grid" aria-label="عرض شبكي" className="gap-1.5 data-[state=on]:bg-violet-500/20 data-[state=on]:text-violet-400">
                    <Grid3X3 className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="عرض قائمة" className="gap-1.5 data-[state=on]:bg-violet-500/20 data-[state=on]:text-violet-400">
                    <List className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="compact" aria-label="عرض مضغوط" className="gap-1.5 data-[state=on]:bg-violet-500/20 data-[state=on]:text-violet-400">
                    <LayoutGrid className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10">
                    <SortAsc className="w-4 h-4 ml-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">آخر تحديث</SelectItem>
                    <SelectItem value="created">تاريخ الإنشاء</SelectItem>
                    <SelectItem value="title">العنوان</SelectItem>
                    <SelectItem value="subject">المادة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Filter */}
              <div className="flex gap-2 items-center flex-1 justify-end">
                <Select
                  value={filterSubjectId || 'all'}
                  onValueChange={handleSubjectFilterChange}
                >
                  <SelectTrigger className="w-40 bg-white/5 border-white/10">
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
                    <SelectTrigger className="w-40 bg-white/5 border-white/10">
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

                {/* Color Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-lg bg-white/5">
                      <Palette className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>فلترة باللون</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid grid-cols-6 gap-1 p-2">
                      <button
                        onClick={() => setSelectedColor(null)}
                        className={`w-6 h-6 rounded border ${!selectedColor ? 'ring-2 ring-violet-500' : ''}`}
                      />
                      {noteColors.slice(1).map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color.value)}
                          className={`w-6 h-6 rounded ${selectedColor === color.value ? 'ring-2 ring-violet-500' : ''}`}
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {(filterSubjectId || filterLessonId || searchQuery || showFavorites || showArchived || selectedColor) && (
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
            {(filterSubjectId || filterLessonId || showFavorites || showArchived || selectedColor) && (
              <div className="flex flex-wrap gap-2">
                {showFavorites && (
                  <Badge className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400" />
                    المفضلة
                    <button onClick={() => setShowFavorites(false)}>
                      <X className="w-3 h-3 mr-1" />
                    </button>
                  </Badge>
                )}
                {showArchived && (
                  <Badge className="gap-1 bg-slate-500/10 text-slate-400 border-slate-500/20">
                    <Archive className="w-3 h-3" />
                    المؤرشفة
                    <button onClick={() => setShowArchived(false)}>
                      <X className="w-3 h-3 mr-1" />
                    </button>
                  </Badge>
                )}
                {selectedColor && (
                  <Badge className="gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedColor }} />
                    لون محدد
                    <button onClick={() => setSelectedColor(null)}>
                      <X className="w-3 h-3 mr-1" />
                    </button>
                  </Badge>
                )}
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
          <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            {isReadOnly ? `${filteredNotes.length} من ${notesLimit} ملاحظة` : `${filteredNotes.length} ملاحظة`}
            {isReadOnly && (
              <Badge variant="outline" className="text-xs ml-2 bg-amber-500/10 text-amber-400 border-amber-500/20">
                <Eye className="w-3 h-3 ml-1" />
                وضع القراءة فقط - محدود بـ {notesLimit} ملاحظات
              </Badge>
            )}
          </div>

          {/* Notes Display */}
          {filteredNotes.length > 0 ? (
            viewMode === 'grid' ? (
              // Grid View
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    studyLanguage={user?.studyLanguage}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onSubjectClick={handleSubjectClick}
                    onLessonClick={handleLessonClick}
                    onToggleFavorite={() => handleToggleFavorite(note.id)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    showActions
                  />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              // List View
              <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    studyLanguage={user?.studyLanguage}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onSubjectClick={handleSubjectClick}
                    onLessonClick={handleLessonClick}
                    onToggleFavorite={() => handleToggleFavorite(note.id)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    variant="list"
                    showActions
                  />
                ))}
              </div>
            ) : (
              // Compact View
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {filteredNotes.map((note) => (
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
            )
          ) : (
            <div className="text-center py-16 glass rounded-2xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <Notebook className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-muted-foreground mb-2">
                {searchQuery || filterSubjectId || filterLessonId
                  ? 'لا توجد ملاحظات مطابقة'
                  : 'لا توجد ملاحظات بعد'}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                اضغط N لإنشاء ملاحظة جديدة
              </p>
              <Button 
                onClick={handleCreateNote}
                className="bg-gradient-to-r from-violet-600 to-primary"
              >
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

      {/* Upgrade Modal */}
      <UpgradeModal />

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              اختصارات لوحة المفاتيح
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {[
              { key: 'N', action: 'إنشاء ملاحظة جديدة' },
              { key: '/', action: 'التركيز على البحث' },
              { key: 'F', action: 'تبديل المفضلة' },
              { key: '1', action: 'عرض شبكي' },
              { key: '2', action: 'عرض قائمة' },
              { key: '3', action: 'عرض مضغوط' },
              { key: 'Esc', action: 'مسح الفلاتر' },
              { key: '?', action: 'عرض الاختصارات' },
            ].map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-white/5 rounded text-sm font-mono">{shortcut.key}</kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-white/5 z-40">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                item.id === 'notes' 
                  ? 'text-violet-400' 
                  : 'text-muted-foreground hover:text-foreground'
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
