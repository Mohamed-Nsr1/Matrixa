/**
 * Admin Email Send API
 * POST - Send emails to selected recipients
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const sendSchema = z.object({
  templateId: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  customSubject: z.string().optional(),
  customBody: z.string().optional(),
  recipientFilter: z.enum(['all', 'expired', 'active', 'trial', 'custom'])
})

// Replace template variables in content
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = sendSchema.parse(body)

    // Get recipients based on filter
    let where: any = { role: 'STUDENT' }
    
    if (data.recipientFilter === 'active') {
      // Get users with active subscriptions
      const activeSubscriptions = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true }
      })
      const activeUserIds = activeSubscriptions.map(s => s.userId)
      where.id = { in: activeUserIds }
    } else if (data.recipientFilter === 'trial') {
      const trialSubscriptions = await prisma.subscription.findMany({
        where: { status: 'TRIAL' },
        select: { userId: true }
      })
      const trialUserIds = trialSubscriptions.map(s => s.userId)
      where.id = { in: trialUserIds }
    } else if (data.recipientFilter === 'expired') {
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: { status: 'EXPIRED' },
        select: { userId: true }
      })
      const expiredUserIds = expiredSubscriptions.map(s => s.userId)
      where.id = { in: expiredUserIds }
    } else if (data.recipientFilter === 'custom' && data.recipients) {
      where.id = { in: data.recipients }
    }

    const recipients = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true
      }
    })

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, error: 'No recipients found' }, { status: 400 })
    }

    // Get template if specified
    let template: { id: string; subject: string; subjectAr: string | null; body: string; bodyAr: string | null } | null = null
    let subject = data.customSubject || 'رسالة من Matrixa'
    let emailBody = data.customBody || '<p>رسالة من Matrixa</p>'

    if (data.templateId) {
      template = await prisma.emailTemplate.findUnique({
        where: { id: data.templateId },
        select: { id: true, subject: true, subjectAr: true, body: true, bodyAr: true }
      })
      if (template) {
        subject = template.subjectAr || template.subject
        emailBody = template.bodyAr || template.body
      }
    }

    // Create email logs and simulate sending
    // In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.
    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        // Replace variables
        const variables: Record<string, string> = {
          userName: recipient.fullName || 'طالب',
          userEmail: recipient.email
        }

        const finalSubject = replaceVariables(subject, variables)
        const finalBody = replaceVariables(emailBody, variables)

        // In production, you would send the email here
        // For now, we just log it
        await prisma.emailLog.create({
          data: {
            templateId: template?.id || null,
            userId: recipient.id,
            email: recipient.email,
            userName: recipient.fullName,
            subject: finalSubject,
            body: finalBody,
            status: 'SENT',
            sentAt: new Date()
          }
        })

        sent++
      } catch (emailError) {
        console.error(`Failed to send to ${recipient.email}:`, emailError)
        
        await prisma.emailLog.create({
          data: {
            templateId: template?.id || null,
            userId: recipient.id,
            email: recipient.email,
            userName: recipient.fullName,
            subject: subject,
            body: emailBody,
            status: 'FAILED',
            error: emailError instanceof Error ? emailError.message : 'Unknown error'
          }
        })

        failed++
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent,
      failed,
      total: recipients.length
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
