/**
 * Private Lesson API Route (by ID)
 * 
 * PATCH: Update a private lesson
 * DELETE: Delete a private lesson (soft delete by setting isActive to false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { 
      teacherName, 
      subjectName, 
      centerName, 
      daysOfWeek, 
      time, 
      duration, 
      location, 
      notes,
      color,
      isActive
    } = body

    // Check if private lesson exists and belongs to user
    const existingLesson = await prisma.privateLesson.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingLesson) {
      return NextResponse.json(
        { success: false, error: 'Private lesson not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (teacherName !== undefined) {
      if (!teacherName || !teacherName.trim()) {
        return NextResponse.json(
          { success: false, error: 'Teacher name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.teacherName = teacherName.trim()
    }

    if (subjectName !== undefined) {
      if (!subjectName || !subjectName.trim()) {
        return NextResponse.json(
          { success: false, error: 'Subject name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.subjectName = subjectName.trim()
    }

    if (centerName !== undefined) {
      updateData.centerName = centerName?.trim() || null
    }

    if (daysOfWeek !== undefined) {
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one day must be selected' },
          { status: 400 }
        )
      }
      const validDays = daysOfWeek.filter((d: number) => d >= 0 && d <= 6 && Number.isInteger(d))
      if (validDays.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid days selected' },
          { status: 400 }
        )
      }
      updateData.daysOfWeek = JSON.stringify(validDays)
    }

    if (time !== undefined) {
      if (!time || !time.trim()) {
        return NextResponse.json(
          { success: false, error: 'Time cannot be empty' },
          { status: 400 }
        )
      }
      updateData.time = time.trim()
    }

    if (duration !== undefined) {
      if (!duration || duration < 1) {
        return NextResponse.json(
          { success: false, error: 'Duration must be at least 1 minute' },
          { status: 400 }
        )
      }
      updateData.duration = parseInt(duration)
    }

    if (location !== undefined) {
      updateData.location = location?.trim() || null
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null
    }

    if (color !== undefined) {
      updateData.color = color || null
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    const updatedLesson = await prisma.privateLesson.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      privateLesson: updatedLesson
    })
  } catch (error) {
    console.error('Error updating private lesson:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update private lesson' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if private lesson exists and belongs to user
    const existingLesson = await prisma.privateLesson.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingLesson) {
      return NextResponse.json(
        { success: false, error: 'Private lesson not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.privateLesson.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Private lesson deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting private lesson:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete private lesson' },
      { status: 500 }
    )
  }
}
