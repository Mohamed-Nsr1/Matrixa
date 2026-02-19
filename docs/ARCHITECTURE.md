# Matrixa Architecture

> System architecture and design documentation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Design](#database-design)
5. [Authentication Flow](#authentication-flow)
6. [API Structure](#api-structure)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Error Handling](#error-handling)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   React     │  │   React     │  │   Zustand   │              │
│  │   Components│  │   Query     │  │   Store     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Error       │  │ Theme       │  │ PWA         │              │
│  │ Boundaries  │  │ Toggle      │  │ Service     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │  API Routes │  │ Middleware  │              │
│  │  (App Router)│  │  (Backend)  │  │  (Auth)     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Rate        │  │ Audit       │  │ Maintenance │              │
│  │ Limiting    │  │ Logging     │  │ Mode Check  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│              SQLite (dev) / PostgreSQL (prod)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Modern React patterns, server components, streaming |
| Prisma ORM | Type safety, migrations, query builder |
| JWT Authentication | Stateless, scalable, edge-compatible |
| SQLite for Dev | Zero setup, file-based, fast iteration |
| PostgreSQL for Prod | Scalability, reliability, full SQL features |
| Error Boundaries | Graceful error handling per page |
| Rate Limiting | Protection against brute force attacks |

---

## Frontend Architecture

### Component Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (providers, theme)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles
│   │
│   ├── auth/               # Authentication pages
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/          # Student dashboard
│   ├── admin/              # Admin panel
│   ├── access-denied/      # Access denied page
│   ├── subjects/           # Subjects hub
│   ├── planner/            # Weekly planner
│   ├── focus/              # Focus mode
│   ├── notes/              # Notes system
│   └── settings/           # User settings
│
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── tasks/              # Task-related components
│   │   ├── TaskCard.tsx
│   │   ├── TaskModal.tsx
│   │   └── DroppableDay.tsx
│   │
│   ├── notes/              # Notes-related components
│   │   ├── NoteCard.tsx
│   │   ├── NoteModal.tsx
│   │   └── SubjectLessonSelector.tsx
│   │
│   ├── focus/              # Focus mode components
│   │   └── SessionSummaryModal.tsx
│   │
│   ├── subscription/       # Subscription components
│   │   └── SubscriptionBanner.tsx
│   │
│   └── admin/              # Admin components
│       └── AdminLayout.tsx
│
├── hooks/                  # Custom React hooks
│   ├── use-mobile.ts       # Mobile detection
│   └── use-toast.ts        # Toast notifications
│
└── lib/                    # Utility libraries
    ├── utils.ts            # Helper functions
    ├── auth.ts             # Client-side auth helpers
    └── ...
```

### Page Component Pattern

Each page follows this structure:

```typescript
// src/app/example/page.tsx

'use client'  // If client-side interactivity needed

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ExamplePage() {
  // 1. Data fetching with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['example'],
    queryFn: () => fetch('/api/example').then(r => r.json())
  })

  // 2. Loading state
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // 3. Error state
  if (error) {
    return <ErrorDisplay error={error} />
  }

  // 4. Main render
  return (
    <div className="container mx-auto p-4">
      {/* Content */}
    </div>
  )
}
```

### State Management

| Type | Tool | Use Case |
|------|------|----------|
| Server State | React Query | API data, caching, synchronization |
| Client State | Zustand | UI state, user preferences |
| Form State | React Hook Form | Form handling, validation |
| URL State | Next.js Router | Pagination, filters |

### Styling Approach

```typescript
// Using Tailwind CSS with shadcn/ui
<Card className="p-4 bg-slate-900 border-slate-800">
  <h2 className="text-xl font-semibold text-white">Title</h2>
  <p className="text-slate-400">Description</p>
</Card>

// Using cn() utility for conditional classes
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}>
```

---

## Backend Architecture

### API Route Structure

```
src/app/api/
├── route.ts                    # Health check endpoint
│
├── auth/                       # Authentication endpoints
│   ├── login/route.ts          # POST - Login
│   ├── register/route.ts       # POST - Register
│   ├── logout/route.ts         # POST - Logout
│   ├── refresh/route.ts        # POST - Refresh tokens
│   └── me/route.ts             # GET - Current user
│
├── admin/                      # Admin-only endpoints
│   ├── users/
│   │   ├── route.ts            # GET - List users
│   │   └── [id]/route.ts       # PATCH/DELETE - User ops
│   ├── curriculum/
│   │   ├── branches/
│   │   ├── subjects/
│   │   ├── units/
│   │   └── lessons/
│   ├── invites/
│   ├── subscriptions/
│   ├── email/                # Email tool API
│   ├── plans/
│   ├── settings/
│   └── stats/
│
├── tasks/                      # Task management
│   ├── route.ts                # GET/POST - Tasks
│   ├── [id]/route.ts           # PATCH/DELETE - Task
│   ├── [id]/complete/route.ts  # POST - Complete task
│   └── today/route.ts          # GET - Today's tasks
│
├── notes/                      # Notes system
│   ├── route.ts                # GET/POST - Notes
│   └── [id]/route.ts           # PATCH/DELETE - Note
│
├── focus-sessions/             # Focus sessions
│   └── route.ts                # GET/POST - Sessions
│
├── private-lessons/            # Private lessons
│   ├── route.ts                # GET/POST - Lessons
│   └── [id]/route.ts           # PATCH/DELETE - Lesson
│
├── subjects/                   # Subjects data
├── branches/                   # Branches data
├── insights/                   # User insights
├── leaderboard/                # Leaderboard
├── subscription/               # Subscription status
├── payment/                    # Payment handling
└── settings/                   # User settings
```

### API Route Pattern

```typescript
// src/app/api/example/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const exampleSchema = z.object({
  name: z.string().min(1),
  value: z.number().positive()
})

