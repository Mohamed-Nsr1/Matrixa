# Matrixa Future Upgrade Guide

> **Last Updated:** January 2025
> **Purpose:** Guide for upgrading mocked/placeholder features to production implementations

---

## Table of Contents

1. [Payment Integration (Paymob)](#1-payment-integration-paymob)
2. [Email Service Integration](#2-email-service-integration)
3. [Push Notifications](#3-push-notifications)
4. [Cron Job Scheduling](#4-cron-job-scheduling)
5. [Rate Limiting (Redis)](#5-rate-limiting-redis)
6. [Offline Mode (Service Worker)](#6-offline-mode-service-worker)
7. [Device Fingerprinting](#7-device-fingerprinting)
8. [File Upload (Profile Pictures)](#8-file-upload-profile-pictures)
9. [Analytics & Tracking](#9-analytics--tracking)
10. [Environment Variables Checklist](#10-environment-variables-checklist)

---

## 1. Payment Integration (Paymob)

### Current Status
Payment flow is mocked. The `/api/payment` route simulates successful payments without actual Paymob API calls.

### Files to Modify

#### `/src/app/api/payment/route.ts`
Replace the mock implementation with actual Paymob integration:

```typescript
// Current mock implementation returns success without payment
// Replace with:

import crypto from 'crypto'

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID!
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!

// Step 1: Authentication Request
async function authenticate() {
  const response = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: PAYMOB_API_KEY })
  })
  const data = await response.json()
  return data.token
}

// Step 2: Order Registration
async function registerOrder(authToken: string, amountCents: number, merchantOrderId: string) {
  const response = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      merchant_order_id: merchantOrderId,
      items: []
    })
  })
  const data = await response.json()
  return data.id
}

// Step 3: Payment Key Request
async function getPaymentKey(
  authToken: string,
  orderId: number,
  amountCents: number,
  userData: { email: string; name: string; phone: string }
) {
  const response = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        first_name: userData.name.split(' ')[0] || 'User',
        last_name: userData.name.split(' ').slice(1).join(' ') || 'User',
        email: userData.email,
        phone_number: userData.phone || '+201000000000',
        country: 'EG',
        city: 'Cairo',
        street: 'NA',
        building: 'NA',
        floor: 'NA',
        apartment: 'NA'
      },
      currency: 'EGP',
      integration_id: PAYMOB_INTEGRATION_ID
    })
  })
  const data = await response.json()
  return data.token
}

// Main payment initiation endpoint
export async function POST(request: Request) {
  // ... implementation using above functions
  // Return payment URL: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`
}
```

#### `/src/app/api/payment/webhook/route.ts`
Implement HMAC verification:

```typescript
function verifyHMAC(data: Record<string, string>, hmacSecret: string): boolean {
  const concatenated = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('')
  
  const calculatedHMAC = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenated)
    .digest('hex')
  
  return calculatedHMAC === data.hmac
}

export async function POST(request: Request) {
  const data = await request.json()
  
  // Verify HMAC
  if (!verifyHMAC(data.obj, PAYMOB_HMAC_SECRET)) {
    return NextResponse.json({ success: false, error: 'Invalid HMAC' }, { status: 400 })
  }
  
  // Process payment callback
  if (data.obj.success) {
    // Update subscription in database
    // Send confirmation email
  }
}
```

### Environment Variables Required
```env
PAYMOB_API_KEY=your_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret
```

### Testing
- Use Paymob's sandbox environment for development
- Test cards: https://docs.paymob.com/docs/test-cards

---

## 2. Email Service Integration

### Current Status
Email sending is mocked. Functions exist but don't send real emails.

### Files to Modify

#### Create `/src/lib/email.ts`
```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"Matrixa" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    })
    return { success: true }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}

// Email templates
export function getPasswordResetEmail(resetUrl: string, userName: string) {
  return {
    subject: 'إعادة تعيين كلمة المرور - Matrixa',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>مرحباً ${userName}</h2>
        <p>لقد طلبت إعادة تعيين كلمة المرور.</p>
        <a href="${resetUrl}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          إعادة تعيين كلمة المرور
        </a>
        <p>هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
      </div>
    `
  }
}

export function getWaitlistInviteEmail(inviteCode: string, userName: string) {
  return {
    subject: 'دعوة إلى Matrixa! - Matrixa',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>مرحباً ${userName}</h2>
        <p>تهانينا! تمت دعوتك للانضمام إلى Matrixa.</p>
        <p>كود الدعوة: <strong>${inviteCode}</strong></p>
        <a href="https://matrixa.app/auth/register?code=${inviteCode}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          ابدأ الآن
        </a>
      </div>
    `
  }
}

export function getStudyReminderEmail(userName: string, tasks: string[]) {
  return {
    subject: 'تذكير: حان وقت المذاكرة! - Matrixa',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>مرحباً ${userName}</h2>
        <p>لديك مهام مجدولة لليوم:</p>
        <ul>
          ${tasks.map(t => `<li>${t}</li>`).join('')}
        </ul>
        <a href="https://matrixa.app/dashboard" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          ابدأ المذاكرة
        </a>
      </div>
    `
  }
}
```

#### Update `/src/app/api/auth/forgot-password/route.ts`
```typescript
import { sendEmail, getPasswordResetEmail } from '@/lib/email'

// After creating reset token:
const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
const { subject, html } = getPasswordResetEmail(resetUrl, user.fullName || user.email)
await sendEmail({ to: user.email, subject, html })
```

#### Update Waitlist Invite Logic
```typescript
// In admin invites page or automated job:
import { sendEmail, getWaitlistInviteEmail } from '@/lib/email'

async function sendWaitlistInvite(email: string, inviteCode: string) {
  const { subject, html } = getWaitlistInviteEmail(inviteCode, email)
  await sendEmail({ to: email, subject, html })
}
```

### Environment Variables Required
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NEXT_PUBLIC_APP_URL=https://matrixa.app
```

### Alternative: Resend
```typescript
import Resend from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }: EmailOptions) {
  await resend.emails.send({
    from: 'Matrixa <noreply@matrixa.app>',
    to,
    subject,
    html
  })
}
```

---

## 3. Push Notifications

### Current Status
Web Push is not implemented. Database has `pushSubscription` field placeholder.

### Implementation Steps

#### Create `/src/lib/push-notifications.ts`
```typescript
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:support@matrixa.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; icon?: string; data?: any }
) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { success: true }
  } catch (error) {
    console.error('Push notification failed:', error)
    return { success: false, error }
  }
}
```

#### Add to Prisma Schema
```prisma
model User {
  // ... existing fields
  pushSubscription String? // JSON string of PushSubscription
}
```

#### Create `/src/app/api/push/subscribe/route.ts`
```typescript
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await request.json()
  
  await prisma.user.update({
    where: { id: user.id },
    data: { pushSubscription: JSON.stringify(subscription) }
  })

  return NextResponse.json({ success: true })
}
```

#### Frontend Opt-in (Add to settings or dashboard)
```typescript
// In a client component:
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  })
  
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription)
  })
}
```

### Environment Variables Required
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

---

## 4. Cron Job Scheduling

### Current Status
Cron endpoint exists at `/api/cron/streak-check` but requires external trigger.

### Options for Scheduling

#### Option A: Vercel Cron Jobs (Recommended for Vercel)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/streak-check",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/waitlist-invites",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### Option B: External Cron Service (cron-job.org, EasyCron)
Set up HTTP requests to:
- `https://your-domain.com/api/cron/streak-check` - Daily at midnight
- `https://your-domain.com/api/cron/waitlist-invites` - Every 6 hours

