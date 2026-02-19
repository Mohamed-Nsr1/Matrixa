/**
 * Lesson Progress API Route
 * 
 * Updates lesson progress (video, questions, revision)
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const progressSchema = z.object({
  type: z.enum(['video', 'questions', 'revision']),
  confidenceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validation = progressSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { type, confidenceLevel } = validation.data

    // Get current progress
    let progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: id
        }
      }
    })

    // Determine which field to toggle
    const fieldMap = {
      video: 'doneVideo',
      questions: 'doneQuestions',
      revision: 'doneRevision'
    }

    const field = fieldMap[type]
    const currentValue = progress?.[field] ?? false

    // Update or create progress
    progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: id
        }
      },
      create: {
        userId: user.id,
        lessonId: id,
        [field]: true,
        confidenceLevel: confidenceLevel || 'MEDIUM',
        lastStudiedAt: new Date(),
        timesStudied: 1
      },
      update: {
        [field]: !currentValue,
        confidenceLevel: confidenceLevel || progress?.confidenceLevel,
        lastStudiedAt: new Date(),
        timesStudied: { increment: 1 }
      }
    })

    return NextResponse.json({
      success: true,
      progress
    })
  } catch (error) {
    console.error('Error updating lesson progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
