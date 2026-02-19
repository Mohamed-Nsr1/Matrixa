/**
 * Admin Reset Password API Route
 * 
 * POST: Reset a user's password
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  forceLogout: z.boolean().optional().default(true)
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

    // Prevent resetting your own password through this route
    if (id === user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot reset your own password through admin panel' 
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

    // Parse request body
    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error.issues[0]?.message 
      }, { status: 400 })
    }

    const { newPassword, forceLogout } = validation.data

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    })

    // Optionally delete all sessions (force logout)
    let sessionsDeleted = 0
    if (forceLogout) {
      const result = await prisma.session.deleteMany({
        where: { userId: id }
      })
      sessionsDeleted = result.count
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        entityType: 'User',
        entityId: id,
        newValue: JSON.stringify({ 
          forceLogout,
          sessionsDeleted 
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      sessionsDeleted
    })
  } catch (error) {
    console.error('Admin reset password error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one of each type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // lowercase
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // uppercase
  password += '0123456789'[Math.floor(Math.random() * 10)] // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // special
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
