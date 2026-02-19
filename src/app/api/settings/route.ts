/**
 * System Settings API Route
 * 
 * Returns public system settings for the frontend
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public settings that can be exposed to the frontend
const PUBLIC_SETTINGS = [
  'inviteOnlyMode',
  'subscriptionEnabled',
  'trialEnabled',
  'trialDays',
  'leaderboardEnabled'
]

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: { in: PUBLIC_SETTINGS }
      }
    })

    // Convert to object
    const settingsObj: Record<string, string | boolean | number> = {}
    for (const setting of settings) {
      // Parse boolean values
      if (setting.value === 'true' || setting.value === 'false') {
        settingsObj[setting.key] = setting.value === 'true'
      } else if (!isNaN(Number(setting.value))) {
        settingsObj[setting.key] = Number(setting.value)
      } else {
        settingsObj[setting.key] = setting.value
      }
    }

    return NextResponse.json({
      success: true,
      settings: settingsObj
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
