/**
 * Task Complete API Route
 * 
 * Toggles a task's completion status
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateStreakOnActivity } from '@/lib/streak'

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

    // Get the task
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Toggle status
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'

    // Use transaction for all related updates
    const result = await prisma.$transaction(async (tx) => {
      // Update task status
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : null
        }
      })

      // If completing a task with a lesson, update lesson progress
      if (newStatus === 'COMPLETED' && task.lessonId) {
        const progressField = task.taskType === 'VIDEO' 
          ? 'doneVideo' 
          : task.taskType === 'QUESTIONS' 
            ? 'doneQuestions' 
            : 'doneRevision'

        await tx.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId: user.id,
              lessonId: task.lessonId
            }
          },
          create: {
            userId: user.id,
            lessonId: task.lessonId,
            [progressField]: true,
            lastStudiedAt: new Date(),
            timesStudied: 1
          },
          update: {
            [progressField]: true,
            lastStudiedAt: new Date(),
            timesStudied: { increment: 1 }
          }
        })
      }

      // Update leaderboard if completing a task
      if (newStatus === 'COMPLETED') {
        await tx.leaderboardEntry.update({
          where: { userId: user.id },
          data: {
            tasksCompleted: { increment: 1 },
            score: { increment: 10 }
          }
        })
      }

      return updatedTask
    })

    // Update streak after successful transaction
    if (newStatus === 'COMPLETED') {
      await updateStreakOnActivity(user.id)
    }

    return NextResponse.json({
      success: true,
      task: result,
      status: newStatus
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
