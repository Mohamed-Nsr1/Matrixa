/**
 * Weak Areas Detection API Route
 * 
 * Identifies weak areas based on:
 * - Lessons with low completion rates (video, questions, revision flags)
 * - Subjects with lowest progress percentages
 * - Tasks that are overdue or repeatedly rescheduled
 * - Focus sessions with low completion rates
 * 
 * Returns prioritized list of weak areas with recommendations
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Cache for weak areas (5 minutes)
const weakAreasCache = new Map<string, { data: WeakArea[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface WeakArea {
  id: string
  type: 'subject' | 'lesson' | 'task'
  name: string
  score: number // 0-100, lower = weaker
  reason: string // Arabic explanation
  recommendation: string // Action to take
  subjectId?: string
  lessonId?: string
  subjectName?: string
  color?: string
}

interface LessonWithProgress {
  id: string
  nameAr: string
  nameEn: string
  unit: {
    subjectId: string
    subject: {
      id: string
      nameAr: string
      nameEn: string
      color: string | null
    }
  }
  lessonProgress: Array<{
    doneVideo: boolean
    doneQuestions: boolean
    doneRevision: boolean
    confidenceLevel: string
    lastStudiedAt: Date | null
  }>
}

interface TaskData {
  id: string
  title: string
  status: string
  scheduledDate: Date | null
  createdAt: Date
  updatedAt: Date
  lessonId: string | null
  lesson: {
    nameAr: string
    nameEn: string
    unit: {
      subject: {
        id: string
        nameAr: string
        nameEn: string
        color: string | null
      }
    }
  } | null
}

interface FocusSessionData {
  id: string
  wasCompleted: boolean
  duration: number
  actualDuration: number | null
  subjectId: string | null
  subject: {
    id: string
    nameAr: string
    nameEn: string
    color: string | null
  } | null
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check cache
    const cached = weakAreasCache.get(user.id)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        weakAreas: cached.data,
        cached: true
      })
    }

    // Fetch all data needed for analysis
    const [subjects, lessons, tasks, focusSessions] = await Promise.all([
      // Get subjects with progress data
      prisma.subject.findMany({
        where: {
          branchId: user.branchId ?? undefined,
          isActive: true
        },
        include: {
          units: {
            include: {
              lessons: {
                include: {
                  lessonProgress: {
                    where: { userId: user.id }
                  }
                }
              }
            }
          }
        }
      }),
      
      // Get lessons with progress
      prisma.lesson.findMany({
        where: {
          unit: {
            subject: {
              branchId: user.branchId ?? undefined,
              isActive: true
            }
          },
          isActive: true
        },
        include: {
          unit: {
            include: {
              subject: {
                select: {
                  id: true,
                  nameAr: true,
                  nameEn: true,
                  color: true
                }
              }
            }
          },
          lessonProgress: {
            where: { userId: user.id }
          }
        }
      }) as Promise<LessonWithProgress[]>,
      
      // Get tasks for overdue/rescheduled analysis
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { not: 'COMPLETED' }
        },
        include: {
          lesson: {
            include: {
              unit: {
                include: {
                  subject: {
                    select: {
                      id: true,
                      nameAr: true,
                      nameEn: true,
                      color: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }) as Promise<TaskData[]>,
      
      // Get focus sessions for completion rate analysis
      prisma.focusSession.findMany({
        where: {
          userId: user.id,
          subjectId: { not: null }
        }
      })
    ])

    // Get subject info for focus sessions
    const focusSubjectIds = [...new Set(focusSessions.map(s => s.subjectId).filter((id): id is string => id !== null))]
    const focusSubjects = focusSubjectIds.length > 0 
      ? await prisma.subject.findMany({
          where: { id: { in: focusSubjectIds } },
          select: { id: true, nameAr: true, nameEn: true, color: true }
        })
      : []
    const focusSubjectMap = new Map(focusSubjects.map(s => [s.id, s]))

    const weakAreas: WeakArea[] = []

    // 1. Analyze Subjects - Find lowest progress subjects
    const subjectProgress = subjects.map(subject => {
      let total = 0
      let completed = 0
      
      subject.units.forEach(unit => {
        unit.lessons.forEach(lesson => {
          total += 3
          const progress = lesson.lessonProgress[0]
          if (progress) {
            if (progress.doneVideo) completed++
            if (progress.doneQuestions) completed++
            if (progress.doneRevision) completed++
          }
        })
      })
      
      return {
        id: subject.id,
        nameAr: subject.nameAr,
        nameEn: subject.nameEn,
        color: subject.color,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        totalLessons: subject.units.reduce((sum, u) => sum + u.lessons.length, 0)
      }
    })

    // Add subjects with progress < 30% as weak areas
    const weakSubjects = subjectProgress
      .filter(s => s.progress < 30 && s.totalLessons > 0)
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 3)

    weakSubjects.forEach(subject => {
      const score = subject.progress
      weakAreas.push({
        id: `subject-${subject.id}`,
        type: 'subject',
        name: subject.nameAr,
        score,
        reason: `نسبة الإنجاز في هذه المادة ${score}% فقط`,
        recommendation: getSubjectRecommendation(score),
        subjectId: subject.id,
        subjectName: subject.nameAr,
        color: subject.color || undefined
      })
    })

    // 2. Analyze Lessons - Find lessons with low completion or low confidence
    const lessonsWithScores = lessons.map(lesson => {
      const progress = lesson.lessonProgress[0]
      let completionScore = 0
      let confidencePenalty = 0
      
      if (progress) {
        // Calculate completion score (0-60 points)
        if (progress.doneVideo) completionScore += 20
        if (progress.doneQuestions) completionScore += 20
        if (progress.doneRevision) completionScore += 20
        
        // Confidence level affects score
        if (progress.confidenceLevel === 'LOW') {
          confidencePenalty = 30
        } else if (progress.confidenceLevel === 'MEDIUM') {
          confidencePenalty = 10
        }
        
        // Not studied recently penalty
        if (progress.lastStudiedAt) {
          const daysSinceStudied = Math.floor(
            (Date.now() - new Date(progress.lastStudiedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSinceStudied > 7) {
            confidencePenalty += Math.min(20, daysSinceStudied - 7)
          }
        }
      }
      
      return {
        id: lesson.id,
        nameAr: lesson.nameAr,
        nameEn: lesson.nameEn,
        subjectId: lesson.unit.subject.id,
        subjectName: lesson.unit.subject.nameAr,
        subjectNameEn: lesson.unit.subject.nameEn,
        color: lesson.unit.subject.color,
        score: Math.max(0, completionScore - confidencePenalty),
        hasProgress: !!progress,
        doneVideo: progress?.doneVideo || false,
        doneQuestions: progress?.doneQuestions || false,
        doneRevision: progress?.doneRevision || false,
        confidenceLevel: progress?.confidenceLevel || null
      }
    })

    // Add lessons with score < 30 as weak areas
    const weakLessons = lessonsWithScores
      .filter(l => l.score < 30)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)

    weakLessons.forEach(lesson => {
      const { score } = lesson
      weakAreas.push({
        id: `lesson-${lesson.id}`,
        type: 'lesson',
        name: lesson.nameAr,
        score,
        reason: getLessonReason(lesson),
        recommendation: getLessonRecommendation(lesson),
        subjectId: lesson.subjectId,
        lessonId: lesson.id,
        subjectName: lesson.subjectName,
        color: lesson.color || undefined
      })
    })

    // 3. Analyze Tasks - Find overdue and repeatedly rescheduled tasks
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const taskAnalysis = tasks.map(task => {
      let score = 50 // Base score
      let isOverdue = false
      let rescheduleCount = 0
      
      // Check if overdue
      if (task.scheduledDate && new Date(task.scheduledDate) < today) {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(task.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        score -= Math.min(40, daysOverdue * 5)
        isOverdue = true
      }
      
      // Check for rescheduling (updatedAt significantly different from createdAt)
      const updateDiff = task.updatedAt.getTime() - task.createdAt.getTime()
      if (updateDiff > 1000 * 60 * 60) { // More than 1 hour difference
        rescheduleCount = 1
        score -= 15
      }
      
      return {
        ...task,
        score: Math.max(0, score),
        isOverdue,
        rescheduleCount
      }
    })

    // Add problematic tasks as weak areas
    const problematicTasks = taskAnalysis
      .filter(t => t.score < 35 && t.isOverdue)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)

    problematicTasks.forEach(task => {
      weakAreas.push({
        id: `task-${task.id}`,
        type: 'task',
        name: task.title,
        score: task.score,
        reason: 'هذه المهمة متأخرة ولم تكتمل بعد',
        recommendation: 'ابدأ بهذه المهمة اليوم أو أعد جدولتها لوقت مناسب',
        lessonId: task.lessonId || undefined,
        subjectName: task.lesson?.unit.subject.nameAr,
        color: task.lesson?.unit.subject.color || undefined
      })
    })

    // 4. Analyze Focus Sessions - Find subjects with low completion rates
    const focusBySubject = new Map<string, { completed: number; total: number; subject: { id: string; nameAr: string; nameEn: string; color: string | null } }>()
    
    focusSessions.forEach(session => {
      if (!session.subjectId) return
      
      const subject = focusSubjectMap.get(session.subjectId)
      if (!subject) return
      
      const existing = focusBySubject.get(session.subjectId) || {
        completed: 0,
        total: 0,
        subject
      }
      
      existing.total++
      if (session.wasCompleted) existing.completed++
      
      focusBySubject.set(session.subjectId, existing)
    })

    // Add subjects with low focus completion rate
    focusBySubject.forEach((data, subjectId) => {
      if (data.total < 2) return // Need at least 2 sessions
      
      const completionRate = (data.completed / data.total) * 100
      
      if (completionRate < 50) {
        weakAreas.push({
          id: `focus-${subjectId}`,
          type: 'subject',
          name: data.subject!.nameAr,
          score: Math.round(completionRate),
          reason: `نسبة إكمال جلسات التركيز ${Math.round(completionRate)}% فقط`,
          recommendation: 'حاول تقسيم جلسات التركيز إلى فترات أقصر',
          subjectId,
          subjectName: data.subject!.nameAr,
          color: data.subject!.color || undefined
        })
      }
    })

    // Sort all weak areas by score (lowest first) and take top items
    const sortedWeakAreas = weakAreas
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)

    // Update cache
    weakAreasCache.set(user.id, {
      data: sortedWeakAreas,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      weakAreas: sortedWeakAreas,
      cached: false
    })
  } catch (error) {
    console.error('Error detecting weak areas:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to detect weak areas' },
      { status: 500 }
    )
  }
}

// Helper functions for generating Arabic recommendations
function getSubjectRecommendation(score: number): string {
  if (score < 10) {
    return 'ابدأ بمتابعة دروس هذه المادة اليوم - كل خطوة صغيرة تحسب!'
  } else if (score < 20) {
    return 'خصص 30 دقيقة يومياً لهذه المادة لتحسين تقدمك'
  } else {
    return 'راجع الدروس غير المكتملة وحدد أهداف صغيرة قابلة للتحقيق'
  }
}

function getLessonReason(lesson: {
  hasProgress: boolean
  doneVideo: boolean
  doneQuestions: boolean
  doneRevision: boolean
  confidenceLevel: string | null
  score: number
}): string {
  if (!lesson.hasProgress) {
    return 'لم تبدأ في هذه الدرس بعد'
  }
  
  const incomplete: string[] = []
  if (!lesson.doneVideo) incomplete.push('الفيديو')
  if (!lesson.doneQuestions) incomplete.push('الأسئلة')
  if (!lesson.doneRevision) incomplete.push('المراجعة')
  
  if (incomplete.length > 0) {
    return `لم تكتمل بعد: ${incomplete.join('، ')}`
  }
  
  if (lesson.confidenceLevel === 'LOW') {
    return 'تحتاج إلى مراجعة إضافية لتحسين فهمك'
  }
  
  return 'درس يحتاج إلى اهتمام'
}

function getLessonRecommendation(lesson: {
  hasProgress: boolean
  doneVideo: boolean
  doneQuestions: boolean
  doneRevision: boolean
  confidenceLevel: string | null
}): string {
  if (!lesson.hasProgress || !lesson.doneVideo) {
    return 'ابدأ بمشاهدة فيديو الشرح'
  }
  
  if (!lesson.doneQuestions) {
    return 'حل الأسئلة للتأكد من فهمك'
  }
  
  if (!lesson.doneRevision) {
    return 'راجع الدرس لتثبيت المعلومات'
  }
  
  if (lesson.confidenceLevel === 'LOW') {
    return 'أعد مراجعة الدرس وادون ملاحظاتك'
  }
  
  return 'راجع هذا الدرس لتحسين فهمك'
}
