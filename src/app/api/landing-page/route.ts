/**
 * Public Landing Page API Route
 * 
 * Returns landing page content for public access (no auth required)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get landing page content
    const content = await prisma.landingPageContent.findFirst()

    // Get features
    const features = await prisma.landingPageFeature.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      content,
      features
    })
  } catch (error) {
    console.error('Error fetching public landing page content:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