// GET handler
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Query parameters
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter')

    // 3. Database query
    const data = await prisma.example.findMany({
      where: { userId: user.id, ...(filter && { filter }) }
    })

    // 4. Response
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate body
    const body = await request.json()
    const validation = exampleSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    // 3. Database operation
    const created = await prisma.example.create({
      data: { ...validation.data, userId: user.id }
    })

    // 4. Response
    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Middleware Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      REQUEST INCOMING                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Is API route? ────────────────────────────────→ Pass through   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ No
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Is static file? ──────────────────────────────→ Pass through   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ No
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Is public route? ─────────────────────────────→ Pass through   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ No
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Has valid access token?                                       │
│  ├─ No ────────────────────────────────────────→ Redirect login │
│  └─ Yes ────────────────────────────────────────────────┐       │
└─────────────────────────────────────────────────────────┼───────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Is admin route?                                                │
│  ├─ Yes, not admin ────────────────────────────→ Redirect dash │
│  └─ No, admin user ────────────────────────────→ Redirect admin│
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Has completed onboarding?                                      │
│  ├─ No ────────────────────────────────────────→ Redirect onboard│
│  └─ Yes ────────────────────────────────────────────────┐       │
└─────────────────────────────────────────────────────────┼───────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Has subscription access?                                       │
│  ├─ Access denied (isAccessDenied=true) ────→ Redirect denied   │
│  ├─ Read only (isReadOnly=true) ────────────→ Allow (limited)   │
│  └─ Yes ───────────────────────────────────→ Allow access       │
└─────────────────────────────────────────────────────────────────┘
```

### Subscription Expiration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION LIFECYCLE                         │
└──────────────────────────────────────────────────────────────────┘

Active Subscription
       │
       ▼
Expires ─────────────────────────────────────────────┐
       │                                              │
       ▼                                              │
Grace Period (7 days default)                        │
       │                                              │
       ▼                                              │
Read-Only Mode                                       │
  - Feature limits applied                           │
  - Warning banners shown                            │
  - No write operations                              │
       │                                              │
       ▼                                              │
Sign-in Restriction (if enabled)                     │
  - Redirect to /access-denied                       │
  - Show payment options                             │
  - Data preserved                                   │
                                                      │
Renewal ─────────────────────────────────────────────┘
       │
       ▼
Active Subscription
```

