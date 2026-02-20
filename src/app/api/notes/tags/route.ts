/**
 * Notes Tags API Route
 * 
 * Handles CRUD operations for note tags
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
})

// GET - Get all user tags with note counts
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tags = await prisma.noteTag.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { notes: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        noteCount: tag._count.notes
      }))
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createTagSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { name, color } = validation.data

    // Check if tag already exists for this user
    const existingTag = await prisma.noteTag.findFirst({
      where: { 
        userId: user.id,
        name: { equals: name }
      }
    })

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag already exists' },
        { status: 400 }
      )
    }

    const tag = await prisma.noteTag.create({
      data: {
        userId: user.id,
        name,
        color: color || '#8b5cf6'
      }
    })

    return NextResponse.json({
      success: true,
      tag
    })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')

    if (!tagId) {
      return NextResponse.json(
        { success: false, error: 'Tag ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const tag = await prisma.noteTag.findUnique({
      where: { id: tagId }
    })

    if (!tag || tag.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Delete tag and its relations
    await prisma.$transaction([
      prisma.noteTagRelation.deleteMany({ where: { tagId } }),
      prisma.noteTag.delete({ where: { id: tagId } })
    ])

    return NextResponse.json({
      success: true,
      message: 'Tag deleted'
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
