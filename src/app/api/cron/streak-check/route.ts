/**
 * Cron Streak Check API Route
 * 
 * GET: Check and break streaks for users who haven't been active
 * 
 * This endpoint is designed to be called by a cron job (e.g., daily at midnight).
 * It checks all streaks and resets those where the user hasn't been active.
 * 
 * Security: This endpoint should be secured with a cron secret.
 * Set CRON_SECRET environment variable and pass it as ?secret=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkBrokenStreaks } from '@/lib/streak'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET
    const providedSecret = request.nextUrl.searchParams.get('secret')

    // If CRON_SECRET is set, require matching secret
    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If no CRON_SECRET is set, only allow in development
    if (!cronSecret && process.env.NODE_ENV === 'production') {
      console.warn('CRON_SECRET not set in production - streak check endpoint is disabled')
      return NextResponse.json(
        { success: false, error: 'Endpoint disabled' },
        { status: 403 }
      )
    }

    console.log('[CRON] Starting streak check...')

    // Run the streak check
    const brokenCount = await checkBrokenStreaks()

    // Get stats
    const totalStreaks = await prisma.streak.count()
    const activeStreaks = await prisma.streak.count({
      where: { currentStreak: { gt: 0 } }
    })

    console.log(`[CRON] Streak check complete: ${brokenCount} streaks broken`)

    return NextResponse.json({
      success: true,
      message: 'Streak check completed',
      stats: {
        brokenCount,
        totalStreaks,
        activeStreaks,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[CRON] Streak check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * To set up a cron job for this endpoint:
 * 
 * Example with cron-job.org or similar services:
 * URL: https://your-domain.com/api/cron/streak-check?secret=YOUR_SECRET
 * Schedule: Daily at 00:05 (5 minutes after midnight)
 * 
 * Example with Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/streak-check",
 *     "schedule": "5 0 * * *"
 *   }]
 * }
 * 
 * Note: For Vercel Cron, you can verify the request using:
 * - request.headers.get('x-vercel-cron') === 'true'
 * - Or set up authorization headers
 */
