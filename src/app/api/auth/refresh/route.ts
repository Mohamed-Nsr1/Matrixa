/**
 * Refresh Token API Route
 * 
 * Handles access token refresh using refresh token
 * - Rate limiting (20 attempts per minute per IP)
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifySession, generateAccessToken, setAuthCookies, generateRefreshToken } from '@/lib/auth'
import { getDeviceFingerprint } from '@/lib/auth'
import { refreshRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Check rate limit first (async for Redis support)
    const rateLimitResult = await refreshRateLimit.check(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token' },
        { status: 401 }
      )
    }

    // Verify session
    const userId = await verifySession(refreshToken)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    // Get device fingerprint
    const deviceId = getDeviceFingerprint(
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || ''
    )

    // Check device fingerprint matches
    const session = await prisma.session.findUnique({
      where: { refreshToken }
    })

    if (!session || session.deviceFingerprint !== deviceId) {
      // Delete the session - potential security issue
      await prisma.session.delete({
        where: { refreshToken }
      }).catch(() => {})

      return NextResponse.json(
        { success: false, error: 'Device mismatch' },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId
    })

    // Optionally rotate refresh token
    const newRefreshToken = await generateRefreshToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Update session with new refresh token
    await prisma.session.update({
      where: { refreshToken },
      data: {
        refreshToken: newRefreshToken,
        expiresAt
      }
    })

    // Set new cookies
    await setAuthCookies(accessToken, newRefreshToken)

    return NextResponse.json({
      success: true,
      message: 'Token refreshed'
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
