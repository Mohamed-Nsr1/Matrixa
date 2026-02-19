/**
 * Admin Stats API Route
 * 
 * Returns system statistics for admin dashboard
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get various stats in parallel
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      trialUsers,
      newUsersToday,
      expiredSubscriptions
    ] = await Promise.all([
      // Total users (students only)
      prisma.user.count({
        where: { role: 'STUDENT' }
      }),
      
      // Active users (last 24 hours)
      prisma.user.count({
        where: {
          role: 'STUDENT',
          lastActiveAt: { gte: last24Hours }
        }
      }),
      
      // Total subscriptions
      prisma.subscription.count(),
      
      // Active subscriptions (ACTIVE status)
      prisma.subscription.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Trial users
      prisma.subscription.count({
        where: {
          status: 'TRIAL',
          trialEnd: { gte: now }
        }
      }),
      
      // New users today
      prisma.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: todayStart }
        }
      }),
      
      // Expired subscriptions
      prisma.subscription.count({
        where: { status: 'EXPIRED' }
      })
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalSubscriptions,
        activeSubscriptions,
        trialUsers,
        newUsersToday,
        expiredSubscriptions,
        revenue: 0 // Would calculate from actual payments
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
