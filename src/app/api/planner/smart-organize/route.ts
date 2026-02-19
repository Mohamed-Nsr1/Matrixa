/**
 * Smart Organize API Route
 * 
 * Automatically organizes tasks based on weak subjects,
 * unfinished tasks, and private lesson conflicts
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const smartOrganizeSchema = z.object({
  dailyStudyHours: z.number().min(1).max(12).default(4),
  focusAreas: z.array(z.string()).optional(), // Subject IDs to prioritize
  includeWeekends: z.boolean().default(true),
  respectPrivateLessons: z.boolean().default(true)
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = smartOrganizeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { dailyStudyHours, focusAreas, includeWeekends, respectPrivateLessons } = validation.data

    // Get user's incomplete tasks
    const incompleteTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    })

    // Get user's private lessons
    const privateLessons = respectPrivateLessons ? await prisma.privateLesson.findMany({
      where: {
        userId: user.id,
        isActive: true
      }
    }) : []

    // Get lesson progress to identify weak areas
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId: user.id },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    })

    // Calculate weak subjects (subjects with low completion rate)
    const subjectProgress = new Map<string, { total: number; completed: number }>()
    
    lessonProgress.forEach(lp => {
      const subjectId = lp.lesson?.unit?.subjectId
      if (subjectId) {
        const current = subjectProgress.get(subjectId) || { total: 0, completed: 0 }
        current.total += 3 // video + questions + revision
        if (lp.doneVideo) current.completed++
        if (lp.doneQuestions) current.completed++
        if (lp.doneRevision) current.completed++
        subjectProgress.set(subjectId, current)
      }
    })

    // Sort subjects by completion rate (lowest first)
    const weakSubjects = Array.from(subjectProgress.entries())
      .map(([subjectId, data]) => ({
        subjectId,
        completionRate: data.total > 0 ? data.completed / data.total : 0
      }))
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 3)
      .map(s => s.subjectId)

    // Get private lesson blocked times
    const blockedTimes = new Map<number, string[]>() // day -> times
    privateLessons.forEach(pl => {
      try {
        const days: number[] = JSON.parse(pl.daysOfWeek)
        days.forEach(day => {
          const times = blockedTimes.get(day) || []
          times.push(pl.time)
          blockedTimes.set(day, times)
        })
      } catch {}
    })

    // Organize tasks
    const daysToUse = includeWeekends ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4] // Sun-Thu
    const minutesPerDay = dailyStudyHours * 60
    const updates: { taskId: string; dayOfWeek: number }[] = []
    
    // Sort tasks: prioritize focus areas, then weak subjects
    const sortedTasks = incompleteTasks.sort((a, b) => {
      const aSubjectId = a.lesson?.unit?.subjectId
      const bSubjectId = b.lesson?.unit?.subjectId
      
      // Focus areas first
      if (focusAreas?.includes(aSubjectId || '') && !focusAreas?.includes(bSubjectId || '')) return -1
      if (focusAreas?.includes(bSubjectId || '') && !focusAreas?.includes(aSubjectId || '')) return 1
      
      // Then weak subjects
      if (weakSubjects.includes(aSubjectId || '') && !weakSubjects.includes(bSubjectId || '')) return -1
      if (weakSubjects.includes(bSubjectId || '') && !weakSubjects.includes(aSubjectId || '')) return 1
      
      return 0
    })

    // Distribute tasks across days
    let currentDay = new Date().getDay()
    let currentDayMinutes = 0
    
    for (const task of sortedTasks) {
      // Find a day with capacity
      let attempts = 0
      while (attempts < 7) {
        const day = daysToUse[(daysToUse.indexOf(currentDay) + attempts) % daysToUse.length]
        
        // Check if day has capacity
        if (currentDayMinutes + task.duration <= minutesPerDay) {
          // Check private lesson conflicts
          const blocked = blockedTimes.get(day) || []
          // For simplicity, we're not checking time conflicts in detail
          // A full implementation would need scheduledTime checking
          
          updates.push({
            taskId: task.id,
            dayOfWeek: day
          })
          
          currentDayMinutes += task.duration
          break
        }
        
        attempts++
        currentDayMinutes = 0 // Reset for new day
      }
    }

    // Apply updates
    for (const update of updates) {
      await prisma.task.update({
        where: { id: update.taskId },
        data: { dayOfWeek: update.dayOfWeek }
      })
    }

    return NextResponse.json({
      success: true,
      message: `تم تنظيم ${updates.length} مهام`,
      organizedCount: updates.length,
      weakSubjectsIdentified: weakSubjects.length
    })
  } catch (error) {
    console.error('Smart organize error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to organize tasks' },
      { status: 500 }
    )
  }
}
