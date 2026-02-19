/**
 * Change Password API
 * 
 * Allows users to change their password from settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    })

    // Delete all other sessions (optional security measure)
    // This logs the user out from other devices
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        // Keep current session - but we don't have session ID here
        // So we delete all and user needs to re-login
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        entityType: 'User',
        entityId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
