/**
 * Admin Announcements API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().optional(),
  content: z.string().min(1),
  contentEn: z.string().optional(),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'MAINTENANCE', 'FEATURE']).default('INFO'),
  priority: z.number().default(0),
  targetAll: z.boolean().default(true),
  targetBranches: z.array(z.string()).optional(),
  showBanner: z.boolean().default(true),
  isDismissible: z.boolean().default(true),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const where = activeOnly ? { isActive: true } : {}

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, announcements })
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        titleEn: data.titleEn,
        content: data.content,
        contentEn: data.contentEn,
        type: data.type,
        priority: data.priority,
        targetAll: data.targetAll,
        targetBranches: data.targetBranches ? JSON.stringify(data.targetBranches) : null,
        showBanner: data.showBanner,
        isDismissible: data.isDismissible,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        isActive: data.isActive
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_ANNOUNCEMENT',
        entityType: 'Announcement',
        entityId: announcement.id,
        newValue: JSON.stringify(announcement)
      }
    })

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
