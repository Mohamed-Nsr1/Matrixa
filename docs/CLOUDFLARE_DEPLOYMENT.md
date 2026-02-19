# Matrixa Cloudflare Production Deployment Guide

> Complete guide for deploying Matrixa to Cloudflare infrastructure

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Step 1: Database Setup](#step-1-database-setup)
5. [Step 2: File Storage Setup (Cloudflare R2)](#step-2-file-storage-setup-cloudflare-r2)
6. [Step 3: Cloudflare Pages Deployment](#step-3-cloudflare-pages-deployment)
7. [Step 4: Environment Variables](#step-4-environment-variables)
8. [Step 5: Domain Configuration](#step-5-domain-configuration)
9. [Step 6: Cron Jobs Setup](#step-6-cron-jobs-setup)
10. [Step 7: PWA Configuration](#step-7-pwa-configuration)
11. [Step 8: Monitoring & Analytics](#step-8-monitoring--analytics)
12. [Troubleshooting](#troubleshooting)
13. [Cost Estimation](#cost-estimation)

---

## Overview

This guide walks you through deploying Matrixa to Cloudflare's edge infrastructure using Cloudflare Pages with advanced features for optimal performance in Egypt and the Middle East region.

### Why Cloudflare?

| Feature | Benefit |
|---------|---------|
| Global Edge Network | Low latency for Egyptian users |
| Free SSL/TLS | Automatic HTTPS with custom certificates |
| DDoS Protection | Enterprise-grade security included |
| Generous Free Tier | Suitable for startups and growing apps |
| R2 Storage | S3-compatible storage without egress fees |
| Workers | Serverless functions for cron jobs |

### Deployment Strategy

Matrixa uses a hybrid deployment approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │   Workers   │  │      R2 Storage         │  │
│  │  (Frontend) │  │ (Cron Jobs) │  │   (Avatars/Receipts)    │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │   Neon/Supabase     │  │      SendGrid/Resend            │  │
│  │   (PostgreSQL)      │  │      (Email Service)            │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Component Overview

| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend Hosting | Cloudflare Pages | Static assets + SSR |
| API Routes | Cloudflare Pages Functions | Serverless API endpoints |
| Database | Neon/Supabase | Managed PostgreSQL |
| File Storage | Cloudflare R2 | User avatars, payment receipts |
| Cron Jobs | Cloudflare Workers | Daily streak checks |
| Email | SendGrid/Resend | Password reset, notifications |
| CDN | Cloudflare | Global content delivery |
| DNS | Cloudflare | Domain management |

### Data Flow

```
User Request → Cloudflare Edge → Pages Function → PostgreSQL (Neon)
                                     ↓
                              R2 Storage (files)
```

---

## Prerequisites

### Required Accounts

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Cloudflare | Hosting, CDN, DNS | Yes (generous) |
| Neon or Supabase | PostgreSQL database | Yes (0.5GB+) |
| GitHub | Code repository | Yes |
| SendGrid or Resend | Email service | Yes (100/day) |

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Build process |
| Bun | 1.0+ | Package manager |
| Git | Latest | Version control |
| Wrangler | 4.0+ | Cloudflare CLI |

### Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### Domain Requirements

- A registered domain name
- Domain added to Cloudflare (free)
- Nameservers pointing to Cloudflare

---

## Step 1: Database Setup

### Option A: Neon (Recommended for Middle East)

Neon offers serverless PostgreSQL with auto-scaling and a generous free tier.

#### Create Neon Project

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project:
   - **Name**: `matrixa-production`
   - **Region**: `AWS Europe (Frankfurt)` - closest to Egypt with good latency
   - **PostgreSQL version**: 16

3. Copy the connection string:
   ```
   postgresql://username:password@ep-xxx.eu-central-2.aws.neon.tech/matrixa?sslmode=require
   ```

#### Configure Connection Pooling

For serverless environments, use connection pooling:

```bash
# Your pooled connection string will look like:
postgresql://username:password@ep-xxx-pooler.eu-central-2.aws.neon.tech/matrixa?sslmode=require
```

#### Initialize Database Schema

```bash
# Set DATABASE_URL in your .env
export DATABASE_URL="postgresql://username:password@ep-xxx-pooler.eu-central-2.aws.neon.tech/matrixa?sslmode=require"

# Push schema
bun run db:push

# Seed initial data (admin user, default badges, etc.)
bun run db:seed
```

### Option B: Supabase

Alternative with additional features like real-time and storage.

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → Database
3. Copy the connection string (use Session pooler mode)
4. Follow the same initialization steps as Neon

### Database Configuration for Production

Create a production-specific Prisma configuration:

```prisma
// prisma/schema.prisma - already configured
// Ensure you have:
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}
```

Set both URLs:
```env
# Pooled connection (for app)
DATABASE_URL="postgresql://...-pooler.neon.tech/matrixa?sslmode=require"

# Direct connection (for migrations)
DIRECT_DATABASE_URL="postgresql://...neon.tech/matrixa?sslmode=require"
```

---

## Step 2: File Storage Setup (Cloudflare R2)

Matrixa uses file storage for:
- User avatars
- Payment receipt images

### Create R2 Bucket

1. Log into Cloudflare Dashboard
2. Go to **R2 Object Storage**
3. Click **Create bucket**
4. Configure:
   - **Bucket name**: `matrixa-uploads`
   - **Location**: Automatic (or choose closest to Egypt)

### Configure Public Access

1. Go to bucket **Settings**
2. Enable **Public access**
3. Note your public URL: `https://pub-xxx.r2.dev`

### Create R2 API Token

1. Go to **R2 → Manage R2 API Tokens**
2. Click **Create API token**
3. Configure:
   - **Name**: `matrixa-app-token`
   - **Permissions**: Object Read & Write
   - **Specify bucket**: `matrixa-uploads`
4. Save the credentials:
   - Access Key ID
   - Secret Access Key

### Configure R2 in Environment Variables

```env
# R2 Storage Configuration
R2_BUCKET_NAME="matrixa-uploads"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
```

### Update File Upload Code

The avatar and payment receipt uploads need to use R2 instead of local filesystem. Add this to your API routes:

```typescript
// lib/r2-storage.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }))
}
```

Install the S3 client:
```bash
bun add @aws-sdk/client-s3
```

---

## Step 3: Cloudflare Pages Deployment

### Prepare Your Repository

1. Push your code to GitHub

2. Create a `wrangler.toml` file in the project root:

```toml
name = "matrixa"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[vars]
NODE_ENV = "production"

# Bindings for R2
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "matrixa-uploads"
```

3. Add `@cloudflare/next-on-pages` for compatibility:

```bash
bun add -D @cloudflare/next-on-pages
```

4. Update `next.config.ts` for Cloudflare compatibility:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone for Cloudflare Pages
  // output: "standalone", // REMOVE THIS LINE
  
  // Enable Edge Runtime compatibility
  experimental: {
    runtime: 'edge',
  },
  
  // Rest of your config...
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Keep your headers configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      // PWA Service Worker
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript' },
        ],
      },
    ]
  },
};

export default nextConfig;
```

### Deploy via Cloudflare Dashboard

1. Log into Cloudflare Dashboard
2. Go to **Workers & Pages**
3. Click **Create application**
4. Select **Pages** → **Connect to Git**
5. Connect your GitHub repository
6. Configure build settings:

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Build command | `bun run build` |
| Build output directory | `.next` |
| Root directory | `/` |

7. Click **Save and Deploy**

### Deploy via Wrangler CLI (Alternative)

```bash
# Build for Cloudflare
bunx @cloudflare/next-on-pages

# Deploy
wrangler pages deploy .vercel/output/static
```

### Troubleshooting Build Issues

If you encounter issues with Prisma in edge runtime:

```typescript
// Add to next.config.ts
const nextConfig: NextConfig = {
  // ... other config
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@prisma/client']
    }
    return config
  },
}
```

---

## Step 4: Environment Variables

### Required Variables

Configure these in Cloudflare Pages Dashboard:

1. Go to your Pages project
2. Click **Settings** → **Environment variables**
3. Add all variables:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# JWT Authentication
JWT_ACCESS_SECRET="your-64-character-access-secret-key"
JWT_REFRESH_SECRET="your-64-character-refresh-secret-key"

# Application
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="Matrixa"
NODE_ENV="production"

# R2 Storage
R2_BUCKET_NAME="matrixa-uploads"
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Email Service (optional but recommended)
SENDGRID_API_KEY="SG.xxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# Cron Jobs
CRON_SECRET="your-secure-random-string-for-cron-auth"

# Payment (Paymob - when ready)
PAYMOB_API_KEY="your-paymob-api-key"
PAYMOB_INTEGRATION_ID="123"
PAYMOB_IFRAME_ID="123"
PAYMOB_HMAC_SECRET="your-hmac-secret"
```

### Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -hex 64

# Generate CRON_SECRET
openssl rand -hex 32
```

### Environment Variable Encryption

For sensitive values, use Cloudflare's secrets:

```bash
# Set secret via Wrangler
wrangler pages secret put JWT_ACCESS_SECRET --project-name=matrixa
wrangler pages secret put JWT_REFRESH_SECRET --project-name=matrixa
wrangler pages secret put SENDGRID_API_KEY --project-name=matrixa
```

---

## Step 5: Domain Configuration

### Add Custom Domain

1. In Cloudflare Pages, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `matrixa.com`)
4. Cloudflare will automatically configure DNS

### Configure Subdomain (Optional)

For different environments:

| Environment | Domain |
|-------------|--------|
| Production | `matrixa.com` or `app.matrixa.com` |
| Staging | `staging.matrixa.com` |

### DNS Configuration

Cloudflare automatically configures DNS records:

```
Type: CNAME
Name: matrixa.com (or www)
Content: matrixa.pages.dev
Proxy: Proxied (orange cloud)
```

### SSL/TLS Configuration

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (Strict)**

This ensures:
- End-to-end encryption
- Origin certificate verification
- Maximum security

### Page Rules for Performance

Add these page rules in Cloudflare:

1. **Cache Static Assets**
   - URL: `matrixa.com/_next/static/*`
   - Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 year

2. **Bypass Cache for API**
   - URL: `matrixa.com/api/*`
   - Settings: Cache Level = Bypass

3. **PWA Service Worker**
   - URL: `matrixa.com/sw.js`
   - Settings: Cache Level = Bypass

---

## Step 6: Cron Jobs Setup

Matrixa requires a daily cron job to check and break inactive streaks.

### Create Cloudflare Worker for Cron

1. Create `workers/streak-check.ts`:

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const response = await fetch(`${env.APP_URL}/api/cron/streak-check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    })
    
    const result = await response.json()
    console.log('Streak check completed:', result)
  },
}

interface Env {
  APP_URL: string
  CRON_SECRET: string
}

interface ScheduledEvent {
  cron: string
}
```

2. Create `workers/wrangler.toml`:

```toml
name = "matrixa-streak-check"
main = "streak-check.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = ["0 0 * * *"]  # Daily at midnight UTC

[vars]
APP_URL = "https://matrixa.com"
```

3. Deploy the worker:

```bash
cd workers
wrangler deploy
```

### Configure Cron Trigger

1. Go to Cloudflare Dashboard → **Workers**
2. Select your worker
3. Go to **Triggers** → **Cron Triggers**
4. Add trigger: `0 0 * * *` (daily at midnight UTC)

For Egypt timezone (UTC+2), adjust as needed:
- `0 22 * * *` - 10 PM UTC = midnight Cairo time

### Alternative: External Cron Service

Use a service like cron-job.org or UptimeRobot:

1. Create free account on cron-job.org
2. Add new cron job:
   - URL: `https://matrixa.com/api/cron/streak-check`
   - Schedule: Daily at midnight
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

---

## Step 7: PWA Configuration

### Update Manifest

Update `public/manifest.json` with production URLs:

```json
{
  "name": "Matrixa - خطط دراستك",
  "short_name": "Matrixa",
  "description": "تطبيق تخطيط الدراسة للطلاب المصريين",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#8b5cf6",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "productivity"],
  "lang": "ar",
  "dir": "rtl"
}
```

### Update Service Worker Cache

Update `public/sw.js` for production caching:

```javascript
const CACHE_NAME = 'matrixa-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API calls
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached response or offline page
        return caches.match(event.request).then((response) => {
          return response || caches.match('/offline');
        });
      })
  );
});
```

### Headers for PWA Files

Add to your `next.config.ts` headers:

```typescript
{
  source: '/manifest.json',
  headers: [
    { key: 'Content-Type', value: 'application/manifest+json' },
    { key: 'Cache-Control', value: 'public, max-age=86400' },
  ],
},
{
  source: '/sw.js',
  headers: [
    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
    { key: 'Content-Type', value: 'application/javascript' },
  ],
},
```

---

## Step 8: Monitoring & Analytics

### Cloudflare Analytics

Cloudflare provides built-in analytics:

1. Go to your Pages project
2. Click **Analytics**
3. View metrics:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Error rates

### Web Analytics Setup

Add Cloudflare Web Analytics:

1. Go to **Analytics & Logs** → **Web Analytics**
2. Add your site
3. Copy the JavaScript snippet
4. Add to `app/layout.tsx`:

```tsx
<Script
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "your-token"}'
  strategy="afterInteractive"
/>
```

### Error Tracking with Sentry

For production error tracking:

```bash
bun add @sentry/nextjs
```

Configure `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: 'production',
})
```

### Uptime Monitoring

Use Cloudflare Health Checks:

1. Go to **Monitoring** → **Health Checks**
2. Create health check:
   - URL: `https://matrixa.com/api/health`
   - Interval: 5 minutes
   - Alert on: Timeout, Failure

Create a simple health endpoint:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

---

## Troubleshooting

### Common Issues

#### 1. Prisma Client Errors in Edge Runtime

**Problem**: Prisma doesn't work natively in Cloudflare Workers

**Solution**: Use Prisma Accelerate or Prisma Data Proxy:

```bash
# Enable Prisma Accelerate
bunx prisma accelerate enable
```

Or use a traditional server deployment (VPS, Railway, Render) for full Node.js compatibility.

#### 2. File Upload Fails

**Problem**: R2 uploads return errors

**Solutions**:
- Verify R2 credentials
- Check bucket permissions
- Ensure CORS is configured

Add CORS policy to R2 bucket:

```json
[
  {
    "AllowedOrigins": ["https://matrixa.com"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

#### 3. Streak Cron Not Running

**Problem**: Cron job doesn't execute

**Solutions**:
- Check Cloudflare Worker logs
- Verify CRON_SECRET matches
- Test endpoint manually:
  ```bash
  curl -H "Authorization: Bearer YOUR_SECRET" https://matrixa.com/api/cron/streak-check
  ```

#### 4. PWA Not Installing

**Problem**: Install prompt doesn't appear

**Solutions**:
- Verify manifest.json is valid
- Check HTTPS is enabled
- Ensure service worker is registered
- Test with Chrome DevTools → Application → Manifest

#### 5. Slow Database Queries

**Problem**: API responses are slow

**Solutions**:
- Enable connection pooling
- Add database indexes
- Use Prisma's query logging:
  ```env
  DATABASE_URL="...?pgbouncer=true&connect_timeout=10"
  ```

### Debugging Commands

```bash
# View Cloudflare Pages logs
wrangler pages deployment tail --project-name=matrixa

# View Worker logs
wrangler tail matrixa-streak-check

# Test database connection
bunx prisma db pull

# Check build output
wrangler pages deployment list --project-name=matrixa
```

---

## Cost Estimation

### Cloudflare Pricing (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Pages | Unlimited requests | $5/mo (Workers Paid) |
| R2 Storage | 10GB storage | $0.015/GB |
| R2 Class A Operations | 1M/month | $4.50/million |
| R2 Class B Operations | 10M/month | $0.36/million |
| Workers (Cron) | 10 triggers/day | $0.50/million |

### Database Pricing (Monthly)

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Neon | 0.5GB, 100 hours compute | $19/mo (Pro) |
| Supabase | 500MB, 5GB bandwidth | $25/mo (Pro) |

### Email Pricing (Monthly)

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| SendGrid | 100 emails/day | $14.95/mo (40k emails) |
| Resend | 3,000 emails | $20/mo (50k emails) |

### Total Estimated Monthly Cost

| Stage | Estimated Cost |
|-------|----------------|
| Launch (0-500 users) | **Free** |
| Growth (500-2000 users) | $20-30/mo |
| Scale (2000+ users) | $50-100/mo |

---

## Deployment Checklist

### Pre-Launch

- [ ] PostgreSQL database created and migrated
- [ ] R2 bucket created and configured
- [ ] Environment variables set
- [ ] JWT secrets generated (64+ characters)
- [ ] Domain configured with SSL
- [ ] Cron job scheduled
- [ ] Email service configured (optional)
- [ ] Admin user created
- [ ] Default badges seeded

### Post-Launch

- [ ] Test user registration flow
- [ ] Test payment flow (manual payment)
- [ ] Test streak system
- [ ] Verify PWA installation
- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Configure backup strategy

### Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] JWT tokens secure
- [ ] Database access restricted
- [ ] API secrets rotated regularly
- [ ] CORS properly configured

---

## Next Steps

After successful deployment:

1. **Monitor Performance**: Use Cloudflare Analytics
2. **User Feedback**: Set up feedback collection
3. **Scale Planning**: Monitor resource usage
4. **Backup Strategy**: Configure database backups
5. **Email Integration**: Implement SendGrid for notifications

---

## Support Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Prisma with Edge Runtimes](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-edge-runtimes)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

*Last updated: 2025-01-19*
*Matrixa Production Deployment Guide*
