/**
 * Admin Impersonation API
 * 
 * Allows admins to log in as another user for support purposes
 */

import { NextResponse } from 'next/server'
import { getCurrentUser, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Cannot impersonate other admins
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot impersonate other admins' },
        { status: 403 }
      )
    }

    // Delete existing sessions for target user
    await prisma.session.deleteMany({
      where: { userId: targetUser.id }
    })

    // Create new session
    const refreshToken = await generateRefreshToken()
    const deviceFingerprint = `impersonate-${user.id}-${Date.now()}`

    await prisma.session.create({
      data: {
        userId: targetUser.id,
        refreshToken,
        deviceFingerprint,
        userAgent: `Impersonated by admin: ${user.email}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    // Generate access token for target user
    const accessToken = await generateAccessToken({
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      deviceId: deviceFingerprint,
      onboardingCompleted: targetUser.onboardingCompleted
    })

    // Set cookies
    const cookieStore = await cookies()
    
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Set impersonation flag
    cookieStore.set('isImpersonating', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    cookieStore.set('impersonatorId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    cookieStore.set('impersonatorEmail', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    // Set subscription cookies for target user
    cookieStore.set('subscriptionEnabled', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    const subscription = await prisma.subscription.findFirst({
      where: { userId: targetUser.id },
      orderBy: { createdAt: 'desc' }
    })

    const isActive = subscription?.status === 'ACTIVE'
    const isInTrial = subscription?.status === 'TRIAL'
    
    cookieStore.set('subscriptionActive', isActive ? 'true' : 'false', {
      httpOnly: true,
      sameSite: 'lax'
    })

    cookieStore.set('isInTrial', isInTrial ? 'true' : 'false', {
      httpOnly: true,
      sameSite: 'lax'
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPERSONATE_USER',
        entityType: 'User',
        entityId: targetUser.id,
        newValue: JSON.stringify({ email: targetUser.email })
      }
    })

    return NextResponse.json({
      success: true,
      message: `Now impersonating ${targetUser.email}`,
      redirectUrl: '/dashboard'
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to impersonate user' },
      { status: 500 }
    )
  }
}
