/**
 * Admin Badges API Route
 *
 * GET - Get all badges
 * POST - Create a new badge
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { BadgeType, BadgeRarity } from '@prisma/client'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const badges = await prisma.badge.findMany({
      orderBy: [{ rarity: 'asc' }, { order: 'asc' }],
      include: {
        _count: {
          select: { userBadges: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      badges
    })
  } catch (error) {
    console.error('Get badges error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      icon,
      color,
      type,
      requirement,
      rarity,
      xpReward,
      order
    } = body

    const badge = await prisma.badge.create({
      data: {
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        icon: icon || '🏆',
        color: color || '#8b5cf6',
        type: (type || 'SPECIAL') as BadgeType,
        requirement: requirement || 1,
        rarity: (rarity || 'COMMON') as BadgeRarity,
        xpReward: xpReward || 0,
        order: order || 0
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_BADGE',
        entityType: 'Badge',
        entityId: badge.id,
        newValue: JSON.stringify(badge)
      }
    })

    return NextResponse.json({
      success: true,
      badge
    })
  } catch (error) {
    console.error('Create badge error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Seed default badges
 * This can be called once to set up initial badges
 */
export async function PUT() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const defaultBadges = [
      // Streak badges
      { nameAr: 'البداية', nameEn: 'The Beginning', descriptionAr: 'سلسلة 3 أيام', descriptionEn: '3 day streak', icon: '🌱', type: 'STREAK', requirement: 3, rarity: 'COMMON', xpReward: 10, order: 1 },
      { nameAr: 'مثابر', nameEn: 'Persistent', descriptionAr: 'سلسلة 7 أيام', descriptionEn: '7 day streak', icon: '🔥', type: 'STREAK', requirement: 7, rarity: 'COMMON', xpReward: 25, order: 2 },
      { nameAr: 'متحمس', nameEn: 'Enthusiast', descriptionAr: 'سلسلة 14 يوم', descriptionEn: '14 day streak', icon: '⚡', type: 'STREAK', requirement: 14, rarity: 'UNCOMMON', xpReward: 50, order: 3 },
      { nameAr: 'منظم', nameEn: 'Disciplined', descriptionAr: 'سلسلة 30 يوم', descriptionEn: '30 day streak', icon: '📅', type: 'STREAK', requirement: 30, rarity: 'RARE', xpReward: 100, order: 4 },
      { nameAr: 'محارب', nameEn: 'Warrior', descriptionAr: 'سلسلة 60 يوم', descriptionEn: '60 day streak', icon: '⚔️', type: 'STREAK', requirement: 60, rarity: 'EPIC', xpReward: 200, order: 5 },
      { nameAr: 'أسطوري', nameEn: 'Legendary', descriptionAr: 'سلسلة 100 يوم', descriptionEn: '100 day streak', icon: '👑', type: 'STREAK', requirement: 100, rarity: 'LEGENDARY', xpReward: 500, order: 6 },

      // Tasks badges
      { nameAr: 'منجز مبتدئ', nameEn: 'Beginner Achiever', descriptionAr: 'إكمال 10 مهام', descriptionEn: 'Complete 10 tasks', icon: '✅', type: 'TASKS', requirement: 10, rarity: 'COMMON', xpReward: 15, order: 1 },
      { nameAr: 'منجز نشط', nameEn: 'Active Achiever', descriptionAr: 'إكمال 50 مهمة', descriptionEn: 'Complete 50 tasks', icon: '🎯', type: 'TASKS', requirement: 50, rarity: 'UNCOMMON', xpReward: 50, order: 2 },
      { nameAr: 'منجز محترف', nameEn: 'Pro Achiever', descriptionAr: 'إكمال 100 مهمة', descriptionEn: 'Complete 100 tasks', icon: '🏆', type: 'TASKS', requirement: 100, rarity: 'RARE', xpReward: 100, order: 3 },
      { nameAr: 'منجز خبير', nameEn: 'Expert Achiever', descriptionAr: 'إكمال 500 مهمة', descriptionEn: 'Complete 500 tasks', icon: '💎', type: 'TASKS', requirement: 500, rarity: 'EPIC', xpReward: 250, order: 4 },

      // Focus badges
      { nameAr: 'مركز مبتدئ', nameEn: 'Beginner Focused', descriptionAr: '10 جلسات تركيز', descriptionEn: '10 focus sessions', icon: '🧘', type: 'FOCUS', requirement: 10, rarity: 'COMMON', xpReward: 15, order: 1 },
      { nameAr: 'مركز نشط', nameEn: 'Active Focused', descriptionAr: '50 جلسة تركيز', descriptionEn: '50 focus sessions', icon: '🎯', type: 'FOCUS', requirement: 50, rarity: 'UNCOMMON', xpReward: 50, order: 2 },
      { nameAr: 'مركز محترف', nameEn: 'Pro Focused', descriptionAr: '100 جلسة تركيز', descriptionEn: '100 focus sessions', icon: '🌟', type: 'FOCUS', requirement: 100, rarity: 'RARE', xpReward: 100, order: 3 },
      { nameAr: 'سيد التركيز', nameEn: 'Focus Master', descriptionAr: '250 جلسة تركيز', descriptionEn: '250 focus sessions', icon: '🔮', type: 'FOCUS', requirement: 250, rarity: 'EPIC', xpReward: 200, order: 4 },

      // Special badges
      { nameAr: 'أول خطوة', nameEn: 'First Step', descriptionAr: 'أول تسجيل دخول', descriptionEn: 'First login', icon: '👋', type: 'SPECIAL', requirement: 1, rarity: 'COMMON', xpReward: 5, order: 1 },
      { nameAr: 'مستكشف', nameEn: 'Explorer', descriptionAr: 'زيارة جميع الصفحات', descriptionEn: 'Visit all pages', icon: '🧭', type: 'SPECIAL', requirement: 1, rarity: 'UNCOMMON', xpReward: 30, order: 2 },
      { nameAr: 'مبكر', nameEn: 'Early Bird', descriptionAr: 'المذاكرة قبل 6 صباحاً', descriptionEn: 'Study before 6 AM', icon: '🌅', type: 'SPECIAL', requirement: 1, rarity: 'RARE', xpReward: 50, order: 3 },
      { nameAr: 'محارب الليل', nameEn: 'Night Owl', descriptionAr: 'المذاكرة بعد منتصف الليل', descriptionEn: 'Study after midnight', icon: '🦉', type: 'SPECIAL', requirement: 1, rarity: 'RARE', xpReward: 50, order: 4 },
    ]

    let created = 0
    for (const badge of defaultBadges) {
      const existing = await prisma.badge.findFirst({
        where: { nameAr: badge.nameAr }
      })

      if (!existing) {
        await prisma.badge.create({
          data: {
            ...badge,
            type: badge.type as BadgeType,
            rarity: badge.rarity as BadgeRarity
          }
        })
        created++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${created} new badges`,
      totalDefaultBadges: defaultBadges.length
    })
  } catch (error) {
    console.error('Seed badges error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
