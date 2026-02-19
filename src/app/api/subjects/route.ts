/**
 * Subjects API Route
 * 
 * Returns all subjects with units and lessons for the user's branch
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get subjects with units and lessons for user's branch
    const subjects = await prisma.subject.findMany({
      where: {
        branchId: user.branchId ?? undefined,
        isActive: true
      },
      include: {
        units: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Get lesson progress for user
    const lessonIds = subjects.flatMap(s => 
      s.units.flatMap(u => u.lessons.map(l => l.id))
    )

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
        lessonId: { in: lessonIds }
      }
    })

    // Create progress map
    const progressMap = new Map(progress.map(p => [p.lessonId, p]))

    // Add progress to lessons
    const subjectsWithProgress = subjects.map(subject => ({
      ...subject,
      units: subject.units.map(unit => ({
        ...unit,
        lessons: unit.lessons.map(lesson => ({
          ...lesson,
          progress: progressMap.get(lesson.id) || null
        }))
      }))
    }))

    return NextResponse.json({
      success: true,
      subjects: subjectsWithProgress
    })
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}
