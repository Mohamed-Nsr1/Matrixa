'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  BookOpen,
  Clock,
  Calendar,
  Notebook,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  CalendarDays,
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import TaskModal from '@/components/tasks/TaskModal'
import TaskCard from '@/components/tasks/TaskCard'
import DroppableDay from '@/components/planner/DroppableDay'
import PrivateLessonCard from '@/components/private-lessons/PrivateLessonCard'
import type { TaskFrontend as Task } from '@/types'

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
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function PlannerPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [privateLessons, setPrivateLessons] = useState<PrivateLesson[]>([])
  const [showPrivateLessons, setShowPrivateLessons] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(now.setDate(diff))
  })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | undefined>(undefined)
  const [organizing, setOrganizing] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

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

      // Fetch tasks
      const tasksRes = await fetch('/api/tasks')
      const tasksData = await tasksRes.json()
      if (tasksData.success) {
        setTasks(tasksData.tasks)
      }

      // Fetch private lessons
      const lessonsRes = await fetch('/api/private-lessons')
      const lessonsData = await lessonsRes.json()
      if (lessonsData.success) {
        setPrivateLessons(lessonsData.privateLessons)
      }
    } catch {
      window.location.href = '/auth/login'
    } finally {
      setLoading(false)
    }
  }

  const getTasksForDay = (dayIndex: number) => {
    return tasks.filter(t => t.dayOfWeek === dayIndex)
  }

  const getPrivateLessonsForDay = (dayIndex: number) => {
    return privateLessons.filter(lesson => {
      try {
        const days: number[] = JSON.parse(lesson.daysOfWeek)
        return days.includes(dayIndex)
      } catch {
        return false
      }
    }).sort((a, b) => a.time.localeCompare(b.time))
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
  }

  const getWeekDates = () => {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Open modal for new task
  const handleAddTask = (dayIndex: number) => {
    setEditingTask(null)
    setSelectedDayIndex(dayIndex)
    setModalOpen(true)
  }

  // Open modal for editing
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setSelectedDayIndex(undefined)
    setModalOpen(true)
  }

  // Handle task creation
  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask])
    setModalOpen(false)
  }

  // Handle task update
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    setEditingTask(null)
    setModalOpen(false)
  }

  // Handle task deletion
  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  // Handle status change
  const handleStatusChange = (taskId: string, status: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: status as Task['status'] } 
        : t
    ))
  }

  // Get date for a specific day in current week
  const getDateForDay = (dayIndex: number) => {
    const dates = getWeekDates()
    return dates[dayIndex]
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  // Handle drag over (for visual feedback)
  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by DroppableDay component
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Check if dropped on a day
    if (overId.startsWith('day-')) {
      const targetDayIndex = parseInt(overId.replace('day-', ''))
      const task = tasks.find(t => t.id === taskId)

      if (task && task.dayOfWeek !== targetDayIndex) {
        // Optimistic update
        const previousDayOfWeek = task.dayOfWeek
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, dayOfWeek: targetDayIndex } 
            : t
        ))

        // Calculate new date
        const weekDates = getWeekDates()
        const newDate = weekDates[targetDayIndex]

        try {
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduledDate: newDate.toISOString(),
              dayOfWeek: targetDayIndex
            })
          })

          const data = await res.json()

          if (data.success) {
            toast({
              title: 'تم نقل المهمة',
              description: `تم نقل المهمة إلى ${user?.studyLanguage === 'arabic' ? DAYS_AR[targetDayIndex] : DAYS_EN[targetDayIndex]}`
            })
          } else {
            throw new Error(data.error)
          }
        } catch (error) {
          console.error('Error moving task:', error)
          // Revert on error
          setTasks(prev => prev.map(t => 
            t.id === taskId 
              ? { ...t, dayOfWeek: previousDayOfWeek } 
              : t
          ))
          toast({
            title: 'خطأ',
            description: 'حدث خطأ أثناء نقل المهمة',
            variant: 'destructive'
          })
        }
      }
    }
  }

  // Handle private lesson deletion
  const handlePrivateLessonDeleted = (lessonId: string) => {
    setPrivateLessons(prev => prev.filter(l => l.id !== lessonId))
  }

  // Handle smart organize
  const handleSmartOrganize = async () => {
    setOrganizing(true)
    try {
      const res = await fetch('/api/planner/smart-organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyStudyHours: 4,
          includeWeekends: true,
          respectPrivateLessons: true
        })
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: 'تم التنظيم الذكي',
          description: data.message
        })
        // Refresh tasks
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Smart organize error:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء التنظيم الذكي',
        variant: 'destructive'
      })
    } finally {
      setOrganizing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const days = user?.studyLanguage === 'arabic' ? DAYS_AR : DAYS_EN
  const weekDates = getWeekDates()
  const todayTasks = getTasksForDay(new Date().getDay())
  const todayPrivateLessons = getPrivateLessonsForDay(new Date().getDay())

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

            <h1 className="text-lg font-semibold">المخطط الأسبوعي</h1>

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
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="font-semibold">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Smart Organize Button */}
          <div className="mb-4">
            <Button 
              onClick={handleSmartOrganize}
              disabled={organizing}
              className="w-full bg-gradient-to-r from-violet to-primary hover:from-violet-500 hover:to-primary/80"
            >
              {organizing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التنظيم...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 ml-2" />
                  تنظيم ذكي للمهام
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              ينظم مهامك تلقائياً بناءً على المواد الضعيفة وتجنب تعارض الدروس الخصوصية
            </p>
          </div>

          {/* Private Lessons Toggle */}
          <div className="mb-4 p-3 rounded-xl bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-amber-500" />
              <div>
                <Label htmlFor="show-private-lessons" className="font-medium cursor-pointer">
                  الدروس الخصوصية
                </Label>
                <p className="text-xs text-muted-foreground">
                  {showPrivateLessons ? `${privateLessons.length} درس في الجدول` : 'مخفية من الجدول'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/private-lessons">
                <Button variant="outline" size="sm">
                  إدارة
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                {showPrivateLessons ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  id="show-private-lessons"
                  checked={showPrivateLessons}
                  onCheckedChange={setShowPrivateLessons}
                />
              </div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="mb-6 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                مهام اليوم
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {todayTasks.length} مهام
                </Badge>
                {showPrivateLessons && todayPrivateLessons.length > 0 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {todayPrivateLessons.length} درس
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {/* Show private lessons first if enabled */}
              {showPrivateLessons && todayPrivateLessons.map(lesson => (
                <PrivateLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  compact
                  showDay={false}
                  onDelete={handlePrivateLessonDeleted}
                />
              ))}
              {/* Then show tasks */}
              {todayTasks.length > 0 ? (
                todayTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact
                    draggable
                    onEdit={handleEditTask}
                    onDelete={handleTaskDeleted}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : !showPrivateLessons || todayPrivateLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد مهام لليوم
                </p>
              ) : null}
            </div>
          </div>

          {/* Week Grid with DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {days.map((day, index) => {
                const dayTasks = getTasksForDay(index)
                const dayPrivateLessons = showPrivateLessons ? getPrivateLessonsForDay(index) : []
                const isToday = new Date().getDay() === index

                return (
                  <DroppableDay
                    key={day}
                    dayIndex={index}
                    dayName={day}
                    date={weekDates[index]}
                    isToday={isToday}
                    tasks={dayTasks}
                    formattedDate={formatDate(weekDates[index])}
                    onAddTask={handleAddTask}
                  >
                    {/* Private Lessons - Not draggable, shown first */}
                    {dayPrivateLessons.map(lesson => (
                      <PrivateLessonCard
                        key={`${lesson.id}-${index}`}
                        lesson={lesson}
                        compact
                        showDay={false}
                        onDelete={handlePrivateLessonDeleted}
                      />
                    ))}
                    
                    {/* Draggable Tasks */}
                    <SortableContext
                      items={dayTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {dayTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          compact
                          draggable
                          onEdit={handleEditTask}
                          onDelete={handleTaskDeleted}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </SortableContext>
                  </DroppableDay>
                )
              })}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90">
                  <TaskCard
                    task={activeTask}
                    compact
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* All Tasks Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">جميع المهام</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleTaskDeleted}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">لا توجد مهام بعد</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleAddTask(new Date().getDay())}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مهمة جديدة
                  </Button>
                </div>
              )}
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
              className={`flex flex-col items-center gap-1 py-3 ${
                item.id === 'planner' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
        defaultDate={selectedDayIndex !== undefined ? getDateForDay(selectedDayIndex) : undefined}
        defaultDayOfWeek={selectedDayIndex}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  )
}
