/**
 * Admin Invite Codes API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createInviteSchema = z.object({
  code: z.string().min(4),
  maxUses: z.number().default(1),
  expiresAt: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const invites = await prisma.inviteCode.findMany({
      include: {
        createdBy: { select: { email: true, fullName: true } },
        usedBy: { select: { email: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, invites })
  } catch (error) {
    console.error('Get invites error:', error)
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
    const data = createInviteSchema.parse(body)

    // Check if code exists
    const existing = await prisma.inviteCode.findUnique({
      where: { code: data.code }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Code already exists' }, { status: 400 })
    }

    const invite = await prisma.inviteCode.create({
      data: {
        code: data.code.toUpperCase(),
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdById: user.id
      }
    })

    return NextResponse.json({ success: true, invite })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
