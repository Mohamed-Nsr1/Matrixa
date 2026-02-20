/**
 * Admin Landing Page API Route
 * 
 * Handles CRUD operations for landing page content and features
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const landingPageContentSchema = z.object({
  heroTitle: z.string().optional().nullable(),
  heroTitleEn: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  heroSubtitleEn: z.string().optional().nullable(),
  heroCtaText: z.string().optional().nullable(),
  heroCtaTextEn: z.string().optional().nullable(),
  badgeText: z.string().optional().nullable(),
  badgeTextEn: z.string().optional().nullable(),
  stat1Value: z.string().optional().nullable(),
  stat1Label: z.string().optional().nullable(),
  stat1LabelEn: z.string().optional().nullable(),
  stat2Value: z.string().optional().nullable(),
  stat2Label: z.string().optional().nullable(),
  stat2LabelEn: z.string().optional().nullable(),
  stat3Value: z.string().optional().nullable(),
  stat3Label: z.string().optional().nullable(),
  stat3LabelEn: z.string().optional().nullable(),
  stat4Value: z.string().optional().nullable(),
  stat4Label: z.string().optional().nullable(),
  stat4LabelEn: z.string().optional().nullable(),
  featuresTitle: z.string().optional().nullable(),
  featuresTitleEn: z.string().optional().nullable(),
  featuresSubtitle: z.string().optional().nullable(),
  featuresSubtitleEn: z.string().optional().nullable(),
  ctaTitle: z.string().optional().nullable(),
  ctaTitleEn: z.string().optional().nullable(),
  ctaSubtitle: z.string().optional().nullable(),
  ctaSubtitleEn: z.string().optional().nullable(),
  ctaButtonText: z.string().optional().nullable(),
  ctaButtonTextEn: z.string().optional().nullable(),
  footerText: z.string().optional().nullable(),
  footerTextEn: z.string().optional().nullable(),
})

const featureSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  titleEn: z.string().optional().nullable(),
  description: z.string().min(1),
  descriptionEn: z.string().optional().nullable(),
  icon: z.string().default('Star'),
  color: z.string().default('text-primary'),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
})

// GET - Retrieve landing page content and features
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create landing page content
    let content = await prisma.landingPageContent.findFirst()
    
    if (!content) {
      // Create default content
      content = await prisma.landingPageContent.create({
        data: {
          heroTitle: 'ادرس بذكاء،',
          heroTitleEn: 'Study Smart,',
          heroSubtitle: 'تطبيق المذاكرة الذكي الذي يساعدك على التغلب على تشتت الانتباه، وتنظيم وقتك، وتحقيق أهدافك الدراسية.',
          heroSubtitleEn: 'The smart study app that helps you overcome distractions, organize your time, and achieve your academic goals.',
          heroCtaText: 'ابدأ تجربتك المجانية',
          heroCtaTextEn: 'Start Your Free Trial',
          badgeText: 'مصمم خصيصاً لطلاب الثانوية المصرية',
          badgeTextEn: 'Designed for Egyptian High School Students',
          stat1Value: '10K+',
          stat1Label: 'طالب نشط',
          stat1LabelEn: 'Active Students',
          stat2Value: '50K+',
          stat2Label: 'ساعة مذاكرة',
          stat2LabelEn: 'Study Hours',
          stat3Value: '95%',
          stat3Label: 'رضا المستخدمين',
          stat3LabelEn: 'User Satisfaction',
          stat4Value: '4.9',
          stat4Label: 'تقييم التطبيق',
          stat4LabelEn: 'App Rating',
          featuresTitle: 'كل ما تحتاجه للتفوق',
          featuresTitleEn: 'Everything You Need to Excel',
          featuresSubtitle: 'أدوات مصممة بعناية لمساعدتك على المذاكرة بفعالية',
          featuresSubtitleEn: 'Carefully designed tools to help you study effectively',
          ctaTitle: 'جاهز تبدأ رحلتك؟',
          ctaTitleEn: 'Ready to Start Your Journey?',
          ctaSubtitle: 'انضم لآلاف الطلاب الذين يستخدمون Matrixa لتحسين أدائهم الدراسي',
          ctaSubtitleEn: 'Join thousands of students using Matrixa to improve their academic performance',
          ctaButtonText: 'ابدأ الآن مجاناً',
          ctaButtonTextEn: 'Start Free Now',
          footerText: '© 2024 Matrixa. جميع الحقوق محفوظة.',
          footerTextEn: '© 2024 Matrixa. All rights reserved.',
        }
      })
    }

    // Get features
    let features = await prisma.landingPageFeature.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    // Create default features if none exist
    if (features.length === 0) {
      const defaultFeatures = [
        { title: 'تخلص من ضياع الوقت', titleEn: 'No More Time Blindness', description: 'مؤقت بومودورو ذكي يساعدك على التركيز وقياس وقت المذاكرة الفعلي', descriptionEn: 'Smart Pomodoro timer helps you focus and track actual study time', icon: 'Clock', color: 'text-cyan', order: 0 },
        { title: 'مخطط أسبوعي ذكي', titleEn: 'Smart Weekly Planner', description: 'نظم دروسك ومواعيد السنتر في مكان واحد مع سحب وإفلات سهل', descriptionEn: 'Organize lessons and center schedules in one place with easy drag & drop', icon: 'Calendar', color: 'text-violet', order: 1 },
        { title: 'ركز على الأهم', titleEn: 'Focus on What Matters', description: 'اقتراحات ذكية للمواد التي تحتاج مذاكرة أكثر بناءً على تقدمك', descriptionEn: 'Smart suggestions for subjects that need more study based on your progress', icon: 'Target', color: 'text-emerald', order: 2 },
        { title: 'تغلب على التشتت', titleEn: 'Beat Distraction', description: 'واجهة هادئة وخالية من المقاطعات مصممة خصيصاً لطلاب الثانوية', descriptionEn: 'Calm, distraction-free interface designed specifically for high school students', icon: 'Brain', color: 'text-pink', order: 3 },
        { title: 'ملاحظات منظمة', titleEn: 'Organized Notes', description: 'اكتب ملاحظاتك واربطها بالمواد والدروس لسهولة الرجوع إليها', descriptionEn: 'Write notes and link them to subjects and lessons for easy reference', icon: 'Notebook', color: 'text-amber', order: 4 },
        { title: 'تتبع تقدمك', titleEn: 'Track Your Progress', description: 'إحصائيات ورسوم بيانية توضح مستوى إنجازك في كل مادة', descriptionEn: 'Statistics and charts showing your achievement level in each subject', icon: 'BarChart3', color: 'text-blue', order: 5 },
      ]

      for (const feature of defaultFeatures) {
        await prisma.landingPageFeature.create({ data: feature })
      }

      features = await prisma.landingPageFeature.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      })
    }

    return NextResponse.json({
      success: true,
      content,
      features
    })
  } catch (error) {
    console.error('Error fetching landing page content:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update landing page content
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, features } = body

    // Update content
    if (content) {
      const validation = landingPageContentSchema.safeParse(content)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.issues[0]?.message },
          { status: 400 }
        )
      }

      const existingContent = await prisma.landingPageContent.findFirst()
      
      if (existingContent) {
        await prisma.landingPageContent.update({
          where: { id: existingContent.id },
          data: validation.data
        })
      } else {
        await prisma.landingPageContent.create({
          data: validation.data
        })
      }
    }

    // Update features
    if (features && Array.isArray(features)) {
      for (const feature of features) {
        const validation = featureSchema.safeParse(feature)
        if (!validation.success) continue

        if (feature.id) {
          // Update existing feature
          await prisma.landingPageFeature.update({
            where: { id: feature.id },
            data: validation.data
          })
        } else {
          // Create new feature
          await prisma.landingPageFeature.create({
            data: validation.data
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ التغييرات بنجاح'
    })
  } catch (error) {
    console.error('Error updating landing page content:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
