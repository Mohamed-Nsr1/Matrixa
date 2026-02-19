/**
 * Current User API Route
 * 
 * Returns the currently authenticated user's data
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get additional user data
    const [subscription, streak, leaderboardEntry] = await Promise.all([
      prisma.subscription.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.streak.findUnique({
        where: { userId: user.id }
      }),
      prisma.leaderboardEntry.findUnique({
        where: { userId: user.id }
      })
    ])

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      subscription,
      streak,
      leaderboardEntry
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
