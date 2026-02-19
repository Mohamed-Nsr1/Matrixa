'use client'

import { useState, useEffect } from 'react'
import { Loader2, MapPin, User, BookOpen, Clock, Calendar } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface PrivateLesson {
  id: string
  teacherName: string
  subjectName: string
  centerName?: string | null
  daysOfWeek: string // JSON string
  time: string
  duration: number
  location?: string | null
  notes?: string | null
  color?: string | null
  isActive: boolean
}

interface PrivateLessonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson?: PrivateLesson | null // For editing
  onLessonCreated?: (lesson: PrivateLesson) => void
  onLessonUpdated?: (lesson: PrivateLesson) => void
}

const DAYS_OF_WEEK = [
  { value: 0, labelAr: 'الأحد', labelEn: 'Sunday' },
  { value: 1, labelAr: 'الإثنين', labelEn: 'Monday' },
  { value: 2, labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
  { value: 3, labelAr: 'الأربعاء', labelEn: 'Wednesday' },
  { value: 4, labelAr: 'الخميس', labelEn: 'Thursday' },
  { value: 5, labelAr: 'الجمعة', labelEn: 'Friday' },
  { value: 6, labelAr: 'السبت', labelEn: 'Saturday' }
]

const SUBJECT_COLORS = [
  { name: 'أحمر', value: '#ef4444' },
  { name: 'برتقالي', value: '#f97316' },
  { name: 'أصفر', value: '#eab308' },
  { name: 'أخضر', value: '#22c55e' },
  { name: 'أزرق', value: '#3b82f6' },
  { name: 'بنفسجي', value: '#8b5cf6' },
  { name: 'وردي', value: '#ec4899' },
  { name: 'سماوي', value: '#06b6d4' }
]

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180]

export default function PrivateLessonModal({
  open,
  onOpenChange,
  lesson,
  onLessonCreated,
  onLessonUpdated
}: PrivateLessonModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    teacherName: '',
    subjectName: '',
    centerName: '',
    daysOfWeek: [] as number[],
    time: '16:00',
    duration: 60,
    location: '',
    notes: '',
    color: ''
  })

  const isEditing = !!lesson

  // Populate form when editing
  useEffect(() => {
    if (lesson) {
      let parsedDays: number[] = []
      try {
        parsedDays = JSON.parse(lesson.daysOfWeek)
      } catch {
        parsedDays = []
      }

      setFormData({
        teacherName: lesson.teacherName,
        subjectName: lesson.subjectName,
        centerName: lesson.centerName || '',
        daysOfWeek: parsedDays,
        time: lesson.time,
        duration: lesson.duration,
        location: lesson.location || '',
        notes: lesson.notes || '',
        color: lesson.color || ''
      })
    } else {
      // Reset form for new lesson
      setFormData({
        teacherName: '',
        subjectName: '',
        centerName: '',
        daysOfWeek: [],
        time: '16:00',
        duration: 60,
        location: '',
        notes: '',
        color: ''
      })
    }
  }, [lesson])

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.teacherName.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المدرس',
        variant: 'destructive'
      })
      return
    }

    if (!formData.subjectName.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المادة',
        variant: 'destructive'
      })
      return
    }

    if (formData.daysOfWeek.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار يوم واحد على الأقل',
        variant: 'destructive'
      })
      return
    }

    if (!formData.time) {
      toast({
        title: 'خطأ',
        description: 'يرجى تحديد وقت الدرس',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const url = isEditing ? `/api/private-lessons/${lesson.id}` : '/api/private-lessons'
      const method = isEditing ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        teacherName: formData.teacherName.trim(),
        subjectName: formData.subjectName.trim(),
        centerName: formData.centerName.trim() || null,
        daysOfWeek: formData.daysOfWeek,
        time: formData.time,
        duration: formData.duration,
        location: formData.location.trim() || null,
        notes: formData.notes.trim() || null,
        color: formData.color || null
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
          description: isEditing ? 'تم تحديث الدرس بنجاح' : 'تم إضافة الدرس بنجاح'
        })

        if (isEditing) {
          onLessonUpdated?.(data.privateLesson)
        } else {
          onLessonCreated?.(data.privateLesson)
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
      console.error('Error saving private lesson:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الدرس',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            {isEditing ? 'تعديل الدرس الخصوصي' : 'إضافة درس خصوصي جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teacher Name */}
          <div className="space-y-2">
            <Label htmlFor="teacherName" className="text-right flex items-center justify-end gap-2">
              <span>اسم المدرس</span>
              <User className="w-4 h-4" />
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="teacherName"
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              placeholder="مثال: أ/ محمد علي"
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Subject Name */}
          <div className="space-y-2">
            <Label htmlFor="subjectName" className="text-right flex items-center justify-end gap-2">
              <span>المادة</span>
              <BookOpen className="w-4 h-4" />
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subjectName"
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              placeholder="مثال: رياضيات"
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Center Name */}
          <div className="space-y-2">
            <Label htmlFor="centerName" className="text-right block">
              اسم السنتر / المكان (اختياري)
            </Label>
            <Input
              id="centerName"
              value={formData.centerName}
              onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
              placeholder="مثال: سنتر النور"
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label className="text-right flex items-center justify-end gap-2">
              <span>الأيام</span>
              <Calendar className="w-4 h-4" />
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 justify-end">
              {DAYS_OF_WEEK.map((day) => (
                <Badge
                  key={day.value}
                  variant={formData.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-all px-3 py-1.5',
                    formData.daysOfWeek.includes(day.value) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary/10'
                  )}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.labelAr}
                </Badge>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-right flex items-center justify-end gap-2">
              <span>الوقت</span>
              <Clock className="w-4 h-4" />
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full text-right"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-right block">
              المدة (بالدقائق)
            </Label>
            <div className="flex gap-2 flex-wrap justify-end">
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
                setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })
              }
              className="w-24 mr-auto"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-right flex items-center justify-end gap-2">
              <span>العنوان / الموقع</span>
              <MapPin className="w-4 h-4" />
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="مثال: شقة 5، عمارة 10"
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-right block">اللون</Label>
            <div className="flex gap-2 flex-wrap justify-end">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    formData.color === color.value 
                      ? 'border-foreground scale-110' 
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                />
              ))}
              {formData.color && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, color: '' })}
                >
                  إلغاء
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right block">
              ملاحظات (اختياري)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
              className="text-right min-h-[80px]"
              dir="rtl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {isEditing ? 'حفظ التغييرات' : 'إضافة الدرس'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
