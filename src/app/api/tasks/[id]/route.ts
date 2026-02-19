/**
 * Task API Route (by ID)
 * 
 * PATCH: Update a task
 * DELETE: Delete a task
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
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
    const { title, taskType, scheduledDate, duration, lessonId, status, dayOfWeek, scheduledTime, description } = body

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return NextResponse.json(
          { success: false, error: 'Title cannot be empty' },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (taskType !== undefined) {
      const validTaskTypes = ['VIDEO', 'QUESTIONS', 'REVISION']
      if (!validTaskTypes.includes(taskType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid task type' },
          { status: 400 }
        )
      }
      updateData.taskType = taskType
    }

    if (duration !== undefined) {
      if (!duration || duration < 1) {
        return NextResponse.json(
          { success: false, error: 'Duration must be at least 1 minute' },
          { status: 400 }
        )
      }
      updateData.duration = parseInt(duration)
    }

    if (scheduledDate !== undefined) {
      if (scheduledDate === null) {
        updateData.scheduledDate = null
        updateData.dayOfWeek = null
      } else {
        const parsedDate = new Date(scheduledDate)
        updateData.scheduledDate = parsedDate
        updateData.dayOfWeek = parsedDate.getDay()
      }
    }

    if (dayOfWeek !== undefined) {
      updateData.dayOfWeek = dayOfWeek
    }

    if (scheduledTime !== undefined) {
      updateData.scheduledTime = scheduledTime || null
    }

    if (lessonId !== undefined) {
      // Verify lesson exists if provided
      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: lessonId }
        })

        if (!lesson) {
          return NextResponse.json(
            { success: false, error: 'Lesson not found' },
            { status: 404 }
          )
        }
      }
      updateData.lessonId = lessonId || null
    }

    if (status !== undefined) {
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set completedAt if status is COMPLETED
      if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        updateData.completedAt = new Date()
      } else if (status !== 'COMPLETED') {
        updateData.completedAt = null
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      task: updatedTask
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
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

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete the task
    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
