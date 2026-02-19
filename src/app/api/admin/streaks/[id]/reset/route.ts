/**
 * Admin Streak Reset API Route
 * POST - Reset a user's streak to 0
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Reset streak schema
const resetStreakSchema = z.object({
  reason: z.string().min(3) // Reason for reset (for audit)
})

export async function POST(
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
    const data = resetStreakSchema.parse(body)

    // Get the streak
    const streak = await prisma.streak.findUnique({
      where: { id: streakId },
      include: { user: { select: { id: true, fullName: true, email: true } } }
    })

    if (!streak) {
      return NextResponse.json({ success: false, error: 'Streak not found' }, { status: 404 })
    }

    // Store old values for audit
    const oldValues = {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate
    }

    // Reset the streak
    const updatedStreak = await prisma.streak.update({
      where: { id: streakId },
      data: {
        currentStreak: 0,
        lastActivityDate: null
        // Keep longestStreak as is for historical record
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'STREAK_RESET',
        entityType: 'Streak',
        entityId: streakId,
        oldValue: JSON.stringify(oldValues),
        newValue: JSON.stringify({
          currentStreak: 0,
          longestStreak: updatedStreak.longestStreak,
          lastActivityDate: null,
          reason: data.reason
        })
      }
    })

    return NextResponse.json({
      success: true,
      streak: updatedStreak,
      message: 'تم إعادة تعيين المسار بنجاح'
    })
  } catch (error) {
    console.error('Admin streak reset error:', error)
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
