/**
 * Notes API Route
 *
 * Handles CRUD operations for notes
 * Includes HTML sanitization to prevent XSS attacks
 * Supports tags, folders, favorites, and archives
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeHtml } from '@/lib/sanitize'
import { z } from 'zod'

const createNoteSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).max(50000),
  subjectId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  tags: z.array(z.string()).optional() // Array of tag names
})

/**
 * Calculate word count and reading time from content
 */
function calculateStats(content: string): { wordCount: number; readingTime: number } {
  // Strip HTML tags for counting
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = text.split(' ').filter(w => w.length > 0).length
  const readingTime = Math.max(1, Math.ceil(words / 200)) // 200 words per minute
  return { wordCount: words, readingTime }
}

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
    const folderId = searchParams.get('folderId')
    const tagId = searchParams.get('tagId')
    const search = searchParams.get('search')
    const favorites = searchParams.get('favorites') === 'true'
    const archived = searchParams.get('archived') === 'true'

    // Build where clause
    const where: {
      userId: string
      subjectId?: string | null
      lessonId?: string | null
      folderId?: string | null
      isFavorite?: boolean
      isArchived?: boolean
      tags?: { some: { tagId: string } }
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' }
        content?: { contains: string; mode: 'insensitive' }
      }>
    } = { 
      userId: user.id,
      isArchived: archived // Only show archived if explicitly requested
    }

    if (subjectId) {
      where.subjectId = subjectId
    }

    if (lessonId) {
      where.lessonId = lessonId
    }

    if (folderId) {
      where.folderId = folderId === 'none' ? null : folderId
    }

    if (tagId) {
      where.tags = { some: { tagId } }
    }

    if (favorites) {
      where.isFavorite = true
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
        },
        folder: {
          select: { id: true, name: true, color: true, icon: true }
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true }
            }
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { isFavorite: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    // Transform notes to include tags in a cleaner format
    const transformedNotes = notes.map(note => ({
      ...note,
      tags: note.tags.map(t => t.tag)
    }))

    return NextResponse.json({
      success: true,
      notes: transformedNotes
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
    
    // Calculate word count and reading time
    const { wordCount, readingTime } = calculateStats(sanitizedContent)

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

    // Process tags
    const tagOperations = []
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        // Find or create tag
        let tag = await prisma.noteTag.findFirst({
          where: {
            userId: user.id,
            name: { equals: tagName, mode: 'insensitive' }
          }
        })

        if (!tag) {
          tag = await prisma.noteTag.create({
            data: {
              userId: user.id,
              name: tagName
            }
          })
        }

        tagOperations.push({
          tag: { connect: { id: tag.id } }
        })
      }
    }

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: data.title || null,
        content: sanitizedContent,
        subjectId: subjectIdToUse,
        lessonId: data.lessonId,
        folderId: data.folderId,
        color: data.color || null,
        isPinned: data.isPinned || false,
        isFavorite: data.isFavorite || false,
        isArchived: data.isArchived || false,
        wordCount,
        readingTime,
        tags: {
          create: tagOperations.map(op => ({
            tag: op.tag
          }))
        }
      },
      include: {
        subject: {
          select: { id: true, nameAr: true, nameEn: true, color: true }
        },
        lesson: {
          select: { id: true, nameAr: true, nameEn: true }
        },
        folder: {
          select: { id: true, name: true, color: true, icon: true }
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true }
            }
          }
        }
      }
    })

    // Transform tags
    const transformedNote = {
      ...note,
      tags: note.tags.map(t => t.tag)
    }

    return NextResponse.json({
      success: true,
      note: transformedNote
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
