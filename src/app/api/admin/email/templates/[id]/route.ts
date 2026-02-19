/**
 * Admin Email Template by ID API
 * PUT - Update template
 * DELETE - Delete template
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = templateSchema.parse(body)

    // Check if template is a system template
    const existing = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    if (existing.isSystem) {
      return NextResponse.json({ success: false, error: 'Cannot modify system templates' }, { status: 400 })
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
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
    console.error('Update template error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if template is a system template
    const existing = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    if (existing.isSystem) {
      return NextResponse.json({ success: false, error: 'Cannot delete system templates' }, { status: 400 })
    }

    await prisma.emailTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
