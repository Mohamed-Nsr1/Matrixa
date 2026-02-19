/**
 * Admin Curriculum - Subjects API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createSubjectSchema = z.object({
  branchId: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().default(0),
  xpPerLesson: z.number().default(10),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    const where: any = {}
    if (branchId) where.branchId = branchId

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        branch: { select: { nameAr: true, nameEn: true } },
        _count: { select: { units: true } }
      },
      orderBy: [{ branchId: 'asc' }, { order: 'asc' }]
    })

    return NextResponse.json({ success: true, subjects })
  } catch (error) {
    console.error('Get subjects error:', error)
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
    const data = createSubjectSchema.parse(body)

    const subject = await prisma.subject.create({
      data,
      include: { branch: true }
    })

    return NextResponse.json({ success: true, subject })
  } catch (error) {
    console.error('Create subject error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
