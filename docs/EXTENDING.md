# Matrixa Development Guide

> How to extend and modify the Matrixa application

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Code Organization](#code-organization)
3. [Adding New Features](#adding-new-features)
4. [Component Patterns](#component-patterns)
5. [API Patterns](#api-patterns)
6. [Database Migrations](#database-migrations)
7. [Testing Guidelines](#testing-guidelines)
8. [Best Practices](#best-practices)

---

## Getting Started

### Before You Start

1. **Read PROJECT_BRAIN.md** - Understand product rules and constraints
2. **Read ARCHITECTURE.md** - Understand system design
3. **Read API.md** - Understand existing endpoints
4. **Check FEATURES_CHECKLIST.md** - See current implementation status

### Development Environment Setup

```bash
# Clone and install
git clone <repository-url>
cd matrixa
bun install

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
bun run db:push
bun run db:seed

# Start development
bun run dev
```

### Development Workflow

1. Create a feature branch
2. Make changes following patterns below
3. Test thoroughly
4. Run lint check: `bun run lint`
5. Update documentation if needed
6. Submit pull request

---

## Code Organization

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/           # Page components
│   └── api/                # API route handlers
│
├── components/
│   ├── ui/                 # Base UI components (shadcn)
│   ├── feature/            # Feature-specific components
│   └── shared/             # Shared/reusable components
│
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
└── types/                  # TypeScript definitions
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Pages | lowercase | `page.tsx` |
| API Routes | lowercase | `route.ts` |
| Components | PascalCase | `TaskCard.tsx` |
| Hooks | camelCase with `use` | `useTaskList.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `Task.ts` |

### Import Organization

```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 3. Internal components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 4. Internal hooks and utilities
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// 5. Types
import type { Task } from '@/types'
```

---

## Adding New Features

### Step-by-Step Guide

1. **Plan the feature**
   - Define data requirements
   - Identify API endpoints needed
   - Design UI components

2. **Update database schema** (if needed)
   - Add models to `prisma/schema.prisma`
   - Run `bun run db:push`

3. **Create API routes**
   - Add endpoints in `src/app/api/`
   - Follow existing patterns

4. **Build UI components**
   - Create in `src/components/`
   - Use existing shadcn/ui components

5. **Create pages** (if needed)
   - Add in appropriate directory
   - Update navigation

6. **Test thoroughly**
   - Manual testing
   - Check edge cases
   - Verify RTL support

### Example: Adding a "Bookmarks" Feature

#### 1. Database Schema

```prisma
// prisma/schema.prisma

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  note      String?  // Optional note for bookmark
  
  createdAt DateTime @default(now())
  
  @@unique([userId, lessonId])
  @@index([userId])
}

// Add relation to User model
model User {
  // ... existing fields
  bookmarks Bookmark[]
}

// Add relation to Lesson model
model Lesson {
  // ... existing fields
  bookmarks Bookmark[]
}
```

Run migration:
```bash
bun run db:push
```

#### 2. API Route

```typescript
// src/app/api/bookmarks/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, bookmarks })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { lessonId, note } = body

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_lessonId: { userId: user.id, lessonId }
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already bookmarked' },
        { status: 400 }
      )
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        lessonId,
        note
      }
    })

    return NextResponse.json({ success: true, bookmark })
  } catch (error) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create bookmark' },
      { status: 500 }
    )
  }
}
```

#### 3. Component

```typescript
// src/components/bookmarks/BookmarkButton.tsx

'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface BookmarkButtonProps {
  lessonId: string
  isBookmarked: boolean
  onToggle?: () => void
}

