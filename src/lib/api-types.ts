/**
 * Shared API Types
 * 
 * Proper TypeScript types for API route queries
 */

import { Prisma } from '@prisma/client'

// User where clause type for admin queries
export type UserWhereInput = Prisma.UserWhereInput

// Subscription where clause type
export type SubscriptionWhereInput = Prisma.SubscriptionWhereInput

// Common pagination params
export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Common pagination response
export interface PaginationResponse {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Helper to build search OR clause
export function buildSearchClause(search: string, fields: string[]): Prisma.UserWhereInput['OR'] {
  return fields.map(field => ({
    [field]: { contains: search }
  })) as Prisma.UserWhereInput['OR']
}

// Helper to build paginated query options
export function buildPaginationOptions(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder || 'desc' } : undefined
  }
}
