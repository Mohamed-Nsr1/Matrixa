/**
 * Notes API Route
 *
 * Handles CRUD operations for notes
 * Includes HTML sanitization to prevent XSS attacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeHtml } from '@/lib/sanitize'
import { z } from 'zod'

const createNoteSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).max(50000), // Increased for rich text HTML content
  subjectId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isPinned: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const lessonId = searchParams.get('lessonId')
    const search = searchParams.get('search')

    // Build where clause
    const where: {
      userId: string
      subjectId?: string | null
      lessonId?: string | null
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' }
        content?: { contains: string; mode: 'insensitive' }
      }>
    } = { userId: user.id }

    if (subjectId) {
      where.subjectId = subjectId
    }

    if (lessonId) {
      where.lessonId = lessonId
    }

    // Add search functionality
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        subject: {
          select: { id: true, nameAr: true, nameEn: true, color: true }
        },
        lesson: {
          select: { id: true, nameAr: true, nameEn: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      notes
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createNoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Sanitize HTML content to prevent XSS attacks
    const sanitizedContent = sanitizeHtml(data.content)

    // If lessonId is provided, verify it exists and get its subject
    let subjectIdToUse = data.subjectId
    if (data.lessonId && !data.subjectId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId },
        include: {
          unit: {
            select: { subjectId: true }
          }
        }
      })
      if (lesson) {
        subjectIdToUse = lesson.unit.subjectId
      }
    }

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: data.title || null,
        content: sanitizedContent,
        subjectId: subjectIdToUse,
        lessonId: data.lessonId,
        color: data.color || null,
        isPinned: data.isPinned || false
      },
      include: {
        subject: {
          select: { id: true, nameAr: true, nameEn: true, color: true }
        },
        lesson: {
          select: { id: true, nameAr: true, nameEn: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      note
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
