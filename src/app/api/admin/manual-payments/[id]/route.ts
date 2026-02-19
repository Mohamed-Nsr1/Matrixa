/**
 * Admin Manual Payment Request Actions API
 * 
 * Handle approve, reject, and follow-up actions for manual payment requests.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calculateGracePeriodEnd } from '@/lib/subscription'

// GET - Get single payment request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    const { id } = await params

    const paymentRequest = await prisma.manualPaymentRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            createdAt: true,
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        plan: true
      }
    })

    if (!paymentRequest) {
      return NextResponse.json(
        { success: false, error: 'الطلب غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      request: paymentRequest
    })
  } catch (error) {
    console.error('Get payment request error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}

// PATCH - Update payment request status (approve, reject, follow-up)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, adminNotes, followUpMessage } = body

    // Find the payment request
    const paymentRequest = await prisma.manualPaymentRequest.findUnique({
      where: { id },
      include: { user: true, plan: true }
    })

    if (!paymentRequest) {
      return NextResponse.json(
        { success: false, error: 'الطلب غير موجود' },
        { status: 404 }
      )
    }

    let updateData: any = {
      reviewedBy: user.id,
      reviewedAt: new Date(),
      adminNotes
    }

    switch (action) {
      case 'approve':
        updateData.status = 'APPROVED'
        break
      case 'reject':
        updateData.status = 'REJECTED'
        break
      case 'follow_up':
        updateData.status = 'NEEDS_INFO'
        updateData.followUpMessage = followUpMessage
        updateData.followUpSentAt = new Date()
        break
      default:
        return NextResponse.json(
          { success: false, error: 'إجراء غير صحيح' },
          { status: 400 }
        )
    }

    // Use transaction for approve action to create subscription
    if (action === 'approve') {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + paymentRequest.plan.durationDays)
      
      const gracePeriodEnd = await calculateGracePeriodEnd(endDate)

      await prisma.$transaction([
        // Update payment request
        prisma.manualPaymentRequest.update({
          where: { id },
          data: updateData
        }),
        // Deactivate existing subscriptions
        prisma.subscription.updateMany({
          where: { 
            userId: paymentRequest.userId,
            status: { in: ['TRIAL', 'ACTIVE'] }
          },
          data: { status: 'CANCELLED' }
        }),
        // Create new subscription
        prisma.subscription.create({
          data: {
            userId: paymentRequest.userId,
            planId: paymentRequest.planId,
            status: 'ACTIVE',
            startDate: now,
            endDate,
            gracePeriodEnd
          }
        }),
        // Create audit log
        prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'MANUAL_PAYMENT_APPROVED',
            entityType: 'ManualPaymentRequest',
            entityId: id,
            newValue: JSON.stringify({
              planId: paymentRequest.planId,
              amount: paymentRequest.amount,
              paymentMethod: paymentRequest.paymentMethod
            })
          }
        })
      ])
    } else {
      // Just update the payment request
      await prisma.manualPaymentRequest.update({
        where: { id },
        data: updateData
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: `MANUAL_PAYMENT_${action.toUpperCase()}`,
          entityType: 'ManualPaymentRequest',
          entityId: id,
          newValue: JSON.stringify({ action, adminNotes, followUpMessage })
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'تم قبول الدفع وتفعيل الاشتراك' 
        : action === 'reject'
        ? 'تم رفض طلب الدفع'
        : 'تم إرسال طلب المتابعة للمستخدم'
    })
  } catch (error) {
    console.error('Update payment request error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    )
  }
}
