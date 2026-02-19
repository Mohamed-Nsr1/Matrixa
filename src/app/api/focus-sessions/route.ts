/**
 * Focus Sessions API Route
 * 
 * Creates a new focus session record
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateStreakOnActivity } from '@/lib/streak'
import { z } from 'zod'

const sessionSchema = z.object({
  duration: z.number(),
  actualDuration: z.number().optional(),
  wasCompleted: z.boolean(),
  brainDump: z.string().optional(),
  notes: z.string().optional(),
  // Progress markers
  videosWatched: z.number().optional(),
  questionsSolved: z.number().optional(),
  revisionsCompleted: z.number().optional(),
  // Subject/Lesson linking
  subjectId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable()
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
    const validation = sessionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Create focus session
    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        duration: data.duration,
        actualDuration: data.actualDuration || data.duration,
        wasCompleted: data.wasCompleted,
        brainDump: data.brainDump,
        notes: data.notes,
        videosWatched: data.videosWatched || 0,
        questionsSolved: data.questionsSolved || 0,
        revisionsCompleted: data.revisionsCompleted || 0,
        subjectId: data.subjectId,
        lessonId: data.lessonId
      }
    })

    // Update leaderboard
    if (data.wasCompleted) {
      await prisma.leaderboardEntry.update({
        where: { userId: user.id },
        data: {
          focusSessions: { increment: 1 },
          studyMinutes: { increment: Math.floor((data.actualDuration || data.duration) / 60) },
          score: { increment: Math.floor((data.actualDuration || data.duration) / 60) }
        }
      })

      // Update streak using streak service
      await updateStreakOnActivity(user.id)
    }

    // Update lesson progress if lesson is selected
    if (data.lessonId && data.wasCompleted) {
      const existingProgress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: data.lessonId
          }
        }
      })

      if (existingProgress) {
        // Update existing progress
        await prisma.lessonProgress.update({
          where: { id: existingProgress.id },
          data: {
            doneVideo: data.videosWatched && data.videosWatched > 0 ? true : existingProgress.doneVideo,
            doneQuestions: data.questionsSolved && data.questionsSolved > 0 ? true : existingProgress.doneQuestions,
            doneRevision: data.revisionsCompleted && data.revisionsCompleted > 0 ? true : existingProgress.doneRevision,
            lastStudiedAt: new Date(),
            timesStudied: { increment: 1 }
          }
        })
      } else {
        // Create new progress
        await prisma.lessonProgress.create({
          data: {
            userId: user.id,
            lessonId: data.lessonId,
            doneVideo: data.videosWatched ? data.videosWatched > 0 : false,
            doneQuestions: data.questionsSolved ? data.questionsSolved > 0 : false,
            doneRevision: data.revisionsCompleted ? data.revisionsCompleted > 0 : false,
            lastStudiedAt: new Date(),
            timesStudied: 1
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      session
    })
  } catch (error) {
    console.error('Error creating focus session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const limit = parseInt(searchParams.get('limit') || '30')

    const where: { userId: string; subjectId?: string } = { userId: user.id }
    if (subjectId) {
      where.subjectId = subjectId
    }

    const sessions = await prisma.focusSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit
    })

    // Get subject info for sessions that have subjectId
    const subjectIds = [...new Set(sessions.map(s => s.subjectId).filter((id): id is string => id !== null))]
    const lessonIds = [...new Set(sessions.map(s => s.lessonId).filter((id): id is string => id !== null))]
    
    let subjects: { id: string; nameAr: string; nameEn: string }[] = []
    let lessons: { id: string; nameAr: string; nameEn: string; unit: { subject: { id: string } } }[] = []
    
    if (subjectIds.length > 0) {
      subjects = await prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, nameAr: true, nameEn: true }
      })
    }
    
    if (lessonIds.length > 0) {
      lessons = await prisma.lesson.findMany({
        where: { id: { in: lessonIds } },
        select: { 
          id: true, 
          nameAr: true, 
          nameEn: true,
          unit: {
            select: {
              subject: {
                select: { id: true }
              }
            }
          }
        }
      })
    }

    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    const lessonMap = new Map(lessons.map(l => [l.id, l]))

    // Enrich sessions with subject and lesson info
    const enrichedSessions = sessions.map(session => ({
      ...session,
      subject: session.subjectId ? subjectMap.get(session.subjectId) || null : null,
      lesson: session.lessonId ? lessonMap.get(session.lessonId) || null : null
    }))

    return NextResponse.json({
      success: true,
      sessions: enrichedSessions
    })
  } catch (error) {
    console.error('Error fetching focus sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
