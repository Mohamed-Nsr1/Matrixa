/**
 * Today's Tasks API Route
 * 
 * Returns all tasks scheduled for today
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

    // Get today's day of week (0 = Sunday, 6 = Saturday)
    const today = new Date()
    const dayOfWeek = today.getDay()

    // Get tasks for today
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          { dayOfWeek },
          { 
            scheduledDate: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
              lt: new Date(today.setHours(23, 59, 59, 999))
            }
          }
        ]
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
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      tasks
    })
  } catch (error) {
    console.error('Error fetching today tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