#### Option C: GitHub Actions
```yaml
# .github/workflows/cron.yml
name: Cron Jobs
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
jobs:
  streak-check:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X GET ${{ secrets.APP_URL }}/api/cron/streak-check
```

### Add Authorization to Cron Endpoints
```typescript
// In each cron route:
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 5. Rate Limiting (Redis)

### Current Status
Rate limiting uses in-memory storage (`Map`). Won't work across multiple instances.

### Files to Modify

#### `/src/lib/rate-limit.ts`
Replace with Redis-based implementation:

```typescript
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config
  
  return {
    async check(request: NextRequest): Promise<{ success: true } | { success: false; response: NextResponse }> {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      const redisKey = `ratelimit:${key}`
      
      // Get current count
      const current = await redis.incr(redisKey)
      
      // Set expiry on first request
      if (current === 1) {
        await redis.expire(redisKey, Math.ceil(windowMs / 1000))
      }
      
      if (current > maxRequests) {
        const ttl = await redis.ttl(redisKey)
        return {
          success: false,
          response: NextResponse.json(
            { success: false, error: `تم تجاوز عدد المحاولات. حاول بعد ${ttl} ثانية` },
            { status: 429, headers: { 'Retry-After': ttl.toString() } }
          )
        }
      }
      
      return { success: true }
    }
  }
}
```

### Environment Variables Required
```env
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Alternative: Redis Labs
```typescript
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL
})
await redis.connect()
```

