/**
 * Admin Leaderboard Reset API Route
 * 
 * POST: Reset all leaderboard scores
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Request body schema
const resetSchema = z.object({
  confirm: z.boolean().refine(val => val === true, {
    message: 'Confirmation required'
  })
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = resetSchema.parse(body)

    if (!validated.confirm) {
      return NextResponse.json({ success: false, error: 'Confirmation required' }, { status: 400 })
    }

    // Reset all leaderboard entries in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current state for audit log
      const currentEntries = await tx.leaderboardEntry.findMany({
        select: {
          id: true,
          userId: true,
          score: true,
          studyMinutes: true,
          tasksCompleted: true,
          focusSessions: true
        }
      })

      // Reset all entries
      const updateResult = await tx.leaderboardEntry.updateMany({
        data: {
          score: 0,
          rank: null,
          studyMinutes: 0,
          tasksCompleted: 0,
          focusSessions: 0
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'RESET_LEADERBOARD',
          entityType: 'LEADERBOARD',
          oldValue: JSON.stringify({
            entriesCount: currentEntries.length,
            totalScore: currentEntries.reduce((sum, e) => sum + e.score, 0)
          }),
          newValue: JSON.stringify({
            resetCount: updateResult.count
          })
        }
      })

      return {
        count: updateResult.count,
        previousTotal: currentEntries.reduce((sum, e) => sum + e.score, 0)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Leaderboard scores reset successfully',
      stats: {
        entriesReset: result.count,
        previousTotalScore: result.previousTotal
      }
    })
  } catch (error) {
    console.error('Error resetting leaderboard:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
