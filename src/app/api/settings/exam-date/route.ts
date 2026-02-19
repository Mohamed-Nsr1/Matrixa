/**
 * Public API for Exam Date
 * Students can fetch this to display the countdown
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get exam date from system settings
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'examDate' }
    })

    if (!setting || !setting.value) {
      // Return null if not set - component will use default
      return NextResponse.json({ 
        success: true, 
        examDate: null 
      })
    }

    return NextResponse.json({ 
      success: true, 
      examDate: setting.value 
    })
  } catch (error) {
    console.error('Get exam date error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
