/**
 * Leaderboard API Route
 * 
 * Returns ranked list of users with their stats
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string | null
  score: number
  studyMinutes: number
  tasksCompleted: number
  focusSessions: number
  isCurrentUser: boolean
}

interface LeaderboardResponse {
  success: boolean
  entries: LeaderboardEntry[]
  currentUserRank: number | null
  currentUserEntry: LeaderboardEntry | null
  total: number
  hasMore: boolean
}

// Time period filter helper
function getDateFilter(period: string): Date | null {
  const now = new Date()
  
  switch (period) {
    case 'week': {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)
      return weekAgo
    }
    case 'month': {
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      monthAgo.setHours(0, 0, 0, 0)
      return monthAgo
    }
    case 'all':
    default:
      return null
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const period = searchParams.get('period') || 'all'

    const dateFilter = getDateFilter(period)

    // Get all opted-in users' leaderboard entries with user data
    // Filter by isOptedIn=true, isHidden=false, AND user.hideFromLeaderboard=false
    const leaderboardEntries = await prisma.leaderboardEntry.findMany({
      where: {
        isOptedIn: true,
        isHidden: false,
        user: {
          hideFromLeaderboard: false
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    // If we have a time period filter, we need to calculate scores dynamically
    let entries: LeaderboardEntry[] = []
    
    if (dateFilter) {
      // For time-filtered queries, we calculate scores from actual activities
      const [focusSessions, completedTasks] = await Promise.all([
        prisma.focusSession.findMany({
          where: {
            startedAt: { gte: dateFilter },
            wasCompleted: true
          },
          select: {
            userId: true,
            actualDuration: true,
            duration: true
          }
        }),
        prisma.task.findMany({
          where: {
            completedAt: { gte: dateFilter },
            status: 'COMPLETED'
          },
          select: {
            userId: true
          }
        })
      ])

      // Calculate scores per user
      const userScores = new Map<string, {
        studyMinutes: number
        tasksCompleted: number
        focusSessions: number
        score: number
      }>()

      // Process focus sessions
      for (const session of focusSessions) {
        const existing = userScores.get(session.userId) || {
          studyMinutes: 0,
          tasksCompleted: 0,
          focusSessions: 0,
          score: 0
        }
        const minutes = Math.floor((session.actualDuration || session.duration) / 60)
        existing.studyMinutes += minutes
        existing.focusSessions += 1
        existing.score += minutes + 5 // 1 point per minute + 5 per session
        userScores.set(session.userId, existing)
      }

      // Process completed tasks
      for (const task of completedTasks) {
        const existing = userScores.get(task.userId) || {
          studyMinutes: 0,
          tasksCompleted: 0,
          focusSessions: 0,
          score: 0
        }
        existing.tasksCompleted += 1
        existing.score += 10 // 10 points per task
        userScores.set(task.userId, existing)
      }

      // Filter to only opted-in users and create entries
      const optedInUserIds = new Set(leaderboardEntries.map(e => e.userId))
      
      entries = Array.from(userScores.entries())
        .filter(([userId]) => optedInUserIds.has(userId))
        .map(([userId, stats], index) => {
          const entry = leaderboardEntries.find(e => e.userId === userId)
          return {
            rank: index + 1,
            userId,
            name: entry?.user?.fullName || null,
            score: stats.score,
            studyMinutes: stats.studyMinutes,
            tasksCompleted: stats.tasksCompleted,
            focusSessions: stats.focusSessions,
            isCurrentUser: userId === user.id
          }
        })
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))

    } else {
      // All-time leaderboard from stored scores
      entries = leaderboardEntries.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        name: entry.user.fullName,
        score: entry.score,
        studyMinutes: entry.studyMinutes,
        tasksCompleted: entry.tasksCompleted,
        focusSessions: entry.focusSessions,
        isCurrentUser: entry.userId === user.id
      }))
    }

    // Find current user's rank
    let currentUserRank: number | null = null
    let currentUserEntry: LeaderboardEntry | null = null
    
    const userIndex = entries.findIndex(e => e.userId === user.id)
    if (userIndex !== -1) {
      currentUserRank = userIndex + 1
      currentUserEntry = entries[userIndex]
    }

    // Apply pagination
    const paginatedEntries = entries.slice(offset, offset + limit)
    const total = entries.length
    const hasMore = offset + limit < total

    const response: LeaderboardResponse = {
      success: true,
      entries: paginatedEntries,
      currentUserRank,
      currentUserEntry,
      total,
      hasMore
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
