/**
 * Admin Analytics API Route
 * 
 * GET - Get comprehensive analytics data for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30' // days, '7', '30', or 'all'

    // Calculate date range
    let since = new Date()
    if (range !== 'all') {
      const days = parseInt(range)
      since.setDate(since.getDate() - days)
    } else {
      since = new Date('2020-01-01') // Far back enough for all data
    }

    // Fetch all analytics data in parallel
    const [
      dailyRegistrations,
      activeUsersMetrics,
      engagementMetrics,
      subscriptionStats
    ] = await Promise.all([
      getDailyRegistrations(since),
      getActiveUsersMetrics(),
      getEngagementMetrics(since),
      getSubscriptionStats()
    ])

    return NextResponse.json({
      success: true,
      analytics: {
        dailyRegistrations,
        activeUsersMetrics,
        engagementMetrics,
        subscriptionStats
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Get daily user registrations
async function getDailyRegistrations(since: Date) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: since },
      role: 'STUDENT'
    },
    select: {
      createdAt: true
    }
  })

  // Group by day
  const byDay: Record<string, number> = {}
  users.forEach(u => {
    const day = u.createdAt.toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  })

  // Fill missing days with 0
  const result: { date: string; count: number }[] = []
  const current = new Date(since)
  const today = new Date()
  
  while (current <= today) {
    const dayStr = current.toISOString().split('T')[0]
    result.push({
      date: dayStr,
      count: byDay[dayStr] || 0
    })
    current.setDate(current.getDate() + 1)
  }

  return result.slice(-90) // Max 90 days to avoid large payloads
}

// Get DAU/WAU/MAU metrics
async function getActiveUsersMetrics() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [dau, wau, mau, totalStudents, previousWeekDau] = await Promise.all([
    // Daily Active Users (today)
    prisma.user.count({
      where: {
        role: 'STUDENT',
        lastActiveAt: { gte: todayStart }
      }
    }),
    
    // Weekly Active Users (last 7 days)
    prisma.user.count({
      where: {
        role: 'STUDENT',
        lastActiveAt: { gte: weekAgo }
      }
    }),
    
    // Monthly Active Users (last 30 days)
    prisma.user.count({
      where: {
        role: 'STUDENT',
        lastActiveAt: { gte: monthAgo }
      }
    }),
    
    // Total registered students
    prisma.user.count({
      where: { role: 'STUDENT' }
    }),
    
    // DAU from 7 days ago for trend
    prisma.user.count({
      where: {
        role: 'STUDENT',
        lastActiveAt: {
          gte: new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  // Calculate engagement rate (MAU / Total)
  const engagementRate = totalStudents > 0 ? (mau / totalStudents) * 100 : 0
  
  // Calculate DAU trend
  const dauTrend = previousWeekDau > 0 
    ? ((dau - previousWeekDau) / previousWeekDau) * 100 
    : 0

  return {
    dau,
    wau,
    mau,
    totalStudents,
    engagementRate: Math.round(engagementRate * 10) / 10,
    dauTrend: Math.round(dauTrend * 10) / 10
  }
}

// Get engagement metrics
async function getEngagementMetrics(since: Date) {
  // Average study time per session
  const focusSessions = await prisma.focusSession.findMany({
    where: {
      startedAt: { gte: since },
      wasCompleted: true
    },
    select: {
      actualDuration: true
    }
  })

  const totalStudyMinutes = focusSessions.reduce((acc, s) => 
    acc + (s.actualDuration || 0) / 60, 0
  )
  const avgStudyTime = focusSessions.length > 0 
    ? totalStudyMinutes / focusSessions.length 
    : 0

  // Tasks completed
  const tasksCompleted = await prisma.task.count({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: since }
    }
  })

  // Tasks per user
  const activeUserCount = await prisma.user.count({
    where: {
      role: 'STUDENT',
      lastActiveAt: { gte: since }
    }
  })
  
  const avgTasksPerUser = activeUserCount > 0 
    ? tasksCompleted / activeUserCount 
    : 0

  // Focus sessions stats
  const totalSessions = focusSessions.length
  const totalVideosWatched = await prisma.focusSession.aggregate({
    where: { startedAt: { gte: since } },
    _sum: { videosWatched: true }
  })
  const totalQuestionsSolved = await prisma.focusSession.aggregate({
    where: { startedAt: { gte: since } },
    _sum: { questionsSolved: true }
  })
  const totalRevisions = await prisma.focusSession.aggregate({
    where: { startedAt: { gte: since } },
    _sum: { revisionsCompleted: true }
  })

  // Daily engagement trend (last 7 days)
  const dailyEngagement = await getDailyEngagementTrend()

  return {
    avgStudyTimePerSession: Math.round(avgStudyTime),
    totalStudyMinutes: Math.round(totalStudyMinutes),
    totalFocusSessions: totalSessions,
    tasksCompleted,
    avgTasksPerUser: Math.round(avgTasksPerUser * 10) / 10,
    videosWatched: totalVideosWatched._sum.videosWatched || 0,
    questionsSolved: totalQuestionsSolved._sum.questionsSolved || 0,
    revisionsCompleted: totalRevisions._sum.revisionsCompleted || 0,
    dailyEngagement
  }
}

// Get daily engagement trend for chart
async function getDailyEngagementTrend() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const sessions = await prisma.focusSession.findMany({
    where: {
      startedAt: { gte: sevenDaysAgo },
      wasCompleted: true
    },
    select: {
      startedAt: true,
      actualDuration: true
    }
  })

  const tasks = await prisma.task.findMany({
    where: {
      completedAt: { gte: sevenDaysAgo },
      status: 'COMPLETED'
    },
    select: {
      completedAt: true
    }
  })

  // Group by day
  const byDay: Record<string, { minutes: number; tasks: number }> = {}
  
  sessions.forEach(s => {
    const day = s.startedAt.toISOString().split('T')[0]
    if (!byDay[day]) byDay[day] = { minutes: 0, tasks: 0 }
    byDay[day].minutes += (s.actualDuration || 0) / 60
  })

  tasks.forEach(t => {
    if (t.completedAt) {
      const day = t.completedAt.toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { minutes: 0, tasks: 0 }
      byDay[day].tasks++
    }
  })

  // Fill missing days
  const result: { date: string; minutes: number; tasks: number }[] = []
  const current = new Date(sevenDaysAgo)
  const today = new Date()
  
  while (current <= today) {
    const dayStr = current.toISOString().split('T')[0]
    result.push({
      date: dayStr,
      minutes: Math.round(byDay[dayStr]?.minutes || 0),
      tasks: byDay[dayStr]?.tasks || 0
    })
    current.setDate(current.getDate() + 1)
  }

  return result
}

// Get subscription statistics
async function getSubscriptionStats() {
  const [
    totalStudents,
    trialUsers,
    activeSubscriptions,
    expiredSubscriptions,
    cancelledSubscriptions
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.subscription.count({ where: { status: 'TRIAL' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'EXPIRED' } }),
    prisma.subscription.count({ where: { status: 'CANCELLED' } })
  ])

  // Calculate conversion rate: (active / total) * 100
  const conversionRate = totalStudents > 0 
    ? (activeSubscriptions / totalStudents) * 100 
    : 0

  // Trial conversion rate: active / (active + expired + cancelled) that started from trial
  const totalEndedSubscriptions = activeSubscriptions + expiredSubscriptions + cancelledSubscriptions
  const trialConversionRate = totalEndedSubscriptions > 0
    ? (activeSubscriptions / totalEndedSubscriptions) * 100
    : 0

  // Monthly subscription trend
  const monthlyTrend = await getMonthlySubscriptionTrend()

  return {
    totalStudents,
    trialUsers,
    activeSubscriptions,
    expiredSubscriptions,
    cancelledSubscriptions,
    conversionRate: Math.round(conversionRate * 10) / 10,
    trialConversionRate: Math.round(trialConversionRate * 10) / 10,
    monthlyTrend
  }
}

// Get monthly subscription creation trend
async function getMonthlySubscriptionTrend() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const subscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo },
      status: { in: ['ACTIVE', 'EXPIRED', 'CANCELLED'] }
    },
    select: {
      createdAt: true,
      status: true
    }
  })

  // Group by month
  const byMonth: Record<string, { total: number; active: number }> = {}
  
  subscriptions.forEach(s => {
    const monthKey = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[monthKey]) byMonth[monthKey] = { total: 0, active: 0 }
    byMonth[monthKey].total++
    if (s.status === 'ACTIVE') byMonth[monthKey].active++
  })

  return Object.entries(byMonth)
    .map(([month, data]) => ({
      month,
      total: data.total,
      active: data.active
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
