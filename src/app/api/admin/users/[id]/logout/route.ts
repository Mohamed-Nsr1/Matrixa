/**
 * Admin Force Logout API Route
 * 
 * POST: Delete all sessions for a user (force logout)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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

    // Prevent logging out yourself
    if (id === user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot force logout your own account' 
      }, { status: 400 })
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Delete all sessions for this user
    const result = await prisma.session.deleteMany({
      where: { userId: id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FORCE_LOGOUT',
        entityType: 'User',
        entityId: id,
        newValue: JSON.stringify({ sessionsDeleted: result.count })
      }
    })

    return NextResponse.json({
      success: true,
      sessionsDeleted: result.count
    })
  } catch (error) {
    console.error('Admin force logout error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
