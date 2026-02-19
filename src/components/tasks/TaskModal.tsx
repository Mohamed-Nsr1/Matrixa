'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Video, FileQuestion, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { TaskFrontend as Task } from '@/types'

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

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null // For editing
  defaultDate?: Date
  defaultDayOfWeek?: number
  onTaskCreated?: (task: Task) => void
  onTaskUpdated?: (task: Task) => void
}

const TASK_TYPES = [
  { value: 'VIDEO', labelAr: 'فيديو', labelEn: 'Video', icon: Video },
  { value: 'QUESTIONS', labelAr: 'أسئلة', labelEn: 'Questions', icon: FileQuestion },
  { value: 'REVISION', labelAr: 'مراجعة', labelEn: 'Revision', icon: RefreshCw }
]

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180]

export default function TaskModal({
  open,
  onOpenChange,
  task,
  defaultDate,
  defaultDayOfWeek,
  onTaskCreated,
  onTaskUpdated
}: TaskModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'VIDEO' as 'VIDEO' | 'QUESTIONS' | 'REVISION',
    scheduledDate: defaultDate || new Date(),
    duration: 30,
    lessonId: ''
  })

  const isEditing = !!task

  // Fetch subjects when modal opens
  useEffect(() => {
    if (open) {
      fetchSubjects()
    }
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        taskType: task.taskType,
        scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : new Date(),
        duration: task.duration,
        lessonId: task.lessonId || ''
      })
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        taskType: 'VIDEO',
        scheduledDate: defaultDate || new Date(),
        duration: 30,
        lessonId: ''
      })
    }
  }, [task, defaultDate])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال عنوان المهمة',
        variant: 'destructive'
      })
      return
    }

    if (formData.duration < 1) {
      toast({
        title: 'خطأ',
        description: 'مدة المهمة يجب أن تكون دقيقة واحدة على الأقل',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const url = isEditing ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = isEditing ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        taskType: formData.taskType,
        scheduledDate: formData.scheduledDate.toISOString(),
        duration: formData.duration
      }

      if (formData.lessonId) {
        body.lessonId = formData.lessonId
      }

      if (!isEditing && defaultDayOfWeek !== undefined) {
        body.dayOfWeek = defaultDayOfWeek
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: isEditing ? 'تم التحديث' : 'تمت الإضافة',
          description: isEditing ? 'تم تحديث المهمة بنجاح' : 'تم إضافة المهمة بنجاح'
        })

        if (isEditing) {
          onTaskUpdated?.(data.task)
        } else {
          onTaskCreated?.(data.task)
        }

        onOpenChange(false)
      } else {
        toast({
          title: 'خطأ',
          description: data.error || 'حدث خطأ غير متوقع',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ المهمة',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Get all lessons from subjects for the dropdown
  const allLessons = subjects.flatMap(subject =>
    subject.units.flatMap(unit =>
      unit.lessons.map(lesson => ({
        id: lesson.id,
        nameAr: lesson.nameAr,
        nameEn: lesson.nameEn,
        unitName: unit.nameAr,
        subjectName: subject.nameAr,
        subjectColor: subject.color
      }))
    )
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-right">
            {isEditing ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-right block">
              عنوان المهمة *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: مشاهدة درس الجبر"
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-right block">
              الوصف (اختياري)
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="تفاصيل إضافية..."
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label className="text-right block">نوع المهمة</Label>
            <Select
              value={formData.taskType}
              onValueChange={(value: 'VIDEO' | 'QUESTIONS' | 'REVISION') =>
                setFormData({ ...formData, taskType: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      <span>{type.labelAr}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label className="text-right block">التاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-right font-normal',
                    !formData.scheduledDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {formData.scheduledDate ? (
                    format(formData.scheduledDate, 'PPP')
                  ) : (
                    <span>اختر التاريخ</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduledDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, scheduledDate: date || new Date() })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-right block">
              المدة (بالدقائق)
            </Label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={formData.duration === mins ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, duration: mins })}
                >
                  {mins}د
                </Button>
              ))}
            </div>
            <Input
              id="duration"
              type="number"
              min={1}
              max={480}
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })
              }
              className="w-24"
            />
          </div>

          {/* Subject/Lesson Selector */}
          <div className="space-y-2">
            <Label className="text-right block">المادة والدرس (اختياري)</Label>
            <Select
              value={formData.lessonId ?? 'none'}
              onValueChange={(value) => setFormData({ ...formData, lessonId: value === 'none' ? '' : value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر درس..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">بدون ربط بمادة</span>
                </SelectItem>
                {subjects.map((subject) => (
                  <SelectGroup key={subject.id}>
                    <SelectLabel className="font-semibold">
                      {subject.nameAr}
                    </SelectLabel>
                    {subject.units.map((unit) => (
                      <SelectGroup key={unit.id}>
                        {unit.lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            <span className="text-sm">
                              {unit.nameAr} - {lesson.nameAr}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {isEditing ? 'حفظ التغييرات' : 'إضافة المهمة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
