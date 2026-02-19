/**
 * Manual Payment Request API
 * 
 * Handles manual payment submissions from students using Egyptian mobile wallets
 * and InstaPay. Students submit receipt images and admin manually approves.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const manualPaymentSchema = z.object({
  planId: z.string().min(1, 'يجب اختيار خطة الاشتراك'),
  paymentMethod: z.enum(['VODAFONE_CASH', 'ETISALAT_CASH', 'ORANGE_CASH', 'INSTAPAY']),
  senderPhone: z.string().optional(),
  senderInstaPayUsername: z.string().optional(),
  receiptImageUrl: z.string().min(1, 'يجب رفع صورة الإيصال'),
})

// GET - Get user's manual payment requests
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const requests = await prisma.manualPaymentRequest.findMany({
      where: { userId: user.id },
      include: {
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      requests
    })
  } catch (error) {
    console.error('Get manual payments error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}

// POST - Submit new manual payment request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = manualPaymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { planId, paymentMethod, senderPhone, senderInstaPayUsername, receiptImageUrl } = validation.data

    // Validate sender info based on payment method
    if (paymentMethod === 'INSTAPAY') {
      if (!senderInstaPayUsername || senderInstaPayUsername.trim().length < 3) {
        return NextResponse.json(
          { success: false, error: 'يجب إدخال اسم المستخدم في انستاباي' },
          { status: 400 }
        )
      }
    } else {
      // Mobile wallet - validate phone
      if (!senderPhone || !/^01[0-9]{9}$/.test(senderPhone)) {
        return NextResponse.json(
          { success: false, error: 'يجب إدخال رقم هاتف صحيح (01xxxxxxxxx)' },
          { status: 400 }
        )
      }
    }

    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId, isActive: true }
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'خطة الاشتراك غير موجودة' },
        { status: 400 }
      )
    }

    // Check for pending requests (prevent spam)
    const existingPending = await prisma.manualPaymentRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'NEEDS_INFO', 'INFO_PROVIDED'] }
      }
    })

    if (existingPending) {
      return NextResponse.json(
        { success: false, error: 'لديك طلب دفع قيد المراجعة بالفعل' },
        { status: 400 }
      )
    }

    // Create payment request
    const paymentRequest = await prisma.manualPaymentRequest.create({
      data: {
        userId: user.id,
        planId,
        amount: plan.price,
        paymentMethod,
        senderPhone: paymentMethod !== 'INSTAPAY' ? senderPhone : null,
        senderInstaPayUsername: paymentMethod === 'INSTAPAY' ? senderInstaPayUsername : null,
        receiptImageUrl,
        status: 'PENDING'
      },
      include: {
        plan: true
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MANUAL_PAYMENT_SUBMITTED',
        entityType: 'ManualPaymentRequest',
        entityId: paymentRequest.id,
        newValue: JSON.stringify({
          planId,
          paymentMethod,
          amount: plan.price
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الدفع بنجاح. سيتم مراجعته خلال 24 ساعة',
      request: paymentRequest
    })
  } catch (error) {
    console.error('Manual payment submission error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إرسال الطلب' },
      { status: 500 }
    )
  }
}

// PATCH - Update payment request (for user follow-up response)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { requestId, userResponse, additionalReceiptUrl } = body

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'معرف الطلب مطلوب' },
        { status: 400 }
      )
    }

    // Find the payment request
    const paymentRequest = await prisma.manualPaymentRequest.findFirst({
      where: {
        id: requestId,
        userId: user.id,
        status: 'NEEDS_INFO'
      }
    })

    if (!paymentRequest) {
      return NextResponse.json(
        { success: false, error: 'الطلب غير موجود أو لا يمكن تعديله' },
        { status: 400 }
      )
    }

    // Update with user response
    const updated = await prisma.manualPaymentRequest.update({
      where: { id: requestId },
      data: {
        userResponse,
        additionalReceiptUrl,
        userRespondedAt: new Date(),
        status: 'INFO_PROVIDED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إرسال ردك بنجاح',
      request: updated
    })
  } catch (error) {
    console.error('Update manual payment error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث الطلب' },
      { status: 500 }
    )
  }
}