---

## Database Design

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │   Session    │       │ Subscription │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │──┐    │ id           │    ┌──│ id           │
│ email        │  │    │ userId       │◄───┘  │ userId       │
│ passwordHash │  │    │ refreshToken │       │ planId       │
│ role         │  │    │ expiresAt    │       │ status       │
│ branchId     │  │    └──────────────┘       │ startDate    │
│ ...          │  │                           │ endDate      │
└──────────────┘  │                           └──────────────┘
       │          │
       │          │    ┌──────────────┐
       │          └───►│   Streak     │
       │               ├──────────────┤
       │               │ userId       │
       │               │ currentStreak│
       │               └──────────────┘
       │
       │         ┌──────────────┐
       └────────►│    Task      │
                 ├──────────────┤
                 │ id           │
                 │ userId       │
                 │ lessonId     │
                 │ title        │
                 │ taskType     │
                 │ status       │
                 │ scheduledDate│
                 └──────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Branch    │       │   Subject    │       │    Unit      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │───┐   │ id           │───┐   │ id           │
│ nameAr       │   └──►│ branchId     │   └──►│ subjectId    │
│ nameEn       │       │ nameAr       │       │ nameAr       │
│ code         │       │ nameEn       │       │ nameEn       │
└──────────────┘       │ color        │       └──────────────┘
                       └──────────────┘              │
                                                     │
                           ┌──────────────┐          │
                           │   Lesson     │◄─────────┘
                           ├──────────────┤
                           │ id           │
                           │ unitId       │
                           │ nameAr       │
                           │ nameEn       │
                           │ duration     │
                           └──────────────┘
                                  │
                           ┌──────┴──────┐
                           │             │
                           ▼             ▼
                    ┌──────────────┐  ┌──────────────┐
                    │LessonProgress│  │    Note      │
                    ├──────────────┤  ├──────────────┤
                    │ userId       │  │ userId       │
                    │ lessonId     │  │ subjectId    │
                    │ doneVideo    │  │ lessonId     │
                    │ doneQuestions│  │ content      │
                    │ doneRevision │  └──────────────┘
                    └──────────────┘
```

### Core Models

#### User Model

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(STUDENT)
  
  // Profile
  fullName      String?
  branchId      String?
  specialization String?
  dailyStudyGoal Int?
  
  // Onboarding
  onboardingCompleted Boolean @default(false)
  
  // Session
  deviceFingerprint String?
  lastActiveAt     DateTime @default(now())
  
  // Relations
  sessions       Session[]
  subscriptions  Subscription[]
  tasks          Task[]
  notes          Note[]
  focusSessions  FocusSession[]
  streaks        Streak[]
  // ...
}

enum UserRole {
  STUDENT
  ADMIN
}
```

#### Task Model

```prisma
model Task {
  id            String     @id @default(cuid())
  userId        String
  lessonId      String?
  
  title         String
  description   String?
  taskType      TaskType   @default(VIDEO)
  status        TaskStatus @default(PENDING)
  
  scheduledDate DateTime?
  dayOfWeek     Int?
  duration      Int
  
  completedAt   DateTime?
  
  // Relations
  user          User       @relation(...)
  lesson        Lesson?    @relation(...)
}

enum TaskType {
  VIDEO
  QUESTIONS
  REVISION
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}
```

### Indexes

Key indexes for performance:

```prisma
// User indexes
@@index([email])
@@index([role])

// Task indexes
@@index([userId])
@@index([scheduledDate])
@@index([status])

// Session indexes
@@index([userId])
@@index([refreshToken])

// LessonProgress indexes
@@unique([userId, lessonId])
@@index([userId])
@@index([lessonId])
```

---

## Authentication Flow

### Login Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                 │
└──────────────────────────────────────────────────────────────────┘

