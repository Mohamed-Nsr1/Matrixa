/**
 * Admin Users API Route
 * List all users and create new users (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

// Query params schema
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  search: z.string().optional(),
  role: z.enum(['STUDENT', 'ADMIN', 'ALL']).default('ALL'),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Create user schema
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
  role: z.enum(['STUDENT', 'ADMIN']).default('STUDENT'),
  branchId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))

    const where: Prisma.UserWhereInput = {}
    
    if (params.search) {
      where.OR = [
        { email: { contains: params.search } },
        { fullName: { contains: params.search } }
      ]
    }
    
    if (params.role !== 'ALL') {
      where.role = params.role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          branchId: true,
          branch: { select: { nameAr: true, nameEn: true } },
          onboardingCompleted: true,
          lastActiveAt: true,
          createdAt: true,
          isBanned: true,
          bannedAt: true,
          bannedReason: true,
          _count: {
            select: {
              tasks: true,
              notes: true,
              focusSessions: true
            }
          }
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    })
  } catch (error) {
    console.error('Admin users list error:', error)
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
    const data = createUserSchema.parse(body)

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }

    // Hash password
    const { hashPassword } = await import('@/lib/auth')
    const passwordHash = await hashPassword(data.password)

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        branchId: data.branchId,
        onboardingCompleted: true,
        uiLanguage: 'arabic'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
