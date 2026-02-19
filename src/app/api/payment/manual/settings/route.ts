/**
 * Manual Payment Settings API (Public)
 * 
 * Returns public settings for manual payment (phone numbers, etc.)
 * Used by students to see where to send money
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get all relevant settings
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
            'manualPaymentEnabled',
            'vodafoneCashNumber',
            'etisalatCashNumber',
            'orangeCashNumber',
            'instaPayUsername',
            'vodafoneCashEnabled',
            'etisalatCashEnabled',
            'orangeCashEnabled',
            'instaPayEnabled'
          ]
        }
      }
    })

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({
      success: true,
      settings: {
        manualPaymentEnabled: settingsMap.manualPaymentEnabled === 'true',
        vodafoneCashNumber: settingsMap.vodafoneCashNumber || '',
        etisalatCashNumber: settingsMap.etisalatCashNumber || '',
        orangeCashNumber: settingsMap.orangeCashNumber || '',
        instaPayUsername: settingsMap.instaPayUsername || '',
        vodafoneCashEnabled: settingsMap.vodafoneCashEnabled === 'true',
        etisalatCashEnabled: settingsMap.etisalatCashEnabled === 'true',
        orangeCashEnabled: settingsMap.orangeCashEnabled === 'true',
        instaPayEnabled: settingsMap.instaPayEnabled === 'true'
      }
    })
  } catch (error) {
    console.error('Get manual payment settings error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    )
  }
}
