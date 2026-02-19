/**
 * Tasks API Route
 * 
 * GET: Returns all tasks for the current user (with filters)
 * POST: Create a new task
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status')

    // Build filter conditions
    const where: Record<string, unknown> = { userId: user.id }

    if (date) {
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
      const endDate = new Date(targetDate)
      endDate.setHours(23, 59, 59, 999)
      
      where.OR = [
        {
          scheduledDate: {
            gte: targetDate,
            lt: endDate
          }
        },
        { dayOfWeek: targetDate.getDay() }
      ]
    }

    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(status)) {
      where.status = status
    }

    if (subjectId) {
      where.lesson = {
        unit: {
          subjectId
        }
      }
    }

    const tasks = await prisma.task.findMany({
      where,
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
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      tasks
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, taskType, scheduledDate, duration, lessonId, dayOfWeek, scheduledTime, description } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!duration || duration < 1) {
      return NextResponse.json(
        { success: false, error: 'Duration must be at least 1 minute' },
        { status: 400 }
      )
    }

    // Validate taskType
    const validTaskTypes = ['VIDEO', 'QUESTIONS', 'REVISION']
    const finalTaskType = validTaskTypes.includes(taskType) ? taskType : 'VIDEO'

    // If lessonId is provided, verify it exists
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          unit: {
            include: {
              subject: {
                include: {
                  branch: true
                }
              }
            }
          }
        }
      })

      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        )
      }
    }

    // Parse scheduled date
    let parsedDate: Date | null = null
    let dayOfWeekValue: number | null = null

    if (scheduledDate) {
      parsedDate = new Date(scheduledDate)
      dayOfWeekValue = parsedDate.getDay()
    } else if (dayOfWeek !== undefined && dayOfWeek !== null) {
      dayOfWeekValue = dayOfWeek
    }

    // Get the max order for the day
    let order = 0
    if (dayOfWeekValue !== null) {
      const maxOrderTask = await prisma.task.findFirst({
        where: {
          userId: user.id,
          OR: [
            { dayOfWeek: dayOfWeekValue },
            ...(parsedDate ? [{ scheduledDate: parsedDate }] : [])
          ]
        },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = (maxOrderTask?.order || 0) + 1
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        taskType: finalTaskType as 'VIDEO' | 'QUESTIONS' | 'REVISION',
        status: 'PENDING',
        scheduledDate: parsedDate,
        dayOfWeek: dayOfWeekValue,
        scheduledTime: scheduledTime || null,
        duration: parseInt(duration),
        order
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

    // If lessonId provided, link the task
    if (lessonId) {
      await prisma.task.update({
        where: { id: task.id },
        data: { lessonId }
      })
    }

    return NextResponse.json({
      success: true,
      task
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
