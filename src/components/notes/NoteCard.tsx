'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, BookOpen, FileText, Star, Pin, Archive, Copy, ExternalLink } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'
import RichTextContent from './RichTextContent'

interface Note {
  id: string
  title: string | null
  content: string
  subjectId: string | null
  lessonId: string | null
  color?: string | null
  isPinned?: boolean
  isFavorite?: boolean
  isArchived?: boolean
  wordCount?: number
  readingTime?: number
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
  onToggleFavorite?: (noteId: string) => void
  onTogglePin?: (noteId: string) => void
  compact?: boolean
  showActions?: boolean
  variant?: 'card' | 'list'
}

export default function NoteCard({
  note,
  studyLanguage = 'arabic',
  onEdit,
  onDelete,
  onSubjectClick,
  onLessonClick,
  onToggleFavorite,
  onTogglePin,
  compact = false,
  showActions = false,
  variant = 'card'
}: NoteCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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

  const formatRelativeDate = (date: string | Date) => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return formatDistanceToNow(d, { addSuffix: true, locale: ar })
    } catch {
      return ''
    }
  }

  const handleDelete = () => {
    onDelete?.(note.id)
    setShowDeleteDialog(false)
  }

  // Determine card color/accent
  const cardAccent = note.color || note.subject?.color
  const hasAccent = !!cardAccent

  // List variant
  if (variant === 'list') {
    return (
      <div 
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
          "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10",
          hasAccent && "border-r-2"
        )}
        style={hasAccent ? { borderRightColor: cardAccent! } : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Pin/Favorite indicators */}
        <div className="flex items-center gap-1">
          {note.isPinned && (
            <Pin className="w-4 h-4 text-cyan-400" />
          )}
          {note.isFavorite && (
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          )}
        </div>

        {/* Title & Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {note.title && (
              <h4 className="font-medium truncate">{note.title}</h4>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {note.subject && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSubjectClick?.(note.subject!.id)
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                {note.subject.color && (
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: note.subject.color }}
                  />
                )}
                {getSubjectName()}
              </button>
            )}
            {note.lesson && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLessonClick?.(note.lesson!.id)
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {getLessonName()}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(note.updatedAt || note.createdAt)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
          {note.wordCount && (
            <span>{note.wordCount} كلمة</span>
          )}
          {note.readingTime && (
            <span>{note.readingTime} د قراءة</span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit?.(note)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-red-400"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

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

  // Compact variant
  if (compact) {
    return (
      <div 
        className={cn(
          "group relative p-3 rounded-lg transition-all duration-200 cursor-pointer",
          "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30",
          hasAccent && "border-r-2"
        )}
        style={hasAccent ? { borderRightColor: cardAccent! } : undefined}
        onClick={() => onEdit?.(note)}
      >
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

          {/* Pin/Favorite indicators */}
          <div className="flex flex-col items-center gap-1">
            {note.isPinned && (
              <Pin className="w-3 h-3 text-cyan-400" />
            )}
            {note.isFavorite && (
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(note)
            }}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteDialog(true)
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
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

  // Card variant (default)
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5",
        "bg-gradient-to-br from-white/5 to-transparent border border-white/5 hover:border-violet-500/20",
        hasAccent && "border-t-2"
      )}
      style={hasAccent ? { borderTopColor: cardAccent! } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pin/Favorite Badges */}
      <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
        {note.isPinned && (
          <div className="p-1 rounded bg-cyan-500/20">
            <Pin className="w-3 h-3 text-cyan-400" />
          </div>
        )}
        {note.isFavorite && (
          <div className="p-1 rounded bg-amber-500/20">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-8">
            {note.title && (
              <CardTitle className="text-lg truncate">{note.title}</CardTitle>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{formatRelativeDate(note.updatedAt || note.createdAt)}</span>
              {note.readingTime && (
                <>
                  <span>•</span>
                  <span>{note.readingTime} د قراءة</span>
                </>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(
                  "h-8 w-8 transition-opacity",
                  isHovered ? "opacity-100" : "opacity-0"
                )}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit?.(note)}>
                  <Pencil className="w-4 h-4 ml-2" />
                  تعديل
                </DropdownMenuItem>
                {onToggleFavorite && (
                  <DropdownMenuItem onClick={() => onToggleFavorite(note.id)}>
                    <Star className={cn("w-4 h-4 ml-2", note.isFavorite && "fill-amber-400 text-amber-400")} />
                    {note.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  </DropdownMenuItem>
                )}
                {onTogglePin && (
                  <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
                    <Pin className={cn("w-4 h-4 ml-2", note.isPinned && "text-cyan-400")} />
                    {note.isPinned ? 'فك التثبيت' : 'تثبيت'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
