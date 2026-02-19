/**
 * Admin Curriculum - Branches API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createBranchSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true)
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const branches = await prisma.branch.findMany({
      include: {
        _count: { select: { subjects: true, users: true } }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ success: true, branches })
  } catch (error) {
    console.error('Get branches error:', error)
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
    const data = createBranchSchema.parse(body)

    const branch = await prisma.branch.create({ data })

    return NextResponse.json({ success: true, branch })
  } catch (error) {
    console.error('Create branch error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
