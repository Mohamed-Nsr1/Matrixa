/**
 * Private Lessons API Route
 * 
 * GET: Returns all private lessons for the current user
 * POST: Create a new private lesson
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const privateLessons = await prisma.privateLesson.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      orderBy: [
        { time: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      privateLessons
    })
  } catch (error) {
    console.error('Error fetching private lessons:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch private lessons' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
      color 
    } = body

    // Validate required fields
    if (!teacherName || !teacherName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Teacher name is required' },
        { status: 400 }
      )
    }

    if (!subjectName || !subjectName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Subject name is required' },
        { status: 400 }
      )
    }

    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one day must be selected' },
        { status: 400 }
      )
    }

    if (!time || !time.trim()) {
      return NextResponse.json(
        { success: false, error: 'Time is required' },
        { status: 400 }
      )
    }

    if (!duration || duration < 1) {
      return NextResponse.json(
        { success: false, error: 'Duration must be at least 1 minute' },
        { status: 400 }
      )
    }

    // Validate daysOfWeek are valid (0-6)
    const validDays = daysOfWeek.filter((d: number) => d >= 0 && d <= 6 && Number.isInteger(d))
    if (validDays.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid days selected' },
        { status: 400 }
      )
    }

    const privateLesson = await prisma.privateLesson.create({
      data: {
        userId: user.id,
        teacherName: teacherName.trim(),
        subjectName: subjectName.trim(),
        centerName: centerName?.trim() || null,
        daysOfWeek: JSON.stringify(validDays),
        time: time.trim(),
        duration: parseInt(duration),
        location: location?.trim() || null,
        notes: notes?.trim() || null,
        color: color || null,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      privateLesson
    })
  } catch (error) {
    console.error('Error creating private lesson:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create private lesson' },
      { status: 500 }
    )
  }
}