export function BookmarkButton({ lessonId, isBookmarked, onToggle }: BookmarkButtonProps) {
  const [loading, setLoading] = useState(false)
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const { toast } = useToast()

  const handleToggle = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bookmarks', {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId })
      })

      if (response.ok) {
        setBookmarked(!bookmarked)
        onToggle?.()
        toast({
          title: bookmarked ? 'تم إزالة العلامة' : 'تم إضافة العلامة'
        })
      }
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      className="dir-rtl"
    >
      {bookmarked ? (
        <BookmarkCheck className="h-5 w-5 text-primary" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </Button>
  )
}
```

---

## Component Patterns

### Page Component Pattern

```typescript
// src/app/example/page.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ExamplePage() {
  // 1. Data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      const response = await fetch('/api/example')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    }
  })

  // 2. Loading state
  if (isLoading) {
    return <ExamplePageSkeleton />
  }

  // 3. Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">حدث خطأ في تحميل البيانات</p>
      </div>
    )
  }

  // 4. Main content
  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">عنوان الصفحة</h1>
      {/* Content */}
    </div>
  )
}

// Loading skeleton
function ExamplePageSkeleton() {
  return (
    <div className="container mx-auto p-4" dir="rtl">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
```

### Modal Component Pattern

```typescript
// src/components/example/ExampleModal.tsx

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ExampleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ExampleModal({ open, onOpenChange, onSuccess }: ExampleModalProps) {
  const [loading, setLoading] = useState(false)
  const [field, setField] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field })
      })

      if (response.ok) {
        toast({ title: 'تم بنجاح' })
        onOpenChange(false)
        onSuccess?.()
      } else {
        const error = await response.json()
        toast({ title: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dir-rtl">
        <DialogHeader>
          <DialogTitle>عنوان النافذة</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Label htmlFor="field">الحقل</Label>
            <Input
              id="field"
              value={field}
              onChange={(e) => setField(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### List Component Pattern

```typescript
// src/components/example/ExampleList.tsx

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ExampleList() {
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['examples'],
    queryFn: async () => {
      const response = await fetch('/api/examples')
      return response.json()
    }
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!data?.examples?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        لا توجد بيانات
      </div>
    )
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-2 p-2">
        {data.examples.map((item: any) => (
          <Card key={item.id} className="p-3 flex justify-between items-center">
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingId(item.id)}>
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )

  async function handleDelete(id: string) {
    // Delete logic
  }
}
```

---

## API Patterns

### Standard API Route

```typescript
// src/app/api/examples/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const createSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  description: z.string().optional()
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
    const examples = await prisma.example.findMany({
      where: {
        userId: user.id,
        ...(filter && { field: filter })
      },
      orderBy: { createdAt: 'desc' }
    })

    // 4. Response
    return NextResponse.json({ success: true, examples })
  } catch (error) {
    console.error('GET /api/examples error:', error)
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
    const validation = createSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.errors[0]?.message 
        },
        { status: 400 }
      )
    }

    // 3. Database operation
    const example = await prisma.example.create({
      data: {
        ...validation.data,
        userId: user.id
      }
    })

    // 4. Response
    return NextResponse.json(
      { success: true, example },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/examples error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Dynamic Route

```typescript
// src/app/api/examples/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const example = await prisma.example.findFirst({
      where: { id, userId: user.id }
    })

    if (!example) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, example })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await prisma.example.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.example.update({
      where: { id },
      data: body
    })

    return NextResponse.json({ success: true, example: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.example.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      )
    }

    await prisma.example.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Admin-Protected Route

```typescript
// src/app/api/admin/examples/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Admin-only GET handler
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Check authentication
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check admin role
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Admin-specific query
    const examples = await prisma.example.findMany({
      include: { user: { select: { email: true, fullName: true } } }
    })

    return NextResponse.json({ success: true, examples })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Database Migrations

### Adding a New Model

1. **Edit schema**
   ```prisma
   // prisma/schema.prisma
   
   model NewModel {
     id        String   @id @default(cuid())
     name      String
     userId    String
     user      User     @relation(fields: [userId], references: [id])
     createdAt DateTime @default(now())
     
     @@index([userId])
   }
   ```

2. **Push changes** (development)
   ```bash
   bun run db:push
   ```

3. **Create migration** (production)
   ```bash
   bun run db:migrate
   ```

### Adding a Field

```prisma
model User {
  // ... existing fields
  newField String?  // Add optional field
}
```

### Adding an Index

```prisma
model Task {
  // ... fields
  
  @@index([userId])        // Single column
  @@index([userId, status]) // Composite
}
```

### Relations

```prisma
// One-to-Many
model User {
  id      String   @id
  tasks   Task[]
}

model Task {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// One-to-One
model User {
  id           String         @id
  subscription Subscription?
}

model Subscription {
  id     String @id
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Testing Guidelines

### Manual Testing Checklist

For each new feature, verify:

- [ ] **Authentication**
  - Works when logged in
  - Redirects when logged out
  - Returns 401 for API calls without auth

- [ ] **Authorization**
  - Students can't access admin routes
  - Users can only access their own data

- [ ] **Validation**
  - Required fields are enforced
  - Invalid data is rejected
  - Error messages are helpful

- [ ] **RTL Support**
  - Text aligns correctly
  - Icons are mirrored if needed
  - Forms work with Arabic input

- [ ] **Mobile Responsiveness**
  - Works on small screens
  - Touch targets are adequate
  - No horizontal scroll

- [ ] **Edge Cases**
  - Empty states display correctly
  - Long text doesn't break layout
  - Loading states show properly

### API Testing

Use tools like Postman, Insomnia, or curl:

```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@matrixa.com","password":"Admin123!@#"}' \
  -c cookies.txt

# Use session for subsequent requests
curl http://localhost:3000/api/tasks \
  -b cookies.txt
```

---

## Best Practices

### Security

1. **Always validate input**
   ```typescript
   const schema = z.object({
     email: z.string().email(),
     password: z.string().min(8)
   })
   ```

2. **Check ownership**
   ```typescript
   const item = await prisma.item.findFirst({
     where: { id, userId: user.id }
   })
   ```

3. **Never expose sensitive data**
   ```typescript
   const { passwordHash, ...safeUser } = user
   return NextResponse.json({ user: safeUser })
   ```

### Performance

1. **Use selective queries**
   ```typescript
   await prisma.user.findMany({
     select: { id: true, email: true, fullName: true }
   })
   ```

2. **Implement pagination**
   ```typescript
   const items = await prisma.item.findMany({
     skip: (page - 1) * limit,
     take: limit
   })
   ```

3. **Use indexes on filtered columns**
   ```prisma
   @@index([userId, status])
   ```

### Code Quality

1. **Use TypeScript types**
   ```typescript
   interface TaskResponse {
     success: boolean
     task?: Task
     error?: string
   }
   ```

2. **Handle errors gracefully**
   ```typescript
   try {
     // operation
   } catch (error) {
     console.error('Error:', error)
     return NextResponse.json(
       { success: false, error: 'Something went wrong' },
       { status: 500 }
     )
   }
   ```

3. **Write self-documenting code**
   ```typescript
   // Good
   const completedTasks = tasks.filter(task => task.status === 'COMPLETED')
   
   // Bad
   const ct = tasks.filter(t => t.s === 'COMPLETED')
   ```

### RTL Support

1. **Add dir="rtl" to containers**
   ```tsx
   <div dir="rtl">محتوى عربي</div>
   ```

2. **Use logical CSS properties**
   ```css
   margin-inline-start: 1rem; /* Instead of margin-left */
   ```

3. **Mirror directional icons**
   ```tsx
   <ChevronRight className="rotate-180 rtl:rotate-0" />
   ```

---

## Related Documentation

- [PROJECT_BRAIN.md](../PROJECT_BRAIN.md) - Product identity and rules
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API.md](API.md) - API endpoint reference
- [SETUP.md](SETUP.md) - Installation guide

---

*Last updated: 2025-01-18*
