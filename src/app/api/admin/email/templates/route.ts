/**
 * Admin Email Templates API
 * GET - List all templates
 * POST - Create new template
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  subjectAr: z.string().optional(),
  body: z.string().min(1),
  bodyAr: z.string().optional(),
  type: z.enum(['GENERAL', 'SUBSCRIPTION', 'ONBOARDING', 'ENGAGEMENT', 'NOTIFICATION']),
  trigger: z.string().optional(),
  isActive: z.boolean().default(true),
  triggerOffset: z.number().optional()
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = templateSchema.parse(body)

    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        subjectAr: data.subjectAr,
        body: data.body,
        bodyAr: data.bodyAr,
        type: data.type as any,
        trigger: data.trigger as any || null,
        isActive: data.isActive,
        triggerOffset: data.triggerOffset
      }
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
