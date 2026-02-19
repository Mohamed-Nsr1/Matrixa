/**
 * Admin Subscription Plans API
 * 
 * CRUD operations for subscription plans.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createPlanSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0),
  durationDays: z.number().min(1),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().default(true)
})

// GET all plans (including inactive)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      plans: plans.map(plan => ({
        ...plan,
        subscriberCount: plan._count.subscriptions
      }))
    })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new plan
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = createPlanSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const data = validation.data

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        description: data.description || null,
        descriptionAr: data.descriptionAr || null,
        price: data.price,
        durationDays: data.durationDays,
        features: data.features ? JSON.stringify(data.features) : null,
        isActive: data.isActive
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PLAN_CREATED',
        entityType: 'SubscriptionPlan',
        entityId: plan.id,
        newValue: JSON.stringify(plan)
      }
    })

    return NextResponse.json({
      success: true,
      plan
    })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
