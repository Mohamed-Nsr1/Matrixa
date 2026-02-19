/**
 * Admin Leaderboard API Route
 * 
 * GET: Get all students with leaderboard settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Query params schema
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  search: z.string().optional(),
  visibility: z.enum(['all', 'visible', 'hidden']).default('all'),
  sortBy: z.string().default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))

    // Build where clause for users
    const userWhere: any = {
      role: 'STUDENT'
    }

    if (params.search) {
      userWhere.OR = [
        { email: { contains: params.search } },
        { fullName: { contains: params.search } }
      ]
    }

    if (params.visibility === 'hidden') {
      userWhere.hideFromLeaderboard = true
    } else if (params.visibility === 'visible') {
      userWhere.hideFromLeaderboard = false
    }

    // Get all students with their leaderboard entries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          email: true,
          fullName: true,
          hideFromLeaderboard: true,
          createdAt: true,
          leaderboardEntry: {
            select: {
              id: true,
              score: true,
              rank: true,
              studyMinutes: true,
              tasksCompleted: true,
              focusSessions: true,
              isOptedIn: true,
              isHidden: true,
              updatedAt: true
            }
          },
          _count: {
            select: {
              tasks: { where: { status: 'COMPLETED' } },
              focusSessions: { where: { wasCompleted: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit
      }),
      prisma.user.count({ where: userWhere })
    ])

    // Transform data for response
    const students = users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      hideFromLeaderboard: u.hideFromLeaderboard,
      createdAt: u.createdAt,
      leaderboard: u.leaderboardEntry ? {
        id: u.leaderboardEntry.id,
        score: u.leaderboardEntry.score,
        rank: u.leaderboardEntry.rank,
        studyMinutes: u.leaderboardEntry.studyMinutes,
        tasksCompleted: u.leaderboardEntry.tasksCompleted,
        focusSessions: u.leaderboardEntry.focusSessions,
        isOptedIn: u.leaderboardEntry.isOptedIn,
        isHidden: u.leaderboardEntry.isHidden,
        updatedAt: u.leaderboardEntry.updatedAt
      } : null,
      completedTasks: u._count.tasks,
      completedFocusSessions: u._count.focusSessions
    }))

    // Sort by score (from leaderboard entry) if requested
    if (params.sortBy === 'score') {
      students.sort((a, b) => {
        const scoreA = a.leaderboard?.score || 0
        const scoreB = b.leaderboard?.score || 0
        return params.sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB
      })
    }

    // Get stats summary
    const [totalStudents, visibleStudents, hiddenStudents, leaderboardEnabled] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'STUDENT', hideFromLeaderboard: false } }),
      prisma.user.count({ where: { role: 'STUDENT', hideFromLeaderboard: true } }),
      prisma.systemSettings.findUnique({ where: { key: 'leaderboardEnabled' } })
    ])

    return NextResponse.json({
      success: true,
      students,
      stats: {
        total: totalStudents,
        visible: visibleStudents,
        hidden: hiddenStudents,
        leaderboardEnabled: leaderboardEnabled?.value !== 'false'
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    })
  } catch (error) {
    console.error('Admin leaderboard list error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
