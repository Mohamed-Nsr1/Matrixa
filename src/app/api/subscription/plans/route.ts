/**
 * Subscription Plans API
 * 
 * Returns all active subscription plans.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    // If no plans exist, create default ones
    if (plans.length === 0) {
      const defaultPlans = await Promise.all([
        prisma.subscriptionPlan.create({
          data: {
            name: 'Monthly',
            nameAr: 'الخطة الشهرية',
            description: 'Perfect for trying out',
            descriptionAr: 'مثالية للتجربة',
            price: 99,
            durationDays: 30,
            features: JSON.stringify([
              'الوصول الكامل لجميع المواد',
              'تتبع التقدم والإحصائيات',
              'جلسات التركيز',
              'المخطط الأسبوعي',
              'الملاحظات'
            ]),
            isActive: true
          }
        }),
        prisma.subscriptionPlan.create({
          data: {
            name: 'Quarterly',
            nameAr: 'الخطة الربع سنوية',
            description: 'Best value for students',
            descriptionAr: 'أفضل قيمة للطلاب',
            price: 249,
            durationDays: 90,
            features: JSON.stringify([
              'الوصول الكامل لجميع المواد',
              'تتبع التقدم والإحصائيات',
              'جلسات التركيز',
              'المخطط الأسبوعي',
              'الملاحظات',
              'دعم فني متميز',
              'توفير 15%'
            ]),
            isActive: true
          }
        }),
        prisma.subscriptionPlan.create({
          data: {
            name: 'Annual',
            nameAr: 'الخطة السنوية',
            description: 'Full year access',
            descriptionAr: 'وصول لمدة عام كامل',
            price: 799,
            durationDays: 365,
            features: JSON.stringify([
              'الوصول الكامل لجميع المواد',
              'تتبع التقدم والإحصائيات',
              'جلسات التركيز',
              'المخطط الأسبوعي',
              'الملاحظات',
              'دعم فني متميز',
              'توفير 30%',
              'مميزات حصرية'
            ]),
            isActive: true
          }
        })
      ])

      return NextResponse.json({
        success: true,
        plans: defaultPlans
      })
    }

    return NextResponse.json({
      success: true,
      plans
    })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
