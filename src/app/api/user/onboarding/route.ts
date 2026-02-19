/**
 * User Onboarding API Route
 * 
 * Completes the onboarding process for a user
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateAccessToken } from '@/lib/auth-edge'
import { setAuthCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'

const onboardingSchema = z.object({
  studyLanguage: z.enum(['arabic', 'english']),
  fullName: z.string().min(2).max(100),
  branchId: z.string(),
  specialization: z.enum(['science', 'math']).nullable(),
  secondLanguage: z.enum(['french', 'german']),
  dailyStudyGoal: z.number().min(30).max(480)
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = onboardingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId }
    })

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch' },
        { status: 400 }
      )
    }

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: data.fullName,
        studyLanguage: data.studyLanguage,
        branchId: data.branchId,
        specialization: data.specialization,
        secondLanguage: data.secondLanguage,
        dailyStudyGoal: data.dailyStudyGoal,
        onboardingCompleted: true,
        onboardingStep: 8
      }
    })

    // Create initial streak record
    await prisma.streak.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0
      },
      update: {}
    })

    // Create leaderboard entry
    await prisma.leaderboardEntry.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        score: 0,
        studyMinutes: 0,
        tasksCompleted: 0,
        focusSessions: 0,
        isOptedIn: true
      },
      update: {}
    })

    // Set onboarding completed cookie
    const cookieStore = await cookies()
    cookieStore.set('onboardingCompleted', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/'
    })

    // Generate new access token with onboardingCompleted flag
    // Get the current refresh token to preserve session
    const refreshToken = cookieStore.get('refreshToken')?.value
    if (refreshToken) {
      const newAccessToken = await generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceId: user.deviceFingerprint || '',
        onboardingCompleted: true
      })
      
      // Update the access token cookie
      cookieStore.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/'
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        passwordHash: undefined
      }
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
