/**
 * User Avatar Upload API
 * 
 * Handles profile picture upload using base64 data URLs
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      avatarUrl: user.avatarUrl
    })
  } catch (error) {
    console.error('Get avatar error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size: 2MB'
      }, { status: 400 })
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update user avatar
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: dataUrl }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_AVATAR',
        entityType: 'User',
        entityId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Remove avatar
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_AVATAR',
        entityType: 'User',
        entityId: user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete avatar error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
