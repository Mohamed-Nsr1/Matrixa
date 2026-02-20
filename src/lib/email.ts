/**
 * Email Sending Library
 * 
 * Provides email sending capabilities using SMTP.
 * Used for password reset, notifications, and admin broadcasts.
 */

import nodemailer from 'nodemailer'

// Email configuration interface
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

// Get email configuration from environment
function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return {
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    user,
    pass,
    fromName: process.env.SMTP_FROM_NAME || 'Matrixa',
    fromEmail: process.env.SMTP_FROM_EMAIL || user
  }
}

// Create transporter
function createTransporter() {
  const config = getEmailConfig()
  
  if (!config) {
    return null
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })
}

// Email options interface
interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Send email result
interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email
 * Falls back to logging in development if SMTP not configured
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getEmailConfig()
  
  // If SMTP not configured, log in development
  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[EMAIL DEV] Would send email:', {
        to: options.to,
        subject: options.subject,
        preview: options.text || options.html.substring(0, 100) + '...'
      })
      return { success: true, messageId: `dev-${Date.now()}` }
    }
    
    return { 
      success: false, 
      error: 'SMTP not configured' 
    }
  }

  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      return { success: false, error: 'Failed to create email transporter' }
    }

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    })

    return { 
      success: true, 
      messageId: info.messageId 
    }
  } catch (error) {
    console.error('[EMAIL] Send error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string, 
  token: string,
  userName?: string
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/auth/forgot-password?token=${token}`
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #1a1625; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2d2640; border-radius: 16px; padding: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #8b5cf6; margin: 0; }
        .content { text-align: center; }
        .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
        .code { background: #1a1625; padding: 12px 24px; border-radius: 8px; font-family: monospace; font-size: 18px; display: inline-block; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>📚 Matrixa</h1>
        </div>
        <div class="content">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>مرحباً ${userName || 'عزيزي المستخدم'}،</p>
          <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
          <p>اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
          <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
          <p>أو انسخ هذا الرابط:</p>
          <div class="code">${resetUrl}</div>
          <p style="color: #888; font-size: 14px;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
          <p style="color: #888; font-size: 14px;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Matrixa. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور - Matrixa',
    html,
    text: `إعادة تعيين كلمة المرور\n\nمرحباً ${userName || 'عزيزي المستخدم'}،\n\nاضغط على هذا الرابط لإعادة تعيين كلمة المرور:\n${resetUrl}\n\nهذا الرابط صالح لمدة ساعة واحدة.`
  })
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string,
  trialDays: number = 14
): Promise<SendEmailResult> {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #1a1625; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2d2640; border-radius: 16px; padding: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #8b5cf6; margin: 0; }
        .content { text-align: center; }
        .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; margin: 20px 0; font-weight: bold; }
        .feature { background: #1a1625; padding: 16px; border-radius: 12px; margin: 10px 0; text-align: right; }
        .trial-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>📚 Matrixa</h1>
        </div>
        <div class="content">
          <h2>مرحباً بك في Matrixa! 🎉</h2>
          <p>أهلاً ${userName || 'عزيزي الطالب'}،</p>
          <p>شكراً لانضمامك إلى مجتمعنا! نحن متحمسون جداً لمساعدتك في رحلتك الدراسية.</p>
          
          <div class="trial-badge">✨ ${trialDays} يوم تجربة مجانية</div>
          
          <h3 style="margin-top: 30px;">ماذا يمكنك أن تفعل الآن؟</h3>
          <div class="feature">📅 نظم وقتك بالمخطط الأسبوعي الذكي</div>
          <div class="feature">⏰ استخدم مؤقت بومودورو للتركيز</div>
          <div class="feature">📝 دون ملاحظاتك واربطها بالمواد</div>
          <div class="feature">📊 تتبع تقدمك بالإحصائيات</div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">ابدأ الآن</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Matrixa. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'مرحباً بك في Matrixa! 🎉',
    html,
    text: `مرحباً بك في Matrixa!\n\nأهلاً ${userName || 'عزيزي الطالب'}،\n\nشكراً لانضمامك! لديك ${trialDays} يوم تجربة مجانية.\n\nابدأ الآن: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
  })
}

/**
 * Send subscription expiry warning email
 */
export async function sendExpiryWarningEmail(
  email: string,
  userName: string | undefined,
  daysRemaining: number
): Promise<SendEmailResult> {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #1a1625; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2d2640; border-radius: 16px; padding: 40px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #8b5cf6; margin: 0; }
        .content { text-align: center; }
        .warning { background: #f59e0b20; border: 1px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>📚 Matrixa</h1>
        </div>
        <div class="content">
          <h2>تنبيه: اشتراكك على وشك الانتهاء</h2>
          <p>مرحباً ${userName || 'عزيزي المستخدم'}،</p>
          
          <div class="warning">
            <p style="margin: 0; font-size: 18px;">⏰ باقي <strong>${daysRemaining} يوم</strong> على انتهاء اشتراكك</p>
          </div>
          
          <p>جدد اشتراكك الآن للاستمرار في الاستفادة من جميع المميزات.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription" class="button">تجديد الاشتراك</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Matrixa. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `تنبيه: باقي ${daysRemaining} يوم على انتهاء اشتراكك - Matrixa`,
    html
  })
}

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!getEmailConfig()
}
