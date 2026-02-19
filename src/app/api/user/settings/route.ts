/**
 * User Settings API Route
 * 
 * Updates user settings
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const settingsSchema = z.object({
  studyLanguage: z.enum(['arabic', 'english']).optional(),
  uiLanguage: z.enum(['arabic', 'english']).optional(),
  dailyStudyGoal: z.number().min(30).max(480).optional(),
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  branchId: z.string().optional(),
  specialization: z.enum(['science', 'math']).optional(),
  secondLanguage: z.enum(['french', 'german']).optional(),
  studyReminders: z.boolean().optional(),
  taskReminders: z.boolean().optional()
})

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = settingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const data = validation.data

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data
    })

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        passwordHash: undefined
      }
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
