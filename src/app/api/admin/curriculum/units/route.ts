/**
 * Admin Curriculum - Units API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createUnitSchema = z.object({
  subjectId: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const where: any = {}
    if (subjectId) where.subjectId = subjectId

    const units = await prisma.unit.findMany({
      where,
      include: {
        subject: { select: { nameAr: true, nameEn: true, branch: { select: { nameAr: true } } } },
        _count: { select: { lessons: true } }
      },
      orderBy: [{ subjectId: 'asc' }, { order: 'asc' }]
    })

    return NextResponse.json({ success: true, units })
  } catch (error) {
    console.error('Get units error:', error)
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
    const data = createUnitSchema.parse(body)

    const unit = await prisma.unit.create({
      data,
      include: { subject: true }
    })

    return NextResponse.json({ success: true, unit })
  } catch (error) {
    console.error('Create unit error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