---

## 6. Offline Mode (Service Worker)

### Current Status
Service worker exists at `/public/sw.js` but doesn't cache API responses.

### Enhanced Service Worker
```javascript
// /public/sw.js
const CACHE_NAME = 'matrixa-v2'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Cache strategies
const CACHE_STRATEGIES = {
  networkFirst: ['/api/'],
  cacheFirst: ['/icons/', '/fonts/'],
  staleWhileRevalidate: ['/']
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url)
  
  // Network first for API calls
  if (pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }
  
  // Stale while revalidate for pages
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone())
          })
        }
        return response
      })
      return cached || fetchPromise
    })
  )
})
```

### IndexedDB for Offline Data
```typescript
// /src/lib/offline-db.ts
import { openDB } from 'idb'

export const db = await openDB('matrixa-offline', 1, {
  upgrade(db) {
    db.createObjectStore('tasks', { keyPath: 'id' })
    db.createObjectStore('notes', { keyPath: 'id' })
    db.createObjectStore('progress', { keyPath: 'lessonId' })
  }
})

export async function saveOfflineData(store: string, data: any) {
  await db.put(store, data)
}

export async function getOfflineData(store: string) {
  return db.getAll(store)
}

export async function syncOfflineData() {
  const offlineTasks = await getOfflineData('tasks')
  for (const task of offlineTasks) {
    await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    })
  }
  await db.clear('tasks')
}
```

---

## 7. Device Fingerprinting

### Current Status
Basic fingerprinting using `navigator.userAgent`.

### Enhanced Fingerprinting
```typescript
// /src/lib/fingerprint.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs'

export async function getDeviceFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load()
  const result = await fp.detect()
  
  // Combine multiple signals
  const components = {
    visitorId: result.visitorId,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchSupport: 'ontouchstart' in window,
    colorDepth: screen.colorDepth,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency
  }
  
  return JSON.stringify(components)
}
```

### Server-side Verification
```typescript
// In auth routes:
const clientFingerprint = request.headers.get('x-device-fingerprint')
const storedFingerprint = user.deviceFingerprint

if (clientFingerprint !== storedFingerprint) {
  // Require re-authentication or send security alert
  await sendEmail({
    to: user.email,
    subject: 'تسجيل دخول من جهاز جديد',
    html: 'تم اكتشاف تسجيل دخول من جهاز جديد...'
  })
}
```

---

## 8. File Upload (Profile Pictures)

### Current Status
Avatar URL field exists but no upload functionality.

### Implementation with Cloudflare R2
```typescript
// /src/app/api/upload/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
  }
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
  }
  
  const buffer = await file.arrayBuffer()
  const key = `avatars/${Date.now()}-${file.name}`
  
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
    Key: key,
    Body: Buffer.from(buffer),
    ContentType: file.type
  }))
  
  const url = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
  
  // Update user avatar
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: url }
  })
  
  return NextResponse.json({ success: true, url })
}
```

### Environment Variables Required
```env
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET=matrixa-uploads
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.matrixa.app
```

---

## 9. Analytics & Tracking

### Current Status
Basic analytics exist but no external tracking.

### Google Analytics 4
```typescript
// /src/app/layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

### Custom Events
```typescript
// /src/lib/analytics.ts
export function trackEvent(name: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, params)
  }
}

