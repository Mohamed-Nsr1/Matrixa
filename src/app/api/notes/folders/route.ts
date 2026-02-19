/**
 * Notes Folders API Route
 * 
 * Handles CRUD operations for note folders
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(10).optional(),
  parentId: z.string().optional()
})

// GET - Get all user folders with note counts
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const folders = await prisma.noteFolder.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { notes: true }
        },
        children: {
          include: {
            _count: {
              select: { notes: true }
            }
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    })

    // Build folder tree
    const buildTree = (parentId: string | null = null): any[] => {
      return folders
        .filter(f => f.parentId === parentId)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          color: folder.color,
          icon: folder.icon,
          parentId: folder.parentId,
          order: folder.order,
          noteCount: folder._count.notes,
          children: buildTree(folder.id)
        }))
    }

    // Return root folders with their children
    const folderTree = folders
      .filter(f => !f.parentId)
      .map(folder => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        parentId: folder.parentId,
        order: folder.order,
        noteCount: folder._count.notes,
        children: folders
          .filter(f => f.parentId === folder.id)
          .map(child => ({
            id: child.id,
            name: child.name,
            color: child.color,
            icon: child.icon,
            parentId: child.parentId,
            order: child.order,
            noteCount: child._count.notes,
            children: []
          }))
      }))

    return NextResponse.json({
      success: true,
      folders: folderTree
    })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

// POST - Create a new folder
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
    const validation = createFolderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { name, color, icon, parentId } = validation.data

    // If parentId is provided, verify it exists and belongs to user
    if (parentId) {
      const parentFolder = await prisma.noteFolder.findUnique({
        where: { id: parentId }
      })

      if (!parentFolder || parentFolder.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Parent folder not found' },
          { status: 404 }
        )
      }
    }

    const folder = await prisma.noteFolder.create({
      data: {
        userId: user.id,
        name,
        color: color || '#6366f1',
        icon: icon || '📁',
        parentId: parentId || null
      }
    })

    return NextResponse.json({
      success: true,
      folder
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}

// PUT - Update a folder
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, color, icon, order } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const folder = await prisma.noteFolder.findUnique({
      where: { id }
    })

    if (!folder || folder.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    const updatedFolder = await prisma.noteFolder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(order !== undefined && { order })
      }
    })

    return NextResponse.json({
      success: true,
      folder: updatedFolder
    })
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a folder
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
    const folderId = searchParams.get('id')

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const folder = await prisma.noteFolder.findUnique({
      where: { id: folderId },
      include: {
        children: true,
        notes: true
      }
    })

    if (!folder || folder.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Update notes in this folder to have no folder
    await prisma.note.updateMany({
      where: { folderId },
      data: { folderId: null }
    })

    // Update child folders to have no parent
    if (folder.children.length > 0) {
      await prisma.noteFolder.updateMany({
        where: { parentId: folderId },
        data: { parentId: null }
      })
    }

    // Delete the folder
    await prisma.noteFolder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({
      success: true,
      message: 'Folder deleted'
    })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
