/**
 * Admin User Detail API Route
 * Get, update, delete individual user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  fullName: z.string().optional(),
  role: z.enum(['STUDENT', 'ADMIN']).optional(),
  branchId: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
  dailyStudyGoal: z.number().nullable().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, nameAr: true, nameEn: true } },
        specialization: true,
        secondLanguage: true,
        studyLanguage: true,
        uiLanguage: true,
        dailyStudyGoal: true,
        onboardingCompleted: true,
        deviceFingerprint: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            trialStart: true,
            trialEnd: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            tasks: true,
            notes: true,
            focusSessions: true,
            lessonProgress: true
          }
        },
        streaks: {
          select: {
            currentStreak: true,
            longestStreak: true
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: targetUser })
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
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

    // Prevent deleting yourself
    if (id === user.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
