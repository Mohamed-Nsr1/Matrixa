'use client'

import { useState, useEffect } from 'react'
import { Loader2, Pin, Palette, FileText, Sparkles, BookOpen, Brain, ListChecks } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
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

// Note Templates
const noteTemplates = [
  {
    id: 'blank',
    name: 'فارغ',
    nameEn: 'Blank',
    icon: FileText,
    content: ''
  },
  {
    id: 'cornell',
    name: 'طريقة كورنيل',
    nameEn: 'Cornell Method',
    icon: BookOpen,
    content: `<h2>الملاحظات الرئيسية</h2>
<p>اكتب ملاحظاتك الرئيسية هنا...</p>

<h2>الكلمات المفتاحية / الأسئلة</h2>
<ul>
<li>سؤال 1؟</li>
<li>سؤال 2؟</li>
<li>سؤال 3؟</li>
</ul>

<h2>الملخص</h2>
<p>اكتب ملخصاً قصيراً للملاحظات...</p>`
  },
  {
    id: 'summary',
    name: 'ملخص درس',
    nameEn: 'Lesson Summary',
    icon: Sparkles,
    content: `<h2>العنوان</h2>
<p>عنوان الدرس أو الموضوع</p>

<h2>النقاط الرئيسية</h2>
<ul>
<li>النقطة الأولى</li>
<li>النقطة الثانية</li>
<li>النقطة الثالثة</li>
</ul>

<h2>الأمثلة</h2>
<p>أمثلة توضيحية...</p>

<h2>ملاحظات إضافية</h2>
<p>أي ملاحظات أخرى...</p>`
  },
  {
    id: 'study-guide',
    name: 'دليل مذاكرة',
    nameEn: 'Study Guide',
    icon: Brain,
    content: `<h2>الموضوع</h2>
<p>اسم الموضوع</p>

<h2>المفاهيم الأساسية</h2>
<ul>
<li>مفهوم 1: الشرح...</li>
<li>مفهوم 2: الشرح...</li>
</ul>

<h2>القوانين والمعادلات</h2>
<ul>
<li>قانون 1: ...</li>
<li>قانون 2: ...</li>
</ul>

<h2>أسئلة للتدريب</h2>
<ol>
<li>سؤال 1</li>
<li>سؤال 2</li>
</ol>

<h2>نقاط تحتاج مراجعة</h2>
<ul>
<li>نقطة 1</li>
<li>نقطة 2</li>
</ul>`
  },
  {
    id: 'checklist',
    name: 'قائمة مهام',
    nameEn: 'Checklist',
    icon: ListChecks,
    content: `<h2>المهام</h2>
<ul>
<li>☐ المهمة الأولى</li>
<li>☐ المهمة الثانية</li>
<li>☐ المهمة الثالثة</li>
</ul>

<h2>ملاحظات</h2>
<p>أي ملاحظات إضافية...</p>`
  }
]

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
  const [showTemplates, setShowTemplates] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subjectId: null as string | null,
    lessonId: null as string | null,
    color: null as string | null,
    isPinned: false,
    isFavorite: false
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
        isPinned: note.isPinned ?? false,
        isFavorite: note.isFavorite ?? false
      })
    } else {
      setFormData({
        title: '',
        content: '',
        subjectId: defaultSubjectId || null,
        lessonId: defaultLessonId || null,
        color: null,
        isPinned: false,
        isFavorite: false
      })
    }
  }, [note, defaultSubjectId, defaultLessonId])

  // Apply template
  const applyTemplate = (template: typeof noteTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      content: template.content
    }))
    setShowTemplates(false)
    toast({
      title: 'تم تطبيق القالب',
      description: template.name
    })
  }

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
        isPinned: formData.isPinned,
        isFavorite: formData.isFavorite
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 border-white/10" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-between">
            <span className="flex items-center gap-2">
              {isEditing ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}
            </span>
            {!isEditing && (
              <DropdownMenu open={showTemplates} onOpenChange={setShowTemplates}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <FileText className="w-4 h-4" />
                    قوالب
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>اختر قالب</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {noteTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="gap-2"
                    >
                      <template.icon className="w-4 h-4 text-violet-400" />
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Input
              placeholder="العنوان (اختياري)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-right bg-white/5 border-white/10 focus:border-violet-500/50"
              dir="rtl"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="اكتب ملاحظتك هنا..."
              minHeight={280}
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

          {/* Options Row */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-t border-white/5">
            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                formData.isPinned 
                  ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30' 
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <Pin className={`w-4 h-4 ${formData.isPinned ? 'fill-current' : ''}`} />
              <span className="text-sm">تثبيت</span>
            </button>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1 p-1 rounded-lg bg-white/5">
                {colorOptions.map((option) => (
                  <button
                    key={option.value || 'none'}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    className={`w-5 h-5 rounded-full transition-all ${
                      formData.color === option.value 
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ 
                      backgroundColor: option.value || 'transparent',
                      backgroundImage: option.value ? undefined : 'linear-gradient(45deg, #64748b 25%, transparent 25%), linear-gradient(-45deg, #64748b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #64748b 75%), linear-gradient(-45deg, transparent 75%, #64748b 75%)',
                      backgroundSize: option.value ? undefined : '6px 6px',
                      backgroundPosition: option.value ? undefined : '0 0, 0 3px, 3px -3px, -3px 0px'
                    }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            {/* Character count hint */}
            {formData.content && (
              <Badge variant="outline" className="text-xs ml-auto">
                {formData.content.replace(/<[^>]+>/g, '').length} حرف
              </Badge>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                إلغاء
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={loading || isContentEmpty(formData.content)}
              className="bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {isEditing ? 'حفظ التغييرات' : 'إنشاء الملاحظة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
