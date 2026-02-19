'use client'

import { useState, useEffect } from 'react'
import { Loader2, Pin, Palette } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import SubjectLessonSelector from './SubjectLessonSelector'
import RichTextEditor from './RichTextEditor'
import type { NoteFrontend as Note } from '@/types'

interface NoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note | null // For editing
  defaultSubjectId?: string | null // For pre-selecting subject
  defaultLessonId?: string | null // For pre-selecting lesson
  onNoteCreated?: (note: Note) => void
  onNoteUpdated?: (note: Note) => void
  studyLanguage?: string
}

export default function NoteModal({
  open,
  onOpenChange,
  note,
  defaultSubjectId,
  defaultLessonId,
  onNoteCreated,
  onNoteUpdated,
  studyLanguage = 'arabic'
}: NoteModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subjectId: null as string | null,
    lessonId: null as string | null,
    color: null as string | null,
    isPinned: false
  })

  const colorOptions = [
    { value: null, label: 'بدون لون' },
    { value: '#ef4444', label: 'أحمر' },
    { value: '#f97316', label: 'برتقالي' },
    { value: '#eab308', label: 'أصفر' },
    { value: '#22c55e', label: 'أخضر' },
    { value: '#06b6d4', label: 'سماوي' },
    { value: '#3b82f6', label: 'أزرق' },
    { value: '#8b5cf6', label: 'بنفسجي' },
    { value: '#ec4899', label: 'وردي' },
  ]

  const isEditing = !!note

  // Populate form when editing or when defaults change
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content,
        subjectId: note.subjectId,
        lessonId: note.lessonId,
        color: note.color ?? null,
        isPinned: note.isPinned ?? false
      })
    } else {
      setFormData({
        title: '',
        content: '',
        subjectId: defaultSubjectId || null,
        lessonId: defaultLessonId || null,
        color: null,
        isPinned: false
      })
    }
  }, [note, defaultSubjectId, defaultLessonId])

  // Check if content is empty (handle both plain text and HTML)
  const isContentEmpty = (content: string) => {
    if (!content.trim()) return true
    // Check if content is just empty HTML tags
    const stripped = content
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, '')
      .trim()
    return stripped.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isContentEmpty(formData.content)) {
      toast({
        title: 'خطأ',
        description: 'يرجى كتابة محتوى الملاحظة',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const url = isEditing ? `/api/notes/${note.id}` : '/api/notes'
      const method = isEditing ? 'PATCH' : 'POST'

      const body = {
        title: formData.title.trim() || null,
        content: formData.content.trim(),
        subjectId: formData.subjectId,
        lessonId: formData.lessonId,
        color: formData.color,
        isPinned: formData.isPinned
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: isEditing ? 'تم التحديث' : 'تم الإنشاء',
          description: isEditing ? 'تم تحديث الملاحظة بنجاح' : 'تم إنشاء الملاحظة بنجاح'
        })

        if (isEditing) {
          onNoteUpdated?.(data.note)
        } else {
          onNoteCreated?.(data.note)
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
      console.error('Error saving note:', error)
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الملاحظة',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {isEditing ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Input
              placeholder="العنوان (اختياري)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="اكتب ملاحظتك هنا..."
              minHeight={250}
              dir="rtl"
            />
          </div>

          {/* Subject/Lesson Selector */}
          <SubjectLessonSelector
            subjectId={formData.subjectId}
            lessonId={formData.lessonId}
            onSubjectChange={(id) => setFormData({ ...formData, subjectId: id, lessonId: id ? formData.lessonId : null })}
            onLessonChange={(id) => setFormData({ ...formData, lessonId: id })}
            studyLanguage={studyLanguage}
          />

          {/* Color Picker and Pin Toggle */}
          <div className="flex items-center gap-4 py-2">
            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                formData.isPinned 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-white/5 text-muted-foreground hover:text-white'
              }`}
            >
              <Pin className={`w-4 h-4 ${formData.isPinned ? 'fill-current' : ''}`} />
              <span className="text-sm">تثبيت</span>
            </button>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {colorOptions.map((option) => (
                  <button
                    key={option.value || 'none'}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      formData.color === option.value 
                        ? 'border-white scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ 
                      backgroundColor: option.value || 'transparent',
                      backgroundImage: option.value ? undefined : 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: option.value ? undefined : '8px 8px',
                      backgroundPosition: option.value ? undefined : '0 0, 0 4px, 4px -4px, -4px 0px'
                    }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || isContentEmpty(formData.content)}>
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {isEditing ? 'حفظ التغييرات' : 'إنشاء الملاحظة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
