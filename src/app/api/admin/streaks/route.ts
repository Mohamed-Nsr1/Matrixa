/**
 * Admin Streaks API Route
 * Get all user streaks with filtering options
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
  status: z.enum(['active', 'broken', 'new', 'all']).default('all'),
  sortBy: z.string().default('currentStreak'),
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

    // Get today's date for streak status calculation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // Build where clause for users
    const userWhere: any = {}
    if (params.search) {
      userWhere.OR = [
        { email: { contains: params.search } },
        { fullName: { contains: params.search } }
      ]
    }
    userWhere.role = 'STUDENT' // Only show students

    // Get all users with their streaks
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        email: true,
        fullName: true,
        branch: { select: { nameAr: true } },
        streaks: {
          select: {
            id: true,
            currentStreak: true,
            longestStreak: true,
            lastActivityDate: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Process and filter by streak status
    let streakUsers = users.map(u => {
      const streak = u.streaks[0]
      const lastActivity = streak?.lastActivityDate ? new Date(streak.lastActivityDate) : null
      
      // Determine streak status
      let streakStatus: 'active' | 'broken' | 'new'
      if (!streak || !lastActivity) {
        streakStatus = 'new'
      } else {
        const lastActivityDay = new Date(lastActivity)
        lastActivityDay.setHours(0, 0, 0, 0)
        
        if (lastActivityDay.getTime() >= yesterday.getTime()) {
          streakStatus = 'active'
        } else {
          streakStatus = 'broken'
        }
      }

      return {
        userId: u.id,
        userName: u.fullName || u.email,
        userEmail: u.email,
        branchName: u.branch?.nameAr || null,
        streakId: streak?.id || null,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        lastActivityDate: streak?.lastActivityDate || null,
        streakStatus,
        updatedAt: streak?.updatedAt || null
      }
    })

    // Filter by status
    if (params.status !== 'all') {
      streakUsers = streakUsers.filter(u => u.streakStatus === params.status)
    }

    // Sort
    streakUsers.sort((a, b) => {
      let comparison = 0
      if (params.sortBy === 'currentStreak') {
        comparison = a.currentStreak - b.currentStreak
      } else if (params.sortBy === 'longestStreak') {
        comparison = a.longestStreak - b.longestStreak
      } else if (params.sortBy === 'userName') {
        comparison = a.userName.localeCompare(b.userName, 'ar')
      } else if (params.sortBy === 'lastActivityDate') {
        const dateA = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : 0
        const dateB = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : 0
        comparison = dateA - dateB
      }
      return params.sortOrder === 'desc' ? -comparison : comparison
    })

    // Paginate
    const total = streakUsers.length
    const totalPages = Math.ceil(total / params.limit)
    const paginatedUsers = streakUsers.slice(
      (params.page - 1) * params.limit,
      params.page * params.limit
    )

    // Calculate stats
    const stats = {
      total: streakUsers.length,
      active: streakUsers.filter(u => u.streakStatus === 'active').length,
      broken: streakUsers.filter(u => u.streakStatus === 'broken').length,
      new: streakUsers.filter(u => u.streakStatus === 'new').length,
      averageStreak: streakUsers.length > 0 
        ? Math.round(streakUsers.reduce((sum, u) => sum + u.currentStreak, 0) / streakUsers.length)
        : 0
    }

    return NextResponse.json({
      success: true,
      streaks: paginatedUsers,
      stats,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Admin streaks list error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
