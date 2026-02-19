/**
 * Rate Limiting Utility
 * 
 * Scalable rate limiting using Upstash Redis for production.
 * Falls back to in-memory for development when Redis is not configured.
 * 
 * Features:
 * - Redis-backed for serverless/edge environments
 * - Configurable window and limit
 * - Automatic fallback to in-memory
 * - Arabic error messages
 * - Retry-After headers
 */

import { NextRequest, NextResponse } from 'next/server'

// Check if Redis is configured
const REDIS_CONFIGURED = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Optional custom key generator (defaults to IP-based) */
  keyGenerator?: (request: NextRequest) => string
  /** Prefix for Redis keys */
  prefix?: string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// ============================================
// REDIS-BASED RATE LIMITER (Production)
// ============================================

async function checkRedis(
  key: string,
  windowMs: number,
  maxRequests: number,
  prefix: string
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  // Dynamic import to avoid errors when not configured
  const { Redis } = await import('@upstash/redis')
  
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  
  const fullKey = `${prefix}:${key}`
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Use a sliding window approach with sorted sets
  // Remove old entries
  await redis.zremrangebyscore(fullKey, 0, windowStart)
  
  // Count current entries
  const count = await redis.zcard(fullKey)
  
  if (count >= maxRequests) {
    // Get the oldest entry's time to calculate reset time
    const oldest = await redis.zrange(fullKey, 0, 0, { withScores: true })
    const resetTime = oldest.length > 0 ? (oldest[1] as number) + windowMs : now + windowMs
    
    return {
      success: false,
      remaining: 0,
      resetTime
    }
  }
  
  // Add current request
  await redis.zadd(fullKey, { score: now, member: `${now}-${Math.random()}` })
  
  // Set expiry on the key
  await redis.expire(fullKey, Math.ceil(windowMs / 1000))
  
  return {
    success: true,
    remaining: maxRequests - count - 1,
    resetTime: now + windowMs
  }
}

// ============================================
// IN-MEMORY RATE LIMITER (Development Fallback)
// ============================================

const memoryStore = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL = 10 * 60 * 1000
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return
  
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetTime < now) {
        memoryStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
  
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

startCleanup()

function checkMemory(
  key: string,
  windowMs: number,
  maxRequests: number
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = memoryStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    }
  }
  
  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  entry.count++
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  return 'unknown'
}

function formatRemainingTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  
  if (seconds < 60) {
    return `${seconds} ثانية`
  }
  
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} دقيقة`
  }
  
  const hours = Math.ceil(minutes / 60)
  return `${hours} ساعة`
}

// ============================================
// MAIN EXPORT
// ============================================

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator, prefix = 'ratelimit' } = config
  
  return {
    /**
     * Check if the request should be rate limited
     */
    async check(request: NextRequest): Promise<{ success: true } | { success: false; response: NextResponse }> {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      
      let result: { success: boolean; remaining: number; resetTime: number }
      
      if (REDIS_CONFIGURED) {
        result = await checkRedis(key, windowMs, maxRequests, prefix)
      } else {
        result = checkMemory(key, windowMs, maxRequests)
      }
      
      if (!result.success) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
        const remainingTime = formatRemainingTime(result.resetTime - Date.now())
        
        return {
          success: false,
          response: NextResponse.json(
            {
              success: false,
              error: `تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى بعد ${remainingTime}`
            },
            {
              status: 429,
              headers: {
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': result.resetTime.toString()
              }
            }
          )
        }
      }
      
      return { success: true }
    },
    
    /**
     * Get remaining requests for a key (sync, uses memory store only)
     */
    getRemaining(request: NextRequest): number {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      const entry = memoryStore.get(key)
      
      if (!entry || entry.resetTime < Date.now()) {
        return maxRequests
      }
      
      return Math.max(0, maxRequests - entry.count)
    },
    
    /**
     * Reset the rate limit for a specific key
     */
    reset(request: NextRequest): void {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      memoryStore.delete(key)
    }
  }
}

// ============================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per 15 minutes per IP
  prefix: 'login'
})

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 attempts per hour per IP
  prefix: 'register'
})

export const refreshRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 attempts per minute
  prefix: 'refresh',
  keyGenerator: (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return `refresh:${forwarded.split(',')[0].trim()}`
    }
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return `refresh:${realIP.trim()}`
    }
    return 'refresh:unknown'
  }
})

// General API rate limiter - 10 requests per 10 seconds
export const apiRateLimit = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 10, // 10 requests per 10 seconds
  prefix: 'api'
})
