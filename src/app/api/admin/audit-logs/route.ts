/**
 * Audit Logs API Route
 * 
 * Returns audit logs for admin review
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

    const logs = await prisma.auditLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    })

    // Get unique user IDs and fetch user data
    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as string[]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, fullName: true, role: true }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // Attach user data to logs
    const logsWithUsers = logs.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) || null : null
    }))

    return NextResponse.json({
      success: true,
      logs: logsWithUsers
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
