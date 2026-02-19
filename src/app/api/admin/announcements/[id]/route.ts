/**
 * Admin Announcement by ID API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  titleEn: z.string().optional(),
  content: z.string().min(1).optional(),
  contentEn: z.string().optional(),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'MAINTENANCE', 'FEATURE']).optional(),
  priority: z.number().optional(),
  targetAll: z.boolean().optional(),
  targetBranches: z.array(z.string()).optional(),
  showBanner: z.boolean().optional(),
  isDismissible: z.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional().nullable(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('Get announcement error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.targetBranches) {
      updateData.targetBranches = JSON.stringify(data.targetBranches)
    }
    if (data.startsAt) {
      updateData.startsAt = new Date(data.startsAt)
    }
    if (data.endsAt !== undefined) {
      updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('Update announcement error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await prisma.announcement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
