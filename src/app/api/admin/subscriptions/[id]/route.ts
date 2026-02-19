/**
 * Admin Subscription by ID - Update status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED']).optional(),
  endDate: z.string().nullable().optional()
})

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

    // Check if subscription exists first
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: { select: { email: true, fullName: true } } }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'الاشتراك غير موجود' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (data.status) updateData.status = data.status
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: { user: { select: { email: true, fullName: true } } }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
