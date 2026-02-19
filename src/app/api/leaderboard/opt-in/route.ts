/**
 * Leaderboard Opt-in API Route
 * 
 * Toggle user's opt-in status for the leaderboard
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { isOptedIn } = body

    if (typeof isOptedIn !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isOptedIn must be a boolean' },
        { status: 400 }
      )
    }

    // Update or create leaderboard entry
    const entry = await prisma.leaderboardEntry.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isOptedIn
      },
      update: {
        isOptedIn
      }
    })

    return NextResponse.json({
      success: true,
      isOptedIn: entry.isOptedIn,
      message: isOptedIn 
        ? 'تم انضمامك للوحة المتصدرين!' 
        : 'تم انسحابك من لوحة المتصدرين'
    })
  } catch (error) {
    console.error('Error updating opt-in status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update opt-in status' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      isOptedIn: entry?.isOptedIn ?? true, // Default to opted in
      hasEntry: !!entry,
      stats: entry ? {
        score: entry.score,
        studyMinutes: entry.studyMinutes,
        tasksCompleted: entry.tasksCompleted,
        focusSessions: entry.focusSessions
      } : null
    })
  } catch (error) {
    console.error('Error fetching opt-in status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch opt-in status' },
      { status: 500 }
    )
  }
}
