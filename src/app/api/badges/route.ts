/**
 * Badges API Route
 *
 * GET - Get all badges with user's progress
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    // Get all active badges
    const badges = await prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'asc' }, { order: 'asc' }],
      include: {
        userBadges: user ? {
          where: { userId: user.id },
          select: {
            earnedAt: true,
            progress: true,
            isCompleted: true
          }
        } : false
      }
    })

    // Transform badges to include earned status
    const badgesWithStatus = badges.map(badge => {
      const userBadge = badge.userBadges?.[0]
      return {
        id: badge.id,
        nameAr: badge.nameAr,
        nameEn: badge.nameEn,
        descriptionAr: badge.descriptionAr,
        descriptionEn: badge.descriptionEn,
        icon: badge.icon,
        color: badge.color,
        type: badge.type,
        requirement: badge.requirement,
        rarity: badge.rarity,
        xpReward: badge.xpReward,
        earned: userBadge?.isCompleted ?? false,
        earnedAt: userBadge?.earnedAt ?? null,
        progress: userBadge?.progress ?? 0
      }
    })

    // Get user stats for progress calculation
    let userStats: {
      currentStreak: number;
      longestStreak: number;
      focusSessions: number;
      tasksCompleted: number;
      score: number;
    } | null = null
    if (user) {
      const streak = await prisma.streak.findUnique({
        where: { userId: user.id }
      })

      const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
        where: { userId: user.id }
      })

      const focusSessionsCount = await prisma.focusSession.count({
        where: { userId: user.id, wasCompleted: true }
      })

      const tasksCompleted = await prisma.task.count({
        where: { userId: user.id, status: 'COMPLETED' }
      })

      userStats = {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        focusSessions: focusSessionsCount,
        tasksCompleted: tasksCompleted,
        score: leaderboardEntry?.score ?? 0
      }

      // Update badge progress based on stats
      for (const badge of badgesWithStatus) {
        if (!badge.earned) {
          switch (badge.type) {
            case 'STREAK':
              badge.progress = Math.min(userStats.currentStreak, badge.requirement)
              break
            case 'TASKS':
              badge.progress = Math.min(userStats.tasksCompleted, badge.requirement)
              break
            case 'FOCUS':
              badge.progress = Math.min(userStats.focusSessions, badge.requirement)
              break
          }
        }
      }
    }

    // Group badges by type
    const groupedBadges = {
      STREAK: badgesWithStatus.filter(b => b.type === 'STREAK'),
      TASKS: badgesWithStatus.filter(b => b.type === 'TASKS'),
      FOCUS: badgesWithStatus.filter(b => b.type === 'FOCUS'),
      SUBJECTS: badgesWithStatus.filter(b => b.type === 'SUBJECTS'),
      SPECIAL: badgesWithStatus.filter(b => b.type === 'SPECIAL')
    }

    // Calculate summary
    const earnedCount = badgesWithStatus.filter(b => b.earned).length
    const totalCount = badgesWithStatus.length

    return NextResponse.json({
      success: true,
      badges: badgesWithStatus,
      groupedBadges,
      summary: {
        earned: earnedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0
      },
      userStats
    })
  } catch (error) {
    console.error('Get badges error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
