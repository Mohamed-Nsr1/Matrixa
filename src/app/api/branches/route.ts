/**
 * Branches API Route
 * 
 * Returns all active branches for the onboarding process
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: branches
    })
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}
