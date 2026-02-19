/**
 * Forgot Password API Route
 * 
 * Handles password reset requests
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'الرمز مطلوب'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
})

// In production, you would use a proper email service and database storage
// For now, we'll store reset tokens in memory (will be lost on restart)
const resetTokens = new Map<string, { email: string; expires: number }>()

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
      const tokenData = resetTokens.get(token)

      if (!tokenData || tokenData.expires < Date.now()) {
        return NextResponse.json(
          { success: false, error: 'الرمز غير صالح أو منتهي الصلاحية' },
          { status: 400 }
        )
      }

      // Hash new password
      const bcrypt = await import('bcryptjs')
      const passwordHash = await bcrypt.hash(password, 12)

      // Update user password
      await prisma.user.update({
        where: { email: tokenData.email },
        data: { passwordHash }
      })

      // Delete used token
      resetTokens.delete(token)

      // Delete all sessions (force re-login)
      await prisma.session.deleteMany({
        where: { user: { email: tokenData.email } }
      })

      return NextResponse.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      })
    } else {
      // Forgot password - send reset email
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

      // Generate reset token
      const crypto = await import('crypto')
      const token = crypto.randomBytes(32).toString('hex')
      
      // Store token (expires in 1 hour)
      resetTokens.set(token, {
        email,
        expires: Date.now() + 60 * 60 * 1000
      })

      // In production, send email with reset link
      // For development, return the token directly
      const isDevelopment = process.env.NODE_ENV !== 'production'
      
      if (isDevelopment) {
        // Return token for testing purposes
        return NextResponse.json({
          success: true,
          message: 'تم إنشاء رمز إعادة التعيين',
          // Only in development - remove in production!
          devToken: token,
          devResetUrl: `/auth/forgot-password?token=${token}&email=${encodeURIComponent(email)}`
        })
      }

      // In production, you would send an email here
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

  const tokenData = resetTokens.get(token)

  if (!tokenData || tokenData.expires < Date.now()) {
    return NextResponse.json({
      success: false,
      valid: false,
      error: 'الرمز غير صالح أو منتهي الصلاحية'
    })
  }

  return NextResponse.json({
    success: true,
    valid: true,
    email: tokenData.email
  })
}
