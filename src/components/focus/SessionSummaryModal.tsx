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
  X
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
  }
  onSave: (notes?: string) => void
  onDismiss: () => void
}

export default function SessionSummaryModal({
  open,
  onOpenChange,
  sessionData,
  onSave,
  onDismiss
}: SessionSummaryModalProps) {
  const [notes, setNotes] = useState('')

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remainingMins = mins % 60
      return `${hours} ساعة ${remainingMins > 0 ? `${remainingMins} دقيقة` : ''}`
    }
    return `${mins} دقيقة`
  }

  const handleSave = () => {
    onSave(notes.trim() || undefined)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            ملخص الجلسة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald" />
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold">{formatDuration(sessionData.duration)}</span>
          </div>

          {/* Subject/Lesson */}
          {(sessionData.subjectName || sessionData.lessonName) && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2 justify-center">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
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
              <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
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
              className="min-h-[80px] text-right"
              dir="rtl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button variant="outline" onClick={handleDismiss}>
            تخطي
          </Button>
          <Button onClick={handleSave}>
            حفظ الملخص
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