Client                     Server                    Database
  │                          │                          │
  │  POST /api/auth/login    │                          │
  │  { email, password }     │                          │
  │─────────────────────────►│                          │
  │                          │  Find user by email      │
  │                          │─────────────────────────►│
  │                          │◄─────────────────────────│
  │                          │                          │
  │                          │  Verify password (bcrypt)│
  │                          │                          │
  │                          │  Generate device fingerprint
  │                          │                          │
  │                          │  Invalidate old sessions │
  │                          │─────────────────────────►│
  │                          │                          │
  │                          │  Create new session      │
  │                          │─────────────────────────►│
  │                          │◄─────────────────────────│
  │                          │                          │
  │                          │  Generate JWT tokens     │
  │                          │  (access + refresh)      │
  │                          │                          │
  │  Set-Cookie: accessToken │                          │
  │  Set-Cookie: refreshToken│                          │
  │◄─────────────────────────│                          │
  │                          │                          │
  │  { user, isNewDevice }   │                          │
  │                          │                          │
```

### Token Refresh Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     TOKEN REFRESH FLOW                            │
└──────────────────────────────────────────────────────────────────┘

Client                     Server                    Database
  │                          │                          │
  │  POST /api/auth/refresh  │                          │
  │  Cookie: refreshToken    │                          │
  │─────────────────────────►│                          │
  │                          │  Find session by token   │
  │                          │─────────────────────────►│
  │                          │◄─────────────────────────│
  │                          │                          │
  │                          │  Check expiration        │
  │                          │                          │
  │                          │  Generate new access token
  │                          │                          │
  │  Set-Cookie: accessToken │                          │
  │◄─────────────────────────│                          │
  │                          │                          │
  │  { success: true }       │                          │
  │                          │                          │
```

### Route Protection

```typescript
// middleware.ts (simplified)

export async function middleware(request: NextRequest) {
  // 1. Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 2. Check access token
  const accessToken = request.cookies.get('accessToken')?.value
  if (!accessToken) {
    return redirectToLogin()
  }

  // 3. Verify token (edge-compatible)
  const payload = await verifyAccessToken(accessToken)
  if (!payload) {
    return redirectToLogin()
  }

  // 4. Check admin routes
  if (isAdminRoute(pathname) && payload.role !== 'ADMIN') {
    return redirectToDashboard()
  }

  // 5. Check onboarding
  if (!payload.onboardingCompleted) {
    return redirectToOnboarding()
  }

  // 6. Check subscription
  if (!hasSubscriptionAccess(request)) {
    return redirectToSubscription()
  }

  return NextResponse.next()
}
```

---

## API Structure

### Response Format

All API responses follow this format:

```typescript
// Success response
{
  success: true,
  data: { ... },
  message?: string
}

// Error response
{
  success: false,
  error: string,
  code?: string,  // Machine-readable error code
  details?: object
}
```

### Common HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable | Validation failed |
| 500 | Server Error | Unexpected error |

### Authentication Headers

```typescript
// Tokens are sent via HttpOnly cookies
// No manual header setup required

// For API routes that need user context:
const user = await getCurrentUser() // Reads from cookie
```

### Pagination

```typescript
// Request
GET /api/tasks?page=1&limit=20

// Response
{
  success: true,
  tasks: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

---

## Data Flow Diagrams

### Task Creation Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  User   │     │ TaskModal   │     │  API Route  │     │ Database│
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └────┬────┘
     │                 │                   │                 │
     │ Fill form       │                   │                 │
     │────────────────►│                   │                 │
     │                 │                   │                 │
     │                 │ POST /api/tasks   │                 │
     │                 │──────────────────►│                 │
     │                 │                   │                 │
     │                 │                   │ Validate input  │
     │                 │                   │────────────────►│
     │                 │                   │                 │
     │                 │                   │ Create task     │
     │                 │                   │────────────────►│
     │                 │                   │                 │
     │                 │                   │◄────────────────│
     │                 │                   │                 │
     │                 │ { success, task } │                 │
     │                 │◄──────────────────│                 │
     │                 │                   │                 │
     │ Toast message   │                   │                 │
     │◄────────────────│                   │                 │
     │                 │                   │                 │
```

