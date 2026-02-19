/**
 * Student Announcements API
 * 
 * Returns active announcements for the logged-in student
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Fetch active announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } }
            ]
          },
          {
            OR: [
              { targetAll: true },
              user.branchId ? {
                targetBranches: { contains: user.branchId }
              } : {}
            ]
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5 // Limit to 5 active announcements
    })

    return NextResponse.json({ success: true, announcements })
  } catch (error) {
    console.error('Get student announcements error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
