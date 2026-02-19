/**
 * Admin Leaderboard Student Visibility API Route
 * 
 * PATCH: Toggle student visibility on leaderboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Request body schema
const updateSchema = z.object({
  hideFromLeaderboard: z.boolean().optional(),
  isHidden: z.boolean().optional() // For LeaderboardEntry.isHidden
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

    const { id: studentId } = await params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Check if user exists and is a student
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT'
      },
      include: {
        leaderboardEntry: true
      }
    })

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
    }

    // Update in transaction
    const [updatedUser, updatedEntry] = await prisma.$transaction(async (tx) => {
      // Update User.hideFromLeaderboard if provided
      const userUpdate = validated.hideFromLeaderboard !== undefined
        ? await tx.user.update({
            where: { id: studentId },
            data: { hideFromLeaderboard: validated.hideFromLeaderboard }
          })
        : student

      // Update LeaderboardEntry.isHidden if provided
      let entryUpdate = student.leaderboardEntry
      if (validated.isHidden !== undefined && student.leaderboardEntry) {
        entryUpdate = await tx.leaderboardEntry.update({
          where: { userId: studentId },
          data: { isHidden: validated.isHidden }
        })
      }

      return [userUpdate, entryUpdate]
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_LEADERBOARD_VISIBILITY',
        entityType: 'USER',
        entityId: studentId,
        newValue: JSON.stringify({
          hideFromLeaderboard: updatedUser.hideFromLeaderboard,
          isHidden: updatedEntry?.isHidden
        })
      }
    })

    return NextResponse.json({
      success: true,
      student: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        hideFromLeaderboard: updatedUser.hideFromLeaderboard,
        leaderboard: updatedEntry ? {
          id: updatedEntry.id,
          score: updatedEntry.score,
          isHidden: updatedEntry.isHidden,
          isOptedIn: updatedEntry.isOptedIn
        } : null
      }
    })
  } catch (error) {
    console.error('Error updating leaderboard visibility:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
