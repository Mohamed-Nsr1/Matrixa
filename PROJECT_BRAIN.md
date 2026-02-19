# Matrixa - Project Brain

> **Last Updated:** 2025-01-19
> **Version:** 1.6.0
> **Status:** Production-Ready

---

## Table of Contents

1. [Product Identity](#product-identity)
2. [Target Audience](#target-audience)
3. [Core Problems Solved](#core-problems-solved)
4. [Business Model](#business-model)
5. [Main User Flows](#main-user-flows)
6. [System Architecture](#system-architecture)
7. [Non-Negotiable Product Rules](#non-negotiable-product-rules)
8. [Technical Constraints](#technical-constraints)
9. [How to Modify Safely](#how-to-modify-safely)

---

## Product Identity

**Matrixa** is a production-ready SaaS platform designed specifically for Egyptian high school (Thanaweya Amma) students who struggle with ADHD, time blindness, and study overwhelm. It provides a calm, structured, and distraction-free environment for academic planning and focused study sessions.

### Core Philosophy

1. **Calm** - The app feels peaceful and non-overwhelming
2. **Structured** - Everything has its place and purpose
3. **Distraction-free** - Remove barriers between student and study
4. **Fast** - No lag, no loading, no friction
5. **Visually Soothing** - Colors, spacing, and animations that calm the mind
6. **Psychologically Supportive** - No guilt, no shame, just honest feedback

### Key Differentiators

- **Arabic-First Design**: Full RTL support with Arabic as the primary UI language
- **Egyptian Curriculum-Aligned**: Supports Scientific and Literary branches
- **Private Lessons Integration**: Unique feature for Egyptian students attending centers (سناتر)
- **ADHD-Friendly UX**: Clear visual timers, minimal distractions, focus mode

---

## Target Audience

### Primary Users: Egyptian High School Students

- **Age Range**: 15-18 years old
- **Context**: Thanaweya Amma (final high school years)
- **Pain Points**:
  - Time blindness during study sessions
  - Overwhelm from unstructured study materials
  - Difficulty tracking progress across multiple subjects
  - Managing both self-study and private lessons schedules

### Secondary Users: Parents

- Want to support their children's study habits
- May monitor progress (future feature)
- Purchase subscriptions on behalf of students

### Admin Users: Platform Administrators

- Manage curriculum content
- Control subscription system
- Monitor platform analytics
- Manage invite codes and user access

---

## Core Problems Solved

### 1. ADHD Time Blindness
**Problem**: Students lose track of time while studying, leading to ineffective sessions and anxiety.

**Solution**: 
- Visual Pomodoro timer in Focus Mode
- Session progress markers (videos watched, questions solved, revisions completed)
- Clear time indicators throughout the app
- Streak system for daily motivation

### 2. "What Should I Study Now?" Paralysis
**Problem**: Students don't know where to start or what to prioritize.

**Solution**:
- Weekly planner with drag-and-drop task scheduling
- Today's tasks view on dashboard
- Subject progress tracking
- Clear visual hierarchy of pending work

### 3. Overwhelm from Unstructured Study
**Problem**: Students feel overwhelmed by the volume of material.

**Solution**:
- Curriculum broken into Branch → Subject → Unit → Lesson hierarchy
- Progress tracking at each level (Video/Questions/Revision markers)
- Daily study goal setting during onboarding
- Visual progress indicators

### 4. Private Lessons Chaos
**Problem**: Egyptian students juggle private lessons and centers (سناتر) with their self-study.

**Solution**:
- Dedicated Private Lessons management
- Weekly schedule combining self-study tasks and external lessons
- Color-coded distinction between task types
- Multi-day recurring lesson support

---

## Business Model

### Type: Monthly Paid Subscription (SaaS)

| Plan | Price (EGP) | Duration | Features |
|------|-------------|----------|----------|
| Monthly | 99 | 30 days | Full access |
| Quarterly | 249 | 90 days | Full access, most popular |
| Annual | 799 | 365 days | Full access, best value |

### Access Model

- **Invite-Only Registration**: Configurable by admin
- **Trial Period**: 14 days free trial (configurable)
- **One Device Per Session**: Security measure that invalidates old sessions

### Target Scale

- 10,000+ concurrent users
- Designed for SQLite in development, PostgreSQL in production

---

## Main User Flows

### Student Registration Flow

```
Landing Page → Register → Enter Invite Code → Email/Password
     ↓
Onboarding (8 steps):
  1. Welcome Screen
  2. Study Language (Arabic/English)
  3. Full Name Input
  4. Branch Selection (Scientific/Literary)
  5. Specialization (if Scientific: Science/Math)
  6. Second Language (French/German)
  7. Daily Study Goal (minutes)
  8. Completion Summary
     ↓
Dashboard (Today View)
```

### Daily Study Flow

```
Dashboard → View Today's Tasks
     ↓
Select Task → Focus Mode
     ↓
Pomodoro Timer (25/45/60 min)
     ↓
Mark Progress (Video/Questions/Revision)
     ↓
Complete Session → Update Streak & Leaderboard
     ↓
View Insights → Track Progress
```

### Weekly Planning Flow

```
Planner → Select Week
     ↓
Add Tasks (drag & drop)
     ↓
Link to Subject/Lesson (optional)
     ↓
Set Duration & Type
     ↓
Save → View in Weekly Grid
```

### Admin Management Flow

```
Admin Dashboard → System Overview (Stats)
     ↓
Navigate to:
  - Users: View, edit, ban, reset password, impersonate
  - Curriculum: CRUD Branches, Subjects, Units, Lessons; Import/Export
  - Invites: Create, manage, track usage
  - Subscriptions: Manage plans, toggle features
  - Settings: Feature flags, trial controls, test mode, maintenance mode
  - Analytics: User lifecycle, DAU/WAU/MAU, engagement metrics
  - Audit Logs: View all admin actions with IP tracking
  - Announcements: Create, schedule, manage banners
  - Leaderboard: Hide/show students, reset scores
  - Streaks: View, edit, reset user streaks
```

---

## System Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Lucide Icons |
| Backend | Next.js API Routes, Prisma ORM |
| Database | SQLite (dev) / PostgreSQL (production) |
| Authentication | JWT (access + refresh tokens), bcrypt |
| State | React Query, Zustand |
| PWA | Service Worker, manifest.json |

### Key Architectural Decisions

1. **Single Application**: Frontend and backend in one Next.js app (not monorepo)
2. **API Routes**: All backend logic in `/src/app/api/`
3. **Prisma ORM**: Type-safe database access with migrations
4. **Edge-Compatible Middleware**: JWT verification without Prisma
5. **Cookie-Based Auth**: HttpOnly cookies for token storage

### Directory Structure

```
matrixa/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Initial data seeding
├── public/
│   ├── manifest.json      # PWA manifest
│   └── icons/             # App icons
├── src/
│   ├── app/
│   │   ├── api/           # API routes (backend)
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── logout/
│   │   │   │   ├── refresh/
│   │   │   │   ├── me/
│   │   │   │   └── forgot-password/
│   │   │   ├── admin/     # Admin-only endpoints
│   │   │   │   ├── users/
│   │   │   │   ├── curriculum/
│   │   │   │   ├── invites/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── plans/
│   │   │   │   ├── settings/
│   │   │   │   ├── stats/
│   │   │   │   ├── analytics/
│   │   │   │   ├── audit-logs/
│   │   │   │   ├── announcements/
│   │   │   │   ├── leaderboard/
│   │   │   │   ├── streaks/
│   │   │   │   ├── badges/
│   │   │   │   ├── email/     # Email tool API
│   │   │   │   └── impersonate/
│   │   │   ├── tasks/     # Task management
│   │   │   ├── notes/     # Notes system
│   │   │   ├── focus-sessions/
│   │   │   ├── insights/
│   │   │   ├── subscription/
│   │   │   ├── user/      # User settings, avatar, password
│   │   │   ├── announcements/
│   │   │   ├── badges/
│   │   │   ├── planner/
│   │   │   ├── payment/
│   │   │   │   └── manual/
│   │   │   └── push/
│   │   ├── admin/         # Admin panel pages
│   │   │   ├── page.tsx   # Dashboard
│   │   │   ├── users/
│   │   │   ├── curriculum/
│   │   │   ├── invites/
│   │   │   ├── subscriptions/
│   │   │   ├── plans/
│   │   │   ├── settings/
│   │   │   ├── analytics/
│   │   │   ├── audit-logs/
│   │   │   ├── announcements/
│   │   │   ├── leaderboard/
│   │   │   ├── streaks/
│   │   │   ├── manual-payments/
│   │   │   ├── email/     # Email tool
│   │   │   └── error.tsx  # Error boundary
│   │   ├── access-denied/ # Access denied page
│   │   ├── auth/          # Authentication pages
│   │   │   ├── login/
│   │   │   └── forgot-password/
│   │   ├── dashboard/     # Student dashboard
│   │   │   └── error.tsx
│   │   ├── focus/         # Focus mode + history
│   │   │   └── error.tsx
│   │   ├── insights/      # Analytics page
│   │   ├── notes/         # Notes page
│   │   │   └── error.tsx
│   │   ├── onboarding/    # Onboarding flow
│   │   ├── planner/       # Weekly planner
│   │   │   └── error.tsx
│   │   ├── subjects/      # Subjects hub
│   │   ├── subscription/  # Subscription management
│   │   │   └── history/
│   │   ├── settings/      # User settings
│   │   │   └── error.tsx
│   │   ├── privacy/       # Privacy policy
│   │   ├── terms/         # Terms of service
│   │   ├── maintenance/   # Maintenance page
│   │   ├── error.tsx      # Root error boundary
│   │   └── layout.tsx     # Root layout
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── tasks/         # Task components
│   │   ├── notes/         # Notes components
│   │   ├── focus/         # Focus mode components
│   │   ├── admin/         # Admin components
│   │   │   └── AdminLayout.tsx
│   │   ├── announcements/
│   │   │   └── AnnouncementBanner.tsx
│   │   ├── badges/
│   │   │   └── BadgesSection.tsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   │   └── use-theme.tsx  # Theme toggle hook
│   ├── lib/
│   │   ├── auth.ts        # Authentication logic
│   │   ├── auth-edge.ts   # Edge-compatible auth
│   │   ├── db.ts          # Prisma client
│   │   ├── subscription.ts # Subscription helpers
│   │   ├── rate-limit.ts  # Rate limiting utility
│   │   ├── streak.ts      # Streak service
│   │   ├── curriculum-export.ts # Export utilities
│   │   ├── curriculum-import.ts # Import utilities
│   │   ├── env.ts         # Environment validation
│   │   └── utils.ts       # Utility functions
│   └── types/             # TypeScript type definitions
│       └── index.ts       # Shared types (NoteFrontend, TaskFrontend)
├── PROJECT_BRAIN.md       # This file
├── FEATURES_CHECKLIST.md  # Feature tracking
├── FUTURE_UPGRADE_GUIDE.md # Integration guides
└── worklog.md             # Development history
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────→│  API Route  │────→│   Prisma    │
│  (Browser)  │←────│ (Next.js)   │←────│   (ORM)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cookies   │     │    JWT      │     │  Database   │
│ (HttpOnly)  │     │  Tokens     │     │  (SQLite)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Non-Negotiable Product Rules

### Security Rules

| Rule | Description |
|------|-------------|
| Password Hashing | **NEVER** store passwords in plain text - always use bcrypt (12 rounds) |
| JWT Secrets | **NEVER** expose JWT secrets in client-side code |
| Input Validation | **ALWAYS** validate and sanitize all user inputs |
| SQL Injection | **ALWAYS** use Prisma for database queries |
| Rate Limiting | **SHOULD** implement rate limiting on auth routes (future) |

### Business Rules

| Rule | Description |
|------|-------------|
| Invite-Only | Registration requires valid invite code (admin can toggle) |
| One Device | New login invalidates old session (single device per user) |
| Subscription | Trial period followed by paid subscription required |
| Admin Bypass | Admins skip onboarding and subscription checks |

### UI/UX Rules

| Rule | Description |
|------|-------------|
| Dark Mode | The app is always dark-themed (default and only mode) |
| RTL Support | Full right-to-left layout support for Arabic |
| Mobile-First | Design for mobile, scale up for desktop |
| No Glassmorphism | Clean, fast design without heavy visual effects |
| Calm Colors | Violet, cyan, green gradients - no harsh colors |

### Data Rules

| Rule | Description |
|------|-------------|
| Curriculum | Admin-controlled, not hardcoded |
| Notes | Database entities, not text files |
| Progress | Persistent, stored in database |
| Soft Deletes | Preferred for user data preservation |

---

## Technical Constraints

### Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Score | > 90 |

### Scalability Considerations

- Database indexes on frequently queried fields
- Efficient pagination for large lists
- Client-side caching with React Query
- Edge-compatible middleware for fast auth checks

### Browser Support

| Browser | Versions |
|---------|----------|
| Chrome | Last 2 versions |
| Safari | Last 2 versions |
| Firefox | Last 2 versions |
| Mobile | iOS Safari, Chrome Android |

---

## How to Modify Safely

### For AI Assistants

1. **Read This File First**: Always understand the context before making changes.

2. **Check Database Schema**: All models are in `/prisma/schema.prisma`. Any new features requiring data must add models here first.

3. **Follow API Patterns**: New API routes should follow existing patterns in `/src/app/api/`.

4. **Respect Role-Based Access**: Always check user role before allowing admin operations.

5. **Maintain RTL Support**: Any new UI components must support right-to-left layout.

6. **Keep It Type-Safe**: Use TypeScript types from `/src/types/` or create new ones.

7. **Test Auth Middleware**: Any new protected routes must use the auth middleware.

8. **Update Documentation**: If adding new features, update this file and relevant docs.

### Critical Files (Modify with Caution)

```
/prisma/schema.prisma      - Database schema
/src/lib/auth.ts           - Authentication logic
/src/lib/auth-edge.ts      - Edge-compatible auth
/src/middleware.ts         - Route protection
/src/app/api/auth/         - Auth endpoints
/src/app/api/admin/        - Admin-only endpoints
```

### Safe-to-Modify Areas

```
/src/components/ui/        - UI components (shadcn/ui)
/src/app/dashboard/        - Student dashboard
/src/app/focus/            - Focus mode pages
/src/app/notes/            - Notes pages
/src/app/planner/          - Planner pages
/src/app/subjects/         - Subjects pages
/src/lib/utils.ts          - Utility functions
```

### Adding New Features

1. **Database Changes**:
   ```bash
   # 1. Update prisma/schema.prisma
   # 2. Push changes
   npm run db:push
   # 3. Regenerate Prisma client
   npm run db:generate
   ```

2. **API Routes**:
   ```typescript
   // Follow existing patterns
   export async function GET(request: NextRequest) {
     const user = await getCurrentUser()
     if (!user) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
     }
     // ... implementation
   }
   ```

3. **UI Components**:
   - Use shadcn/ui components from `/src/components/ui/`
   - Support RTL with `dir="rtl"` on parent containers
   - Use dark theme colors only

---

## Feature Flags System

The system uses a `SystemSettings` table for feature flags:

| Flag | Description | Default |
|------|-------------|---------|
| `inviteOnlyMode` | Registration requires invite code | `true` |
| `subscriptionEnabled` | Subscriptions are required | `true` |
| `trialEnabled` | Free trial available | `true` |
| `trialDays` | Length of trial period | `14` |
| `leaderboardEnabled` | Leaderboard visible | `true` |
| `testMode` | Payment in test mode | `true` |
| `maintenanceMode` | Site in maintenance mode | `false` |
| `gracePeriodDays` | Days after subscription end with full access | `7` |
| `enableSignInRestriction` | Block login after grace period | `false` |
| `signInRestrictionDays` | Days after expiry to block login | `30` |
| `expiredTimetableDays` | Days visible in planner for expired users | `5` |
| `expiredNotesLimit` | Notes visible for expired users | `20` |
| `expiredFocusSessionsLimit` | Focus sessions visible for expired users | `10` |
| `expiredPrivateLessonsLimit` | Private lessons visible for expired users | `5` |
| `manualPaymentEnabled` | Enable manual payment via mobile wallets | `false` |
| `vodafoneCashEnabled` | Enable Vodafone Cash | `false` |
| `etisalatCashEnabled` | Enable Etisalat Cash | `false` |
| `orangeCashEnabled` | Enable Orange Cash | `false` |
| `instaPayEnabled` | Enable InstaPay | `false` |

---

## Subscription Expiration System

### Subscription Lifecycle

```
Active Subscription
       ↓
Expires
       ↓
Grace Period (7 days default) - Full access
       ↓
Read-Only Mode - Limited viewing
       ↓
Sign-in Restriction (optional) - Access denied
```

### Read-Only Mode Features

When a user's subscription expires (after grace period):

1. **View-Only Access**: Users can see their existing data but cannot:
   - Create new tasks
   - Edit notes
   - Start focus sessions
   - Add private lessons

2. **Feature Limits**: Admins configure how much expired users can see:
   - **Timetable**: Only X days ahead (default: 5)
   - **Notes**: Only X notes visible (default: 20)
   - **Focus Sessions**: Only X sessions in history (default: 10)
   - **Private Lessons**: Only X lessons visible (default: 5)

3. **Visual Indicators**: Warning banners on all pages with renewal prompt

### Sign-in Restriction

Admins can optionally block login completely after a set period:
- Redirects to `/access-denied` page
- Shows subscription plans for renewal
- Preserves user data for when they renew

### Admin Email Tool

Automated and manual email capabilities:

**Triggers Available:**
- `TRIAL_STARTED` - Welcome to trial
- `TRIAL_ENDING` - Trial ending soon
- `TRIAL_EXPIRED` - Trial ended
- `SUBSCRIPTION_ACTIVE` - Payment confirmed
- `SUBSCRIPTION_ENDING` - Renewal reminder
- `SUBSCRIPTION_EXPIRED` - Subscription ended
- `GRACE_PERIOD_STARTED` - Grace period active
- `GRACE_PERIOD_ENDING` - Grace period ending
- `ACCESS_DENIED` - Login blocked
- `PAYMENT_SUCCESS` / `PAYMENT_FAILED`
- `WELCOME` - New user

**Features:**
- Arabic and English content support
- Variable substitution (userName, subscriptionEnd, etc.)
- Recipient filtering (all, active, trial, expired)
- Email logs with status tracking

### Admin Controls

Admins have full control ("King Mode") over:
- **User Management**: Ban/unban, reset passwords, impersonate users
- **Subscription Control**: Toggle features per plan using toggle switches
- **Trial Settings**: Enable/disable trial, set duration
- **Test Mode**: Toggle test mode for payments
- **Maintenance Mode**: Enable/disable for non-admin users
- **Audit Logs**: View all system actions with IP tracking
- **Announcements**: Create, schedule, and manage announcements
- **Streak Management**: View, edit, reset any user's streak
- **Leaderboard**: Hide/show students, reset scores
- **Curriculum**: Full CRUD with import/export (XLSX, CSV, JSON)
- **Email Tool**: Create templates, send emails, track logs
- **Subscription Expiration**: Configure grace period and sign-in restrictions
- **Feature Limits**: Set viewing limits for expired users
- **Badges Management**: Create, edit, and manage achievement badges
- **Manual Payments**: Review, approve/reject payment requests, send follow-up messages

---

## Engagement Systems

### Streak System

- Tracked daily per user
- Breaks if no activity for 24 hours
- Visual indicator in header
- Updates on task completion and focus sessions

### Leaderboard System

- Opt-in (student chooses to appear)
- Score based on: Study minutes, Tasks completed, Focus sessions
- Admin can: Enable/disable, hide students, reset rankings

### Badges System

Achievement-based gamification:

**Badge Types:**
- `STREAK` - Streak achievements (7-day, 30-day, 100-day)
- `TASKS` - Task completion milestones
- `FOCUS` - Focus session achievements
- `SUBJECTS` - Subject mastery badges
- `SPECIAL` - Special achievements

**Badge Rarities:**
- Common, Uncommon, Rare, Epic, Legendary

**Features:**
- Progress tracking for each badge
- XP rewards for earning badges
- Admin can create and manage badges
- Displayed in user profile

---

## Notes Organization

### Folders

- Nested folder structure for organizing notes
- Color coding and icons
- Note count per folder
- Drag-and-drop reordering

### Tags

- Tag system for cross-folder organization
- Color coding
- Note count per tag
- Quick filtering

### Templates

Pre-built note templates:

- **General** - Basic note structure
- **Cornell** - Cornell Notes method (Cues, Notes, Summary)
- **Mind Map** - Hierarchical mind map structure
- **Summary** - Key points summary template
- **Flashcard** - Question/Answer format
- **Study Guide** - Comprehensive study guide structure

---

## Curriculum Structure

```
Branch (Scientific/Literary)
└── Subject (e.g., Arabic, Math, Physics)
    └── Unit (e.g., Unit 1: Algebra)
        └── Lesson (e.g., Lesson 1: Equations)
```

Each entity has:
- `nameAr` - Arabic name (primary)
- `nameEn` - English name
- `order` - Display order
- `description` - Optional description

---

## Payment Integration

The system supports two payment methods:

### Paymob Integration (Automated)

The system is ready for Paymob integration:

- Payment intent creation endpoint: `/api/payment`
- Webhook handler: `/api/payment/webhook`
- Subscription lifecycle management
- Admin test/live mode toggle
- Access denied page with payment flow

Currently uses mock payment flow for testing.

### Manual Payment System (Production-Ready)

✅ **Fully Implemented** - Manual payment via Egyptian mobile wallets and InstaPay:

**Supported Payment Methods:**
| Method | Type | Identifier |
|--------|------|------------|
| Vodafone Cash | Mobile Wallet | Phone number |
| Etisalat Cash (E&) | Mobile Wallet | Phone number |
| Orange Cash | Mobile Wallet | Phone number |
| InstaPay | Bank Transfer | Username |

**Features:**
- Student uploads receipt/screenshot
- Admin reviews and approves/rejects
- Follow-up messaging for clarification
- Automatic subscription activation on approval
- Admin can enable/disable each payment method
- Configurable receiving numbers/usernames

**Pages:**
- Student: `/payment/manual` - Submit payment requests
- Admin: `/admin/manual-payments` - Review and manage requests

**API Endpoints:**
- Student: `GET/POST/PATCH /api/payment/manual`
- Settings: `GET /api/payment/manual/settings`
- Admin: `GET/PATCH /api/admin/manual-payments/[id]`
- Upload: `POST /api/upload/receipt`

---

## Deployment Documentation

| Document | Purpose |
|----------|---------|
| [docs/SETUP.md](docs/SETUP.md) | Local development setup |
| [docs/CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md) | Production deployment to Cloudflare |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture details |
| [docs/API.md](docs/API.md) | API endpoints reference |
| [docs/EXTENDING.md](docs/EXTENDING.md) | Guide for adding new features |
| [FUTURE_UPGRADE_GUIDE.md](FUTURE_UPGRADE_GUIDE.md) | Integration guides for Paymob, Email, Push, etc. |

---

## Contact & Support

- **Technical Issues**: Create issue in repository
- **Feature Requests**: Submit via admin feedback form
- **Security Concerns**: Email security@matrixa.com

---

*This document is the single source of truth for Matrixa's product identity and technical decisions. When in doubt, refer to this file.*
