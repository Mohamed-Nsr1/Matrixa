/**
 * Admin Streak Update API Route
 * PATCH - Update a user's streak
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Update streak schema
const updateStreakSchema = z.object({
  currentStreak: z.number().int().min(0).optional(),
  longestStreak: z.number().int().min(0).optional(),
  lastActivityDate: z.string().optional().nullable(),
  reason: z.string().min(3) // Reason for modification (for audit)
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id: streakId } = await params
    const body = await request.json()
    const data = updateStreakSchema.parse(body)

    // Get the streak
    const streak = await prisma.streak.findUnique({
      where: { id: streakId },
      include: { user: { select: { id: true, fullName: true, email: true } } }
    })

    if (!streak) {
      return NextResponse.json({ success: false, error: 'Streak not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (data.currentStreak !== undefined) {
      updateData.currentStreak = data.currentStreak
    }
    if (data.longestStreak !== undefined) {
      updateData.longestStreak = data.longestStreak
    }
    if (data.lastActivityDate !== undefined) {
      updateData.lastActivityDate = data.lastActivityDate ? new Date(data.lastActivityDate) : null
    }

    // If current streak is set higher than longest, update longest too
    if (updateData.currentStreak !== undefined && updateData.currentStreak > (streak.longestStreak || 0)) {
      updateData.longestStreak = updateData.currentStreak
    }

    // Update the streak
    const updatedStreak = await prisma.streak.update({
      where: { id: streakId },
      data: updateData
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'STREAK_UPDATE',
        entityType: 'Streak',
        entityId: streakId,
        oldValue: JSON.stringify({
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: streak.lastActivityDate
        }),
        newValue: JSON.stringify({
          currentStreak: updatedStreak.currentStreak,
          longestStreak: updatedStreak.longestStreak,
          lastActivityDate: updatedStreak.lastActivityDate,
          reason: data.reason
        })
      }
    })

    return NextResponse.json({
      success: true,
      streak: updatedStreak,
      message: 'تم تحديث المسار بنجاح'
    })
  } catch (error) {
    console.error('Admin streak update error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data', 
        details: error.issues 
      }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET - Get a single streak's history/details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id: streakId } = await params

    const streak = await prisma.streak.findUnique({
      where: { id: streakId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            branch: { select: { nameAr: true } }
          }
        }
      }
    })

    if (!streak) {
      return NextResponse.json({ success: false, error: 'Streak not found' }, { status: 404 })
    }

    // Get audit logs for this streak
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Streak',
        entityId: streakId
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      success: true,
      streak: {
        ...streak,
        history: auditLogs
      }
    })
  } catch (error) {
    console.error('Admin streak get error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
