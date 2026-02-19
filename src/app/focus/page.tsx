'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Check,
  Lightbulb,
  MessageSquare,
  Clock,
  Video,
  FileQuestion,
  RefreshCw,
  BookOpen,
  History,
  Plus,
  Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import SessionSummaryModal from '@/components/focus/SessionSummaryModal'

// Timer presets
const TIMER_PRESETS = [25, 45, 60]

interface Subject {
  id: string
  nameAr: string
  nameEn: string
  color: string | null
  units: {
    id: string
    nameAr: string
    lessons: {
      id: string
      nameAr: string
    }[]
  }[]
}

export default function FocusPage() {
  const { toast } = useToast()
  
  // Timer state
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [initialMinutes, setInitialMinutes] = useState(25)
  
  // Session state
  const [sessionStarted, setSessionStarted] = useState(false)
  const [brainDump, setBrainDump] = useState('')
  const [showBrainDump, setShowBrainDump] = useState(false)

  // New: Subject/Lesson selection
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('none')
  const [selectedLessonId, setSelectedLessonId] = useState<string>('none')

  // New: Progress markers
  const [videosWatched, setVideosWatched] = useState(0)
  const [questionsSolved, setQuestionsSolved] = useState(0)
  const [revisionsCompleted, setRevisionsCompleted] = useState(0)

  // New: Session summary modal
  const [showSummary, setShowSummary] = useState(false)
  const [completedSessionData, setCompletedSessionData] = useState<{
    duration: number
    videosWatched: number
    questionsSolved: number
    revisionsCompleted: number
    brainDump?: string
    subjectName?: string
    lessonName?: string
    subjectId?: string
    lessonId?: string
  } | null>(null)

  // Use ref to track if session is complete for callback
  const sessionCompleteRef = useRef(false)

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects()
  }, [])

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

  // Get selected subject and lesson names
  const getSelectedSubjectName = () => {
    if (!selectedSubjectId || selectedSubjectId === 'none') return undefined
    const subject = subjects.find(s => s.id === selectedSubjectId)
    return subject?.nameAr
  }

  const getSelectedLessonName = () => {
    if (!selectedLessonId || selectedLessonId === 'none') return undefined
    for (const subject of subjects) {
      for (const unit of subject.units) {
        const lesson = unit.lessons.find(l => l.id === selectedLessonId)
        if (lesson) return lesson.nameAr
      }
    }
    return undefined
  }

  // Handle session complete
  const handleSessionComplete = useCallback(async () => {
    if (sessionCompleteRef.current) return
    sessionCompleteRef.current = true

    toast({
      title: 'أحسنت! 🎉',
      description: `أكملت جلسة تركيز ${initialMinutes} دقيقة`
    })

    // Set completed session data for summary modal
    setCompletedSessionData({
      duration: initialMinutes * 60,
      videosWatched,
      questionsSolved,
      revisionsCompleted,
      brainDump: brainDump || undefined,
      subjectName: getSelectedSubjectName(),
      lessonName: getSelectedLessonName(),
      subjectId: selectedSubjectId && selectedSubjectId !== 'none' ? selectedSubjectId : undefined,
      lessonId: selectedLessonId && selectedLessonId !== 'none' ? selectedLessonId : undefined
    })

    // Show summary modal
    setShowSummary(true)

    // Save focus session to database
    try {
      await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: initialMinutes * 60,
          actualDuration: initialMinutes * 60,
          wasCompleted: true,
          brainDump: brainDump || undefined,
          videosWatched,
          questionsSolved,
          revisionsCompleted,
          subjectId: selectedSubjectId && selectedSubjectId !== 'none' ? selectedSubjectId : undefined,
          lessonId: selectedLessonId && selectedLessonId !== 'none' ? selectedLessonId : undefined
        })
      })
    } catch {
      // Handle silently
    }
  }, [initialMinutes, brainDump, videosWatched, questionsSolved, revisionsCompleted, selectedSubjectId, selectedLessonId, toast])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          if (prevSeconds === 0) {
            setMinutes(prevMinutes => {
              if (prevMinutes === 0) {
                setIsRunning(false)
                handleSessionComplete()
                return 0
              }
              return prevMinutes - 1
            })
            return 59
          }
          return prevSeconds - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isPaused, handleSessionComplete])

  const startSession = () => {
    sessionCompleteRef.current = false
    setSessionStarted(true)
    setIsRunning(true)
    setIsPaused(false)
    setInitialMinutes(minutes)
    // Reset progress markers when starting new session
    setVideosWatched(0)
    setQuestionsSolved(0)
    setRevisionsCompleted(0)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const resetTimer = () => {
    sessionCompleteRef.current = false
    setIsRunning(false)
    setIsPaused(false)
    setMinutes(initialMinutes)
    setSeconds(0)
  }

  const exitSession = async () => {
    if (sessionStarted && !sessionCompleteRef.current) {
      // Save session with actual duration
      const elapsedSeconds = (initialMinutes * 60) - (minutes * 60 + seconds)
      await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: initialMinutes * 60,
          actualDuration: elapsedSeconds,
          wasCompleted: minutes === 0 && seconds === 0,
          brainDump: brainDump || undefined,
          videosWatched,
          questionsSolved,
          revisionsCompleted,
          subjectId: selectedSubjectId && selectedSubjectId !== 'none' ? selectedSubjectId : undefined,
          lessonId: selectedLessonId && selectedLessonId !== 'none' ? selectedLessonId : undefined
        })
      }).catch(() => {})
    }
    window.location.href = '/dashboard'
  }

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const totalSeconds = initialMinutes * 60
  const remainingSeconds = minutes * 60 + seconds
  const progressPercent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100

  // Get all lessons for selected subject
  const availableLessons = selectedSubjectId && selectedSubjectId !== 'none'
    ? subjects
        .find(s => s.id === selectedSubjectId)
        ?.units.flatMap(unit => 
          unit.lessons.map(lesson => ({
            id: lesson.id,
            nameAr: lesson.nameAr,
            unitName: unit.nameAr
          }))
        ) || []
    : []

  // Handle summary modal save
  const handleSummarySave = async (notes?: string) => {
    // Notes are already saved in the initial save, but we could update if needed
    // For now, just close the modal
  }

  const handleSummaryDismiss = () => {
    // User dismissed the summary, nothing to do
  }

  // Start another session
  const startAnotherSession = () => {
    sessionCompleteRef.current = false
    setMinutes(initialMinutes)
    setSeconds(0)
    setIsRunning(true)
    setIsPaused(false)
    setVideosWatched(0)
    setQuestionsSolved(0)
    setRevisionsCompleted(0)
    setBrainDump('')
    setShowSummary(false)
    setCompletedSessionData(null)
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">وضع التركيز</h1>
          <p className="text-muted-foreground mb-8">
            اختر مدة الجلسة وابدأ المذاكرة بدون تشتت
          </p>

          {/* Subject/Lesson Selection */}
          <div className="space-y-3 mb-6 text-right">
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">المادة (اختياري)</label>
              <Select
                value={selectedSubjectId}
                onValueChange={(value) => {
                  setSelectedSubjectId(value)
                  setSelectedLessonId('none') // Reset lesson when subject changes
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المادة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">بدون تحديد</span>
                  </SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        {subject.color && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: subject.color }}
                          />
                        )}
                        <span>{subject.nameAr}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubjectId && selectedSubjectId !== 'none' && availableLessons.length > 0 && (
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">الدرس (اختياري)</label>
                <Select
                  value={selectedLessonId}
                  onValueChange={setSelectedLessonId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الدرس..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">بدون تحديد</span>
                    </SelectItem>
                    {availableLessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        <span className="text-sm">
                          {lesson.unitName} - {lesson.nameAr}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Timer Presets */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setMinutes(preset)}
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  minutes === preset
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl font-bold">{preset}</span>
                <span className="text-xs opacity-70">دقيقة</span>
              </button>
            ))}
          </div>

          {/* Start Button */}
          <Button
            size="lg"
            onClick={startSession}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-violet to-primary hover:opacity-90 text-lg"
          >
            <div className="flex flex-col items-center">
              <Play className="w-10 h-10 mb-2" fill="currentColor" />
              <span>ابدأ</span>
            </div>
          </Button>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/dashboard'}
            >
              <X className="w-4 h-4 ml-1" />
              إلغاء
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/focus/history'}
            >
              <History className="w-4 h-4 ml-1" />
              السجل
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-card z-50">
        <div
          className="h-full bg-gradient-to-l from-violet to-primary transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Exit Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={exitSession}
          className="bg-card/50 hover:bg-card"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Subject/Lesson Display */}
      {selectedSubjectId && selectedSubjectId !== 'none' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>{getSelectedSubjectName()}</span>
            {selectedLessonId && selectedLessonId !== 'none' && (
              <>
                <span className="text-muted-foreground">/</span>
                <span>{getSelectedLessonName()}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative">
          {/* Circular Progress */}
          <svg className="w-72 h-72 transform -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="130"
              className="stroke-card fill-none"
              strokeWidth="8"
            />
            <circle
              cx="144"
              cy="144"
              r="130"
              className="stroke-primary fill-none"
              strokeWidth="8"
              strokeLinecap="round"
              style={{
                strokeDasharray: 2 * Math.PI * 130,
                strokeDashoffset: 2 * Math.PI * 130 * (1 - progressPercent / 100),
                transition: 'stroke-dashoffset 1s linear'
              }}
            />
          </svg>

          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl font-mono font-bold">
              {formatTime(minutes, seconds)}
            </span>
            {isPaused && (
              <span className="text-muted-foreground text-sm mt-2">متوقف</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="w-12 h-12 rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            onClick={togglePause}
            className={`w-16 h-16 rounded-full ${isPaused ? 'bg-emerald hover:bg-emerald/90' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isPaused ? (
              <Play className="w-6 h-6" fill="currentColor" />
            ) : (
              <Pause className="w-6 h-6" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowBrainDump(!showBrainDump)}
            className="w-12 h-12 rounded-full"
          >
            <Lightbulb className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress Marker Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t p-4">
        <div className="max-w-md mx-auto">
          <p className="text-xs text-muted-foreground text-center mb-3">سجل نشاطك خلال الجلسة</p>
          <div className="flex items-center justify-center gap-3">
            {/* Video Button */}
            <button
              onClick={() => setVideosWatched(v => v + 1)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-emerald/10 border border-emerald/20 hover:bg-emerald/20 transition-colors"
            >
              <div className="flex items-center gap-1">
                <Video className="w-5 h-5 text-emerald" />
                <span className="font-bold text-emerald">{videosWatched}</span>
              </div>
              <span className="text-xs text-emerald/80">شرح فيديو</span>
            </button>

            {/* Questions Button */}
            <button
              onClick={() => setQuestionsSolved(q => q + 1)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-blue/10 border border-blue/20 hover:bg-blue/20 transition-colors"
            >
              <div className="flex items-center gap-1">
                <FileQuestion className="w-5 h-5 text-blue" />
                <span className="font-bold text-blue">{questionsSolved}</span>
              </div>
              <span className="text-xs text-blue/80">حل أسئلة</span>
            </button>

            {/* Revision Button */}
            <button
              onClick={() => setRevisionsCompleted(r => r + 1)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-purple/10 border border-purple/20 hover:bg-purple/20 transition-colors"
            >
              <div className="flex items-center gap-1">
                <RefreshCw className="w-5 h-5 text-purple" />
                <span className="font-bold text-purple">{revisionsCompleted}</span>
              </div>
              <span className="text-xs text-purple/80">مراجعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Brain Dump Modal */}
      {showBrainDump && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                تدوين الأفكار
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBrainDump(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              اكتب أي أفكار تشتت انتباهك هنا. لن يتوقف المؤقت.
            </p>
            <Textarea
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              placeholder="اكتب أفكارك هنا..."
              className="min-h-32 mb-4"
              autoFocus
            />
            <div className="flex justify-end">
              <Button onClick={() => setShowBrainDump(false)}>
                <Check className="w-4 h-4 ml-1" />
                تم
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSummary && completedSessionData && (
        <SessionSummaryModal
          open={showSummary}
          onOpenChange={setShowSummary}
          sessionData={completedSessionData}
          onSave={handleSummarySave}
          onDismiss={handleSummaryDismiss}
        />
      )}

      {/* Session Complete Modal (fallback if summary modal is closed) */}
      {minutes === 0 && seconds === 0 && !showSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald" />
            </div>
            <h2 className="text-2xl font-bold mb-2">أحسنت! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              أكملت جلسة تركيز {initialMinutes} دقيقة بنجاح
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={exitSession}>
                العودة للرئيسية
              </Button>
              <Button onClick={startAnotherSession}>
                جلسة أخرى
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
