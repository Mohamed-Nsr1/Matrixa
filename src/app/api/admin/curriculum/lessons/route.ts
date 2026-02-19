/**
 * Admin Curriculum - Lessons API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createLessonSchema = z.object({
  unitId: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional(),
  order: z.number().default(0),
  duration: z.number().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')

    const where: any = {}
    if (unitId) where.unitId = unitId

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        unit: {
          select: {
            nameAr: true,
            nameEn: true,
            subject: { select: { nameAr: true, branch: { select: { nameAr: true } } } }
          }
        },
        _count: { select: { lessonProgress: true, tasks: true } }
      },
      orderBy: [{ unitId: 'asc' }, { order: 'asc' }]
    })

    return NextResponse.json({ success: true, lessons })
  } catch (error) {
    console.error('Get lessons error:', error)
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
    const data = createLessonSchema.parse(body)

    const lesson = await prisma.lesson.create({
      data,
      include: { unit: true }
    })

    return NextResponse.json({ success: true, lesson })
  } catch (error) {
    console.error('Create lesson error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
