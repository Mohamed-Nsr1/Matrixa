'use client'

import { useState } from 'react'
import { 
  Check, 
  Video, 
  FileQuestion, 
  RefreshCw, 
  Clock, 
  BookOpen,
  FileText,
  X,
  Save,
  Notebook
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface SessionSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionData: {
    duration: number // in seconds
    videosWatched: number
    questionsSolved: number
    revisionsCompleted: number
    brainDump?: string
    subjectName?: string
    lessonName?: string
    subjectId?: string
    lessonId?: string
  }
  onSave: (notes?: string, saveAsNote?: boolean) => void
  onDismiss: () => void
}

export default function SessionSummaryModal({
  open,
  onOpenChange,
  sessionData,
  onSave,
  onDismiss
}: SessionSummaryModalProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState('')
  const [saveAsNote, setSaveAsNote] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remainingMins = mins % 60
      return `${hours} ساعة ${remainingMins > 0 ? `${remainingMins} دقيقة` : ''}`
    }
    return `${mins} دقيقة`
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    if (saveAsNote && (sessionData.brainDump || notes)) {
      try {
        // Create note from brain dump and session notes
        const noteContent = sessionData.brainDump 
          ? notes 
            ? `<h3>تدوينات الأفكار</h3><p>${sessionData.brainDump.replace(/\n/g, '<br/>')}</p><h3>ملاحظات إضافية</h3><p>${notes.replace(/\n/g, '<br/>')}</p>`
            : `<p>${sessionData.brainDump.replace(/\n/g, '<br/>')}</p>`
          : `<p>${notes.replace(/\n/g, '<br/>')}</p>`

        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `ملاحظات جلسة تركيز - ${sessionData.subjectName || 'عامة'}`,
            content: noteContent,
            subjectId: sessionData.subjectId || null,
            lessonId: sessionData.lessonId || null,
          })
        })

        const data = await response.json()
        
        if (data.success) {
          toast({
            title: 'تم حفظ الملاحظة',
            description: 'تم إنشاء ملاحظة من جلسة التركيز'
          })
        }
      } catch (error) {
        console.error('Error saving note:', error)
      }
    }

    onSave(notes.trim() || undefined, saveAsNote)
    setIsSaving(false)
    onOpenChange(false)
  }

  const handleDismiss = () => {
    onDismiss()
    onOpenChange(false)
  }

  const hasProgressMarkers = 
    sessionData.videosWatched > 0 || 
    sessionData.questionsSolved > 0 || 
    sessionData.revisionsCompleted > 0

  const hasContentToSave = sessionData.brainDump || notes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] text-right bg-gradient-to-b from-slate-900 to-slate-950 border-white/10" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald" />
            </div>
            ملخص الجلسة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Duration */}
          <div className="flex items-center justify-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-violet-400" />
            <span className="font-semibold">{formatDuration(sessionData.duration)}</span>
          </div>

          {/* Subject/Lesson */}
          {(sessionData.subjectName || sessionData.lessonName) && (
            <div className="bg-violet-500/10 rounded-lg p-3 flex items-center gap-2 justify-center border border-violet-500/20">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span className="text-sm">
                {sessionData.subjectName}
                {sessionData.lessonName && ` - ${sessionData.lessonName}`}
              </span>
            </div>
          )}

          {/* Progress Markers */}
          {hasProgressMarkers && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {sessionData.videosWatched > 0 && (
                <Badge 
                  variant="outline" 
                  className="bg-emerald/10 text-emerald border-emerald/20 px-3 py-1"
                >
                  <Video className="w-3.5 h-3.5 ml-1" />
                  {sessionData.videosWatched} شرح فيديو
                </Badge>
              )}
              {sessionData.questionsSolved > 0 && (
                <Badge 
                  variant="outline" 
                  className="bg-blue/10 text-blue border-blue/20 px-3 py-1"
                >
                  <FileQuestion className="w-3.5 h-3.5 ml-1" />
                  {sessionData.questionsSolved} حل أسئلة
                </Badge>
              )}
              {sessionData.revisionsCompleted > 0 && (
                <Badge 
                  variant="outline" 
                  className="bg-purple/10 text-purple border-purple/20 px-3 py-1"
                >
                  <RefreshCw className="w-3.5 h-3.5 ml-1" />
                  {sessionData.revisionsCompleted} مراجعة
                </Badge>
              )}
            </div>
          )}

          {/* Brain Dump */}
          {sessionData.brainDump && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>تدوينات الأفكار</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto border border-white/5">
                {sessionData.brainDump}
              </div>
            </div>
          )}

          {/* Additional Notes Input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">ملاحظات إضافية (اختياري)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات عن الجلسة..."
              className="min-h-[80px] text-right bg-white/5 border-white/10 focus:border-violet-500/50"
              dir="rtl"
            />
          </div>

          {/* Save as Note Option */}
          {hasContentToSave && (
            <div className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Checkbox
                id="saveAsNote"
                checked={saveAsNote}
                onCheckedChange={(checked) => setSaveAsNote(checked as boolean)}
                className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <label htmlFor="saveAsNote" className="text-sm cursor-pointer flex items-center gap-2">
                <Notebook className="w-4 h-4 text-cyan-400" />
                <span>حفظ كملحوظة في دفتر الملاحظات</span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button variant="ghost" onClick={handleDismiss} className="hover:bg-white/5">
            تخطي
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-1" />
                حفظ الملخص
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
