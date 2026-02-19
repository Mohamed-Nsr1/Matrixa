'use client'

import { useState } from 'react'
import { MoreVertical, Edit, Trash2, Clock, MapPin, User, BookOpen, Building, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
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

interface PrivateLessonCardProps {
  lesson: PrivateLesson
  compact?: boolean
  showDay?: boolean
  onEdit?: (lesson: PrivateLesson) => void
  onDelete?: (lessonId: string) => void
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function PrivateLessonCard({
  lesson,
  compact = false,
  showDay = false,
  onEdit,
  onDelete
}: PrivateLessonCardProps) {
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const parsedDays: number[] = (() => {
    try {
      return JSON.parse(lesson.daysOfWeek)
    } catch {
      return []
    }
  })()

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'م' : 'ص'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/private-lessons/${lesson.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        onDelete?.(lesson.id)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف الدرس بنجاح'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error deleting private lesson:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الدرس',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Calculate end time
  const getEndTime = () => {
    const [hours, minutes] = lesson.time.split(':').map(Number)
    const endMinutes = hours * 60 + minutes + lesson.duration
    const endHours = Math.floor(endMinutes / 60) % 24
    const endMins = endMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  if (compact) {
    return (
      <div
        className="p-2 rounded-lg text-xs bg-amber-500/10 border border-amber-500/20"
        style={lesson.color ? { borderRight: `3px solid ${lesson.color}` } : undefined}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-1">{lesson.subjectName}</p>
            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="line-clamp-1">{lesson.teacherName}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTime(lesson.time)}</span>
              <span>({lesson.duration}د)</span>
            </div>
            {showDay && parsedDays.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {parsedDays.map(d => DAYS_AR[d]).join('، ')}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
            درس خصوصي
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="p-4 rounded-xl border bg-card transition-all hover:shadow-md"
        style={lesson.color ? { borderRight: `4px solid ${lesson.color}` } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Subject */}
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{lesson.subjectName}</h3>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                درس خصوصي
              </Badge>
            </div>

            {/* Teacher */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <User className="w-4 h-4" />
              <span>{lesson.teacherName}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(lesson.time)} - {formatTime(getEndTime())}</span>
              <span className="text-xs">({lesson.duration} دقيقة)</span>
            </div>

            {/* Days */}
            <div className="flex flex-wrap gap-1 mb-2">
              {parsedDays.map(day => (
                <Badge key={day} variant="secondary" className="text-[10px]">
                  {DAYS_AR[day]}
                </Badge>
              ))}
            </div>

            {/* Center */}
            {lesson.centerName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building className="w-4 h-4" />
                <span>{lesson.centerName}</span>
              </div>
            )}

            {/* Location */}
            {lesson.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span>{lesson.location}</span>
              </div>
            )}

            {/* Notes */}
            {lesson.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {lesson.notes}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(lesson)}>
                <Edit className="w-4 h-4 ml-2" />
                تعديل
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدرس الخصوصي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الدرس؟
              <br />
              <span className="font-medium">{lesson.subjectName} - {lesson.teacherName}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
