/**
 * Admin User Ban API Route
 * 
 * POST: Ban a user
 * DELETE: Unban a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const banSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Prevent banning yourself
    if (id === user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot ban your own account' 
      }, { status: 400 })
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Check if user is an admin
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot ban admin users' 
      }, { status: 400 })
    }

    // Parse ban reason
    const body = await request.json()
    const validation = banSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error.issues[0]?.message 
      }, { status: 400 })
    }

    const { reason } = validation.data

    // Update user ban status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true
      }
    })

    // Delete all sessions for this user (force logout)
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_BANNED',
        entityType: 'User',
        entityId: id,
        newValue: JSON.stringify({
          reason,
          sessionsDeleted: deletedSessions.count
        })
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      sessionsDeleted: deletedSessions.count
    })
  } catch (error) {
    console.error('Admin ban user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Update user - unban
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedReason: null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isBanned: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_UNBANNED',
        entityType: 'User',
        entityId: id
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Admin unban user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
