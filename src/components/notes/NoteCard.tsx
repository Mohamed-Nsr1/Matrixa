'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, BookOpen, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn } from '@/lib/utils'
import RichTextContent from './RichTextContent'

interface Note {
  id: string
  title: string | null
  content: string
  subjectId: string | null
  lessonId: string | null
  subject?: {
    id: string
    nameAr: string
    nameEn: string
    color?: string | null
  }
  lesson?: {
    id: string
    nameAr: string
    nameEn: string
  }
  createdAt: string | Date
  updatedAt?: string | Date
}

interface NoteCardProps {
  note: Note
  studyLanguage?: string
  onEdit?: (note: Note) => void
  onDelete?: (noteId: string) => void
  onSubjectClick?: (subjectId: string) => void
  onLessonClick?: (lessonId: string) => void
  compact?: boolean
}

export default function NoteCard({
  note,
  studyLanguage = 'arabic',
  onEdit,
  onDelete,
  onSubjectClick,
  onLessonClick,
  compact = false
}: NoteCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getSubjectName = () => {
    if (!note.subject) return null
    return studyLanguage === 'arabic' ? note.subject.nameAr : note.subject.nameEn
  }

  const getLessonName = () => {
    if (!note.lesson) return null
    return studyLanguage === 'arabic' ? note.lesson.nameAr : note.lesson.nameEn
  }

  const formatDate = (date: string | Date) => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return format(d, 'dd MMM yyyy', { locale: ar })
    } catch {
      return ''
    }
  }

  const handleDelete = () => {
    onDelete?.(note.id)
    setShowDeleteDialog(false)
  }

  if (compact) {
    return (
      <div className={cn(
        "p-3 rounded-lg bg-white/5 border border-border/50 hover:border-primary/30 transition-colors",
        "group relative"
      )}>
        {/* Subject/Lesson Badges */}
        {(note.subject || note.lesson) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.subject && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: note.subject.color ? `${note.subject.color}20` : undefined,
                  borderColor: note.subject.color || undefined
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSubjectClick?.(note.subject!.id)
                }}
              >
                {note.subject.color && (
                  <div
                    className="w-1.5 h-1.5 rounded-full mr-1"
                    style={{ backgroundColor: note.subject.color }}
                  />
                )}
                {getSubjectName()}
              </Badge>
            )}
            {note.lesson && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  onLessonClick?.(note.lesson!.id)
                }}
              >
                <FileText className="w-2.5 h-2.5 mr-1" />
                {getLessonName()}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {note.title && (
              <h4 className="font-medium text-sm mb-1 truncate">{note.title}</h4>
            )}
            <RichTextContent
              content={note.content}
              preview
              maxLines={2}
              dir="rtl"
              className="text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit?.(note)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الملاحظة</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <Card className="group relative overflow-hidden hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {note.title && (
              <CardTitle className="text-lg truncate">{note.title}</CardTitle>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(note.createdAt)}
            </p>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(note)}>
                <Pencil className="w-4 h-4 ml-2" />
                تعديل
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Subject/Lesson Badges */}
        {(note.subject || note.lesson) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {note.subject && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: note.subject.color ? `${note.subject.color}20` : undefined,
                  borderColor: note.subject.color || undefined
                }}
                onClick={() => onSubjectClick?.(note.subject!.id)}
              >
                {note.subject.color && (
                  <div
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: note.subject.color }}
                  />
                )}
                <BookOpen className="w-3 h-3 mr-1" />
                {getSubjectName()}
              </Badge>
            )}
            {note.lesson && (
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onLessonClick?.(note.lesson!.id)}
              >
                <FileText className="w-3 h-3 mr-1" />
                {getLessonName()}
              </Badge>
            )}
          </div>
        )}

        {/* Rich Text Content */}
        <RichTextContent
          content={note.content}
          preview
          maxLines={4}
          dir="rtl"
        />
      </CardContent>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الملاحظة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
