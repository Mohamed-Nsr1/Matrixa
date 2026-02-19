'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Target, Calendar, Sparkles, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamCountdownProps {
  examDate: string | null // ISO date string
  className?: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

// Motivational messages based on remaining days
const getMotivationalMessage = (days: number): { message: string; urgent: boolean } => {
  if (days < 0) {
    return { message: 'في انتظار النتائج! بالتوفيق 🎉', urgent: false }
  }
  if (days < 7) {
    return { message: 'حان وقت الهدوء والثقة بالنفس!', urgent: true }
  }
  if (days < 30) {
    return { message: 'التركيز على المراجعة النهائية!', urgent: false }
  }
  if (days < 100) {
    return { message: 'الوقت مناسب للمراجعة المكثفة', urgent: false }
  }
  return { message: 'لديك وقت كافٍ للتحضير! استمر في المذاكرة', urgent: false }
}

export function ExamCountdown({ examDate, className }: ExamCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [mounted, setMounted] = useState(false)

  // Calculate next June date if no exam date set
  const targetDate = useMemo(() => {
    if (examDate) {
      return new Date(examDate)
    }
    
    // Default to next June 15th (typical Thanaweya Amma start)
    const now = new Date()
    const currentYear = now.getFullYear()
    let juneDate = new Date(currentYear, 5, 15) // June 15th
    
    // If June date has passed, use next year
    if (juneDate <= now) {
      juneDate = new Date(currentYear + 1, 5, 15)
    }
    
    return juneDate
  }, [examDate])

  // Calculate time remaining
  useEffect(() => {
    setMounted(true)
    
    const calculateTimeRemaining = (): TimeRemaining => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        return {
          days: Math.abs(Math.floor(difference / (1000 * 60 * 60 * 24))),
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        }
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds, total: difference }
    }

    setTimeRemaining(calculateTimeRemaining())

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Determine if exam has passed
  const examPassed = timeRemaining && timeRemaining.total <= 0
  
  // Get motivational message
  const { message, urgent } = timeRemaining 
    ? getMotivationalMessage(examPassed ? -1 : timeRemaining.days)
    : { message: '', urgent: false }

  // Determine styling based on remaining days
  const getStyling = () => {
    if (!timeRemaining) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' }
    if (examPassed) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' }
    if (timeRemaining.days < 7) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
    if (timeRemaining.days < 30) return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' }
    return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' }
  }

  const styling = getStyling()

  if (!mounted || !timeRemaining) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-6 bg-muted rounded w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-500',
      styling.bg,
      styling.border,
      urgent && 'animate-pulse-slow',
      className
    )}>
      <CardContent className="p-0">
        {/* Header */}
        <div className={cn(
          'px-4 py-2 flex items-center justify-between',
          examPassed ? 'bg-emerald-500/10' : urgent ? 'bg-red-500/10' : 'bg-amber-500/10'
        )}>
          <div className="flex items-center gap-2">
            {examPassed ? (
              <Sparkles className="w-4 h-4 text-emerald-400" />
            ) : urgent ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <Target className="w-4 h-4 text-amber-400" />
            )}
            <span className={cn(
              'text-sm font-medium',
              examPassed ? 'text-emerald-400' : urgent ? 'text-red-400' : 'text-amber-400'
            )}>
              {examPassed ? 'الامتحانات انتهت' : 'العد التنازلي للثانوية العامة'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(targetDate)}</span>
          </div>
        </div>

        {/* Countdown Display */}
        <div className="p-4">
          {examPassed ? (
            <div className="text-center py-2">
              <p className="text-lg font-medium text-emerald-400">{message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                مر {timeRemaining.days} {timeRemaining.days === 1 ? 'يوم' : 'أيام'} على الامتحانات
              </p>
            </div>
          ) : (
            <>
              {/* Days Display - Large */}
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className={cn(
                    'text-5xl md:text-6xl font-bold tabular-nums transition-all duration-300',
                    styling.text
                  )}>
                    {timeRemaining.days}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">يوم</div>
                </div>
              </div>

              {/* Hours, Minutes, Seconds - Smaller */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <TimeUnit value={timeRemaining.hours} label="ساعة" />
                <Separator />
                <TimeUnit value={timeRemaining.minutes} label="دقيقة" />
                <Separator />
                <TimeUnit value={timeRemaining.seconds} label="ثانية" animated />
              </div>

              {/* Motivational Message */}
              <div className={cn(
                'text-center p-3 rounded-lg',
                urgent ? 'bg-red-500/5' : 'bg-amber-500/5'
              )}>
                <p className={cn(
                  'text-sm font-medium',
                  urgent ? 'text-red-400' : 'text-amber-400'
                )}>
                  {message}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Time unit component
function TimeUnit({ value, label, animated = false }: { value: number; label: string; animated?: boolean }) {
  return (
    <div className="text-center">
      <div className={cn(
        'text-2xl md:text-3xl font-semibold tabular-nums',
        animated && 'transition-transform duration-200',
        'text-foreground'
      )}>
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// Separator component
function Separator() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  )
}

// Export a simpler inline countdown for compact views
export function ExamCountdownInline({ examDate, className }: ExamCountdownProps) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    const calculateDays = () => {
      const targetDate = examDate ? new Date(examDate) : getDefaultExamDate()
      const now = new Date()
      const difference = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      setDays(difference)
    }

    calculateDays()
    const interval = setInterval(calculateDays, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [examDate])

  if (days === null) return null

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg',
      days < 7 ? 'bg-red-500/10 text-red-400' :
      days < 30 ? 'bg-orange-500/10 text-orange-400' :
      'bg-amber-500/10 text-amber-400',
      className
    )}>
      <Target className="w-4 h-4" />
      <span className="text-sm font-medium">
        {days < 0 ? `${Math.abs(days)} يوم مرت` : `${days} يوم متبقي`}
      </span>
    </div>
  )
}

// Helper to get default exam date
function getDefaultExamDate(): Date {
  const now = new Date()
  const currentYear = now.getFullYear()
  let juneDate = new Date(currentYear, 5, 15)
  if (juneDate <= now) {
    juneDate = new Date(currentYear + 1, 5, 15)
  }
  return juneDate
}

export default ExamCountdown
