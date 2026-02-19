/**
 * Insights API Route
 *
 * Returns user statistics and insights including chart data
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Arabic day names for RTL display
const arabicDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const arabicDayNamesShort = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Get user stats
    const [leaderboardEntry, streak, subjects, focusSessions, tasks, completedTasks] = await Promise.all([
      prisma.leaderboardEntry.findUnique({
        where: { userId: user.id }
      }),
      prisma.streak.findUnique({
        where: { userId: user.id }
      }),
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
      // Get focus sessions for last 30 days
      prisma.focusSession.findMany({
        where: {
          userId: user.id,
          startedAt: { gte: thirtyDaysAgo }
        },
        select: {
          startedAt: true,
          actualDuration: true,
          wasCompleted: true
        }
      }),
      // Get all tasks for completion tracking
      prisma.task.findMany({
        where: {
          userId: user.id,
          completedAt: { gte: thirtyDaysAgo }
        },
        select: {
          completedAt: true,
          status: true
        }
      }),
      // Get completed tasks count
      prisma.task.count({
        where: {
          userId: user.id,
          status: 'COMPLETED'
        }
      })
    ])

    // Calculate subject progress
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
        color: subject.color || undefined,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        totalLessons: subject.units.reduce((acc, u) => acc + u.lessons.length, 0),
        completedLessons: Math.floor(completed / 3)
      }
    }).filter(s => s.totalLessons > 0) // Only show subjects with lessons

    // Calculate weekly study time (last 7 days)
    const weeklyStudyTime: Array<{ day: string; dayIndex: number; minutes: number }> = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayIndex = date.getDay()

      // Get focus sessions for this day
      const daySessions = focusSessions.filter(s => {
        const sessionDate = new Date(s.startedAt)
        return sessionDate >= date && sessionDate < nextDate
      })

      const totalMinutes = daySessions.reduce((acc, s) => {
        return acc + Math.floor((s.actualDuration || 0) / 60)
      }, 0)

      weeklyStudyTime.push({
        day: arabicDayNames[dayIndex],
        dayIndex,
        minutes: totalMinutes
      })
    }

    // Calculate focus sessions trend (last 30 days)
    const focusSessionsTrend: Array<{ date: string; sessions: number; minutes: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const daySessions = focusSessions.filter(s => {
        const sessionDate = new Date(s.startedAt)
        return sessionDate >= date && sessionDate < nextDate
      })

      const totalMinutes = daySessions.reduce((acc, s) => {
        return acc + Math.floor((s.actualDuration || 0) / 60)
      }, 0)

      focusSessionsTrend.push({
        date: date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        sessions: daySessions.length,
        minutes: totalMinutes
      })
    }

    // Calculate task completion rate (last 30 days)
    const taskCompletionTrend: Array<{ date: string; completed: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayCompleted = tasks.filter(t => {
        if (!t.completedAt) return false
        const completedDate = new Date(t.completedAt)
        return completedDate >= date && completedDate < nextDate
      }).length

      taskCompletionTrend.push({
        date: date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        completed: dayCompleted
      })
    }

    // Calculate insights
    const totalStudyMinutes = Math.floor((leaderboardEntry?.studyMinutes || 0))
    const weeklyMinutes = weeklyStudyTime.reduce((acc, d) => acc + d.minutes, 0)
    const previousWeekMinutes = focusSessions
      .filter(s => {
        const sessionDate = new Date(s.startedAt)
        const twoWeeksAgo = new Date(now)
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        const oneWeekAgo = new Date(now)
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return sessionDate >= twoWeeksAgo && sessionDate < oneWeekAgo
      })
      .reduce((acc, s) => acc + Math.floor((s.actualDuration || 0) / 60), 0)

    // Calculate percentage change
    let weeklyChange = 0
    if (previousWeekMinutes > 0) {
      weeklyChange = Math.round(((weeklyMinutes - previousWeekMinutes) / previousWeekMinutes) * 100)
    } else if (weeklyMinutes > 0) {
      weeklyChange = 100 // New activity
    }

    // Average daily study time
    const avgDailyMinutes = weeklyMinutes > 0 ? Math.round(weeklyMinutes / 7) : 0

    // Most productive day
    const mostProductiveDay = weeklyStudyTime.reduce((max, day) =>
      day.minutes > max.minutes ? day : max
    , { day: '', minutes: 0 })

    // Total focus sessions
    const totalFocusSessions = focusSessions.filter(s => s.wasCompleted).length

    return NextResponse.json({
      success: true,
      stats: {
        totalStudyMinutes,
        tasksCompleted: completedTasks,
        focusSessions: totalFocusSessions,
        currentStreak: streak?.currentStreak || 0,
        subjectProgress,
        // Chart data
        weeklyStudyTime,
        focusSessionsTrend,
        taskCompletionTrend,
        // Insights
        weeklyMinutes,
        weeklyChange,
        avgDailyMinutes,
        mostProductiveDay: mostProductiveDay.minutes > 0 ? mostProductiveDay.day : null
      }
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}
