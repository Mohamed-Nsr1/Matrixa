/**
 * Single Note API Route
 *
 * Handles operations on a single note
 * Includes HTML sanitization to prevent XSS attacks
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeHtml } from '@/lib/sanitize'
import { z } from 'zod'

const updateNoteSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).max(50000).optional(), // Increased for rich text HTML content
  subjectId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isPinned: z.boolean().optional()
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const note = await prisma.note.findFirst({
      where: { id, userId: user.id },
      include: {
        subject: {
          select: { id: true, nameAr: true, nameEn: true, color: true }
        },
        lesson: {
          select: { id: true, nameAr: true, nameEn: true }
        }
      }
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      note
    })
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch note' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify note belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingNote) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = updateNoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Prepare update data
    const updateData: {
      title?: string | null
      content?: string
      subjectId?: string | null
      lessonId?: string | null
      color?: string | null
      isPinned?: boolean
    } = {}

    if (data.title !== undefined) {
      updateData.title = data.title
    }

    if (data.content !== undefined) {
      // Sanitize HTML content to prevent XSS attacks
      updateData.content = sanitizeHtml(data.content)
    }

    if (data.isPinned !== undefined) {
      updateData.isPinned = data.isPinned
    }

    if (data.color !== undefined) {
      updateData.color = data.color
    }

    // Handle subject/lesson linking
    if (data.subjectId !== undefined) {
      updateData.subjectId = data.subjectId
    }

    if (data.lessonId !== undefined) {
      updateData.lessonId = data.lessonId

      // If lesson is set but subject is not provided, get subject from lesson
      if (data.lessonId && data.subjectId === undefined) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: data.lessonId },
          include: {
            unit: {
              select: { subjectId: true }
            }
          }
        })
        if (lesson) {
          updateData.subjectId = lesson.unit.subjectId
        }
      }
    }

    // If subjectId is set to null, also clear lessonId
    if (data.subjectId === null) {
      updateData.lessonId = null
    }

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify note belongs to user
    const note = await prisma.note.findFirst({
      where: { id, userId: user.id }
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    await prisma.note.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}
