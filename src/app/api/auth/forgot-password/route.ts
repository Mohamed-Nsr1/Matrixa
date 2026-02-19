/**
 * Forgot Password API Route
 * 
 * Handles password reset requests with secure database-stored tokens.
 * SECURITY: Tokens are stored in database with expiration and one-time use.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'الرمز مطلوب'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
})

// Token expiration time: 1 hour
const TOKEN_EXPIRY_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Check if it's a reset request or a forgot password request
    if ('token' in body && 'password' in body) {
      // Reset password with token
      const validation = resetPasswordSchema.safeParse(body)
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.issues[0]?.message },
          { status: 400 }
        )
      }

      const { token, password } = validation.data
      
      // Find token in database
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token }
      })

      // Check if token exists and is valid
      if (!resetToken) {
        return NextResponse.json(
          { success: false, error: 'الرمز غير صالح أو منتهي الصلاحية' },
          { status: 400 }
        )
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        // Delete expired token
        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
        return NextResponse.json(
          { success: false, error: 'الرمز منتهي الصلاحية' },
          { status: 400 }
        )
      }

      // Check if token was already used
      if (resetToken.usedAt) {
        return NextResponse.json(
          { success: false, error: 'الرمز مستخدم بالفعل' },
          { status: 400 }
        )
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12)

      // Update user password and mark token as used in a transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { email: resetToken.email },
          data: { passwordHash }
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() }
        }),
        // Delete all sessions (force re-login)
        prisma.session.deleteMany({
          where: { user: { email: resetToken.email } }
        })
      ])

      // Clean up expired tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: {
          email: resetToken.email,
          expiresAt: { lt: new Date() }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      })
    } else {
      // Forgot password - generate reset token
      const validation = forgotPasswordSchema.safeParse(body)
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.issues[0]?.message },
          { status: 400 }
        )
      }

      const { email } = validation.data

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email }
      })

      // Always return success to prevent email enumeration
      if (!user) {
        return NextResponse.json({
          success: true,
          message: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور'
        })
      }

      // Generate secure reset token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)
      
      // Delete any existing tokens for this email (one active token per email)
      await prisma.passwordResetToken.deleteMany({
        where: { email }
      })
      
      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt
        }
      })

      // In production, send email with reset link
      // For now, log the token (ONLY for development testing - remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV ONLY] Password reset token for ${email}: ${token}`)
        console.log(`[DEV ONLY] Reset URL: /auth/forgot-password?token=${token}`)
      }

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(email, token)

      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور'
      })
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة طلبك' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  // Verify if a token is valid
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'الرمز مطلوب' },
      { status: 400 }
    )
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  })

  if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
    return NextResponse.json({
      success: false,
      valid: false,
      error: 'الرمز غير صالح أو منتهي الصلاحية'
    })
  }

  return NextResponse.json({
    success: true,
    valid: true,
    email: resetToken.email
  })
}
