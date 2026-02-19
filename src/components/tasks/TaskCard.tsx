'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Video, FileQuestion, RefreshCw, MoreVertical, Edit, Trash2, Clock, Loader2, GripVertical } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { TaskFrontend as Task } from '@/types'

interface TaskCardProps {
  task: Task
  compact?: boolean
  draggable?: boolean
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: string) => void
}

const TASK_TYPE_CONFIG = {
  VIDEO: {
    icon: Video,
    labelAr: 'فيديو',
    labelEn: 'Video',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  QUESTIONS: {
    icon: FileQuestion,
    labelAr: 'أسئلة',
    labelEn: 'Questions',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  REVISION: {
    icon: RefreshCw,
    labelAr: 'مراجعة',
    labelEn: 'Revision',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  }
}

const STATUS_COLORS = {
  PENDING: 'bg-muted/50',
  IN_PROGRESS: 'bg-primary/5 border-primary/30',
  COMPLETED: 'bg-emerald-500/10',
  SKIPPED: 'bg-destructive/5 opacity-60'
}

export default function TaskCard({
  task,
  compact = false,
  draggable = false,
  onEdit,
  onDelete,
  onStatusChange
}: TaskCardProps) {
  const { toast } = useToast()
  const [updating, setUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
    disabled: !draggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const typeConfig = TASK_TYPE_CONFIG[task.taskType]
  const TypeIcon = typeConfig.icon
  const isCompleted = task.status === 'COMPLETED'

  const handleToggleComplete = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST'
      })
      const data = await res.json()

      if (data.success) {
        onStatusChange?.(task.id, data.status)
        toast({
          title: data.status === 'COMPLETED' ? 'تم إنجاز المهمة' : 'تم إلغاء الإنجاز',
          description: data.status === 'COMPLETED' 
            ? 'أحسنت! استمر في التقدم' 
            : 'تم إعادة المهمة للقائمة'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث المهمة',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        onDelete?.(task.id)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف المهمة بنجاح'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف المهمة',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const subjectColor = task.lesson?.unit?.subject?.color

  // Build the style object for compact view
  const compactStyle = draggable ? {
    ...style,
    ...(subjectColor ? { borderRight: `3px solid ${subjectColor}` } : {})
  } : subjectColor ? { borderRight: `3px solid ${subjectColor}` } : undefined

  // Build the style object for full view
  const fullStyle = draggable ? {
    ...style,
    ...(subjectColor ? { borderRight: `4px solid ${subjectColor}` } : {})
  } : subjectColor ? { borderRight: `4px solid ${subjectColor}` } : undefined

  if (compact) {
    return (
      <div
        ref={draggable ? setNodeRef : undefined}
        style={compactStyle}
        className={cn(
          'p-2 rounded-lg text-xs transition-all',
          STATUS_COLORS[task.status],
          isCompleted && 'line-through',
          draggable && 'cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 shadow-lg scale-105 z-50',
          draggable && 'hover:shadow-md'
        )}
      >
        <div className="flex items-start gap-2">
          {draggable && (
            <GripVertical 
              className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5 touch-none"
              {...attributes}
              {...listeners}
            />
          )}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            disabled={updating}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-2">{task.title}</p>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{task.duration}د</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={draggable ? setNodeRef : undefined}
        style={fullStyle}
        className={cn(
          'p-3 rounded-xl border transition-all',
          STATUS_COLORS[task.status],
          draggable && 'cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 shadow-lg scale-105 z-50',
          draggable && 'hover:shadow-md'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {draggable && (
            <div 
              className="mt-1 cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            disabled={updating}
            className="mt-0.5"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p
                  className={cn(
                    'font-medium text-sm',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </p>

                {/* Subject/Lesson info */}
                {task.lesson?.unit?.subject && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.lesson.unit.subject.nameAr}
                    {task.lesson.nameAr && ` - ${task.lesson.nameAr}`}
                  </p>
                )}

                {/* Description */}
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(task)}>
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

            {/* Footer */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Task Type Badge */}
              <Badge variant="outline" className={cn('text-[10px] px-2 py-0', typeConfig.color)}>
                <TypeIcon className="w-3 h-3 ml-1" />
                {typeConfig.labelAr}
              </Badge>

              {/* Duration */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{task.duration} دقيقة</span>
              </div>

              {/* Status Badge */}
              {task.status === 'IN_PROGRESS' && (
                <Badge variant="secondary" className="text-[10px]">
                  قيد التنفيذ
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المهمة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المهمة؟
              <br />
              <span className="font-medium">{task.title}</span>
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
