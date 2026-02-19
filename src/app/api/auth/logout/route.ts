/**
 * Logout API Route
 * 
 * Handles user logout by:
 * - Invalidating the refresh token
 * - Clearing auth cookies
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { clearAuthCookies } from '@/lib/auth'

export async function POST() {
  try {
    // Get refresh token from cookie
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    // Delete session from database
    if (refreshToken) {
      await prisma.session.delete({
        where: { refreshToken }
      }).catch(() => {}) // Ignore if session doesn't exist
    }

    // Clear cookies
    await clearAuthCookies()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
