/**
 * Admin Email Logs API
 * GET - List email logs with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        userName: true,
        subject: true,
        status: true,
        sentAt: true,
        error: true,
        createdAt: true
      }
    })

    const total = await prisma.emailLog.count({ where })

    return NextResponse.json({ 
      success: true, 
      logs,
      pagination: {
        total,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Get logs error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
