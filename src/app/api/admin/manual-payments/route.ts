/**
 * Admin Manual Payments Management API
 * 
 * Admin endpoints for reviewing and processing manual payment requests.
 * Includes approve, reject, and request follow-up functionality.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { activateSubscription, calculateGracePeriodEnd } from '@/lib/subscription'

// GET - List all manual payment requests (with filters)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const paymentMethod = searchParams.get('paymentMethod') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod
    }

    const [requests, total] = await Promise.all([
      prisma.manualPaymentRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true
            }
          },
          plan: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.manualPaymentRequest.count({ where })
    ])

    return NextResponse.json({
      success: true,
      requests,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Get manual payments error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}
