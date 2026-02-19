/**
 * Admin Subscription Plan API (Single)
 * 
 * Update and delete individual plans.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  durationDays: z.number().min(1).optional(),
  features: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET single plan
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: {
        ...plan,
        subscriberCount: plan._count.subscriptions
      }
    })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update plan
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updatePlanSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get old plan for audit log
    const oldPlan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    })

    if (!oldPlan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    // Update plan
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameAr && { nameAr: data.nameAr }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.durationDays !== undefined && { durationDays: data.durationDays }),
        ...(data.features !== undefined && { features: data.features ? JSON.stringify(data.features) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PLAN_UPDATED',
        entityType: 'SubscriptionPlan',
        entityId: id,
        oldValue: JSON.stringify(oldPlan),
        newValue: JSON.stringify(plan)
      }
    })

    return NextResponse.json({
      success: true,
      plan
    })
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE plan (soft delete by setting isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: id,
        status: 'ACTIVE'
      }
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete plan with ${activeSubscriptions} active subscriptions. Deactivate it instead.`
      }, { status: 400 })
    }

    // Soft delete
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PLAN_DELETED',
        entityType: 'SubscriptionPlan',
        entityId: id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Plan deactivated successfully'
    })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