### Focus Session Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  User   │     │ FocusPage   │     │  API Route  │     │ Database│
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └────┬────┘
     │                 │                   │                 │
     │ Start timer     │                   │                 │
     │────────────────►│                   │                 │
     │                 │                   │                 │
     │                 │ Track progress    │                 │
     │ (videos/questions/revision)         │                 │
     │                 │                   │                 │
     │ Complete session│                   │                 │
     │────────────────►│                   │                 │
     │                 │                   │                 │
     │                 │ POST /api/focus-sessions            │
     │                 │──────────────────►│                 │
     │                 │                   │                 │
     │                 │                   │ Save session    │
     │                 │                   │────────────────►│
     │                 │                   │                 │
     │                 │                   │ Update streak   │
     │                 │                   │────────────────►│
     │                 │                   │                 │
     │                 │                   │ Update leaderboard
     │                 │                   │────────────────►│
     │                 │                   │                 │
     │                 │◄──────────────────│                 │
     │                 │                   │                 │
     │ Show summary    │                   │                 │
     │◄────────────────│                   │                 │
     │                 │                   │                 │
```

### Subscription Check Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  User   │     │ Middleware  │     │  Cookies    │
└────┬────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                   │
     │ Access page     │                   │
     │────────────────►│                   │
     │                 │                   │
     │                 │ Read subscriptionEnabled cookie
     │                 │──────────────────►│
     │                 │◄──────────────────│
     │                 │                   │
     │                 │ If enabled:       │
     │                 │ Read subscriptionActive
     │                 │──────────────────►│
     │                 │◄──────────────────│
     │                 │                   │
     │                 │ Read isInTrial    │
     │                 │──────────────────►│
     │                 │◄──────────────────│
     │                 │                   │
     │                 │ Has access?       │
     │                 │                   │
     │    ┌────────────┴────────────┐      │
     │    │                         │      │
     │    ▼                         ▼      │
     │ Allow access          Redirect to   │
     │◄───────────            subscription │
     │                                 page│
     │                 │                   │
```

---

## Error Handling

### Error Boundary Architecture

Each major page has its own error boundary for graceful error handling:

```
src/app/
├── error.tsx              # Root error boundary
├── dashboard/
│   └── error.tsx          # Dashboard-specific errors
├── admin/
│   └── error.tsx          # Admin panel errors
├── planner/
│   └── error.tsx          # Planner errors
├── focus/
│   └── error.tsx          # Focus mode errors
├── notes/
│   └── error.tsx          # Notes errors
└── settings/
    └── error.tsx          # Settings errors
```

### Error Boundary Pattern

```typescript
// src/app/example/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" dir="rtl">
      <h2 className="text-xl font-semibold">حدث خطأ ما</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>حاول مرة أخرى</Button>
    </div>
  )
}
```

### Maintenance Mode

When maintenance mode is enabled:
- Non-admin users see `/maintenance` page
- Admins can still access all pages
- Set via `maintenanceMode` in SystemSettings

### Access Denied Page

When sign-in restriction is enabled and user is denied:
- User is redirected to `/access-denied`
- Shows subscription plans for renewal
- Preserves user data for when they renew
- Provides payment flow integration

### Read-Only Mode

When subscription expires (after grace period):
- User can view but not edit data
- Feature limits apply:
  - Timetable: X days ahead only
  - Notes: X notes visible
  - Focus sessions: X sessions in history
  - Private lessons: X lessons visible
- Warning banners displayed on all pages

---

## Related Documentation

- [API.md](API.md) - Detailed API endpoint documentation
- [SETUP.md](SETUP.md) - Installation and configuration
- [EXTENDING.md](EXTENDING.md) - Development guidelines

---

*Last updated: 2025-01-19*