// Usage:
trackEvent('focus_session_completed', { duration: 25, subject: 'physics' })
trackEvent('task_completed', { task_type: 'VIDEO' })
trackEvent('subscription_started', { plan: 'monthly' })
```

---

## 10. Environment Variables Checklist

Create a `.env.example` file:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Payment (Paymob)
PAYMOB_API_KEY=""
PAYMOB_INTEGRATION_ID=""
PAYMOB_IFRAME_ID=""
PAYMOB_HMAC_SECRET=""

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# File Upload (Cloudflare R2)
CLOUDFLARE_R2_ENDPOINT=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET=""
CLOUDFLARE_R2_PUBLIC_URL=""

# Cron Jobs
CRON_SECRET="your-cron-secret-for-auth"

# Analytics
NEXT_PUBLIC_GA_ID=""

# Feature Flags
ENABLE_SUBSCRIPTIONS="true"
ENABLE_WAITLIST="true"
MAINTENANCE_MODE="false"
```

---

## Quick Reference: Production Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Generate new JWT secrets
- [ ] Configure Paymob account and get credentials
- [ ] Set up SMTP or Resend for emails
- [ ] Configure Redis for rate limiting
- [ ] Set up cron job triggers (Vercel Cron / external)
- [ ] Generate VAPID keys for push notifications
- [ ] Configure Cloudflare R2 for file uploads
- [ ] Add Google Analytics tracking ID
- [ ] Enable HTTPS and configure CORS
- [ ] Test all payment flows in sandbox mode
- [ ] Review security headers

---

*This guide is maintained alongside the codebase. Update when adding new integrations.*

---

## 11. Gamification Badges System

### Current Status
Badge models and UI are implemented. Badges are stored in the database and displayed in the settings page.

### Features Implemented
- Badge model with types (STREAK, TASKS, FOCUS, SUBJECTS, SPECIAL)
- Badge rarities (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
- UserBadge model for tracking earned badges
- Badges API (`/api/badges`) for fetching user badges with progress
- Admin API (`/api/admin/badges`) for managing badges
- BadgesSection component in settings page

### Seeding Default Badges
Call the PUT endpoint on `/api/admin/badges` as an admin to seed default badges:
```bash
curl -X PUT https://your-domain.com/api/admin/badges \
  -H "Cookie: accessToken=your_admin_token"
```

### Files to Modify for Enhancement

#### Add Badge Earning Logic
Create `/src/lib/badge-awarding.ts`:
```typescript
import { prisma } from './db'

export async function checkAndAwardBadges(userId: string) {
  const userStats = await getUserStats(userId)
  const allBadges = await prisma.badge.findMany({ where: { isActive: true } })
  
  for (const badge of allBadges) {
    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } }
    })
    
    if (existing?.isCompleted) continue
    
    let progress = 0
    let completed = false
    
    switch (badge.type) {
      case 'STREAK':
        progress = userStats.currentStreak
        completed = progress >= badge.requirement
        break
      case 'TASKS':
        progress = userStats.tasksCompleted
        completed = progress >= badge.requirement
        break
      case 'FOCUS':
        progress = userStats.focusSessions
        completed = progress >= badge.requirement
        break
    }
    
    if (completed && !existing) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          progress,
          isCompleted: true
        }
      })
      
      // Send notification
      // Award XP
      await prisma.leaderboardEntry.update({
        where: { userId },
        data: { score: { increment: badge.xpReward } }
      })
    } else if (existing && !existing.isCompleted) {
      await prisma.userBadge.update({
        where: { id: existing.id },
        data: { progress }
      })
    }
  }
}
```

#### Add to Task/Focus Completion
```typescript
// In /src/app/api/tasks/[id]/complete/route.ts
import { checkAndAwardBadges } from '@/lib/badge-awarding'

// After marking task complete:
await checkAndAwardBadges(user.id)
```

### Badge Icons
Currently using emoji icons. For custom icons:
```typescript
// Add icon field as URL or icon name
icon: '/badges/streak-7.svg' // or 'flame' for Lucide icon
```

### Future Enhancements
- Badge animations on earn
- Share badges to social media
- Badge-based leaderboard bonuses
- Seasonal/special event badges
