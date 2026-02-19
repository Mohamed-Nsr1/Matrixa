/**
 * Rate Limiting Utility
 * 
 * In-memory rate limiting for API routes.
 * Provides configurable rate limiting with:
 * - Custom window duration
 * - Maximum requests per window
 * - Custom key generation (IP, user, etc.)
 * - Arabic error messages
 * - Retry-After header
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Optional custom key generator (defaults to IP-based) */
  keyGenerator?: (request: NextRequest) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Key: identifier (IP or user ID), Value: RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval to prevent memory leaks (run every 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000
let cleanupTimer: NodeJS.Timeout | null = null

/**
 * Starts the cleanup interval to remove expired entries
 */
function startCleanup() {
  if (cleanupTimer) return
  
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
  
  // Don't keep the process alive just for this timer
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

// Start cleanup on module load
startCleanup()

/**
 * Gets the client IP address from the request
 */
function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // Fallback to a default
  return 'unknown'
}

/**
 * Formats the remaining time in Arabic
 */
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

/**
 * Rate limit middleware for API routes
 * 
 * @param config - Rate limit configuration
 * @returns Object with check function and remaining requests info
 * 
 * @example
 * const limiter = rateLimit({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 10
 * })
 * 
 * const result = await limiter.check(request)
 * if (!result.success) {
 *   return result.response // 429 response
 * }
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config
  
  return {
    /**
     * Check if the request should be rate limited
     * @param request - The Next.js request object
     * @returns Object with success boolean and optional 429 response
     */
    check(request: NextRequest): { success: true } | { success: false; response: NextResponse } {
      // Generate the key for this request
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      
      const now = Date.now()
      const entry = rateLimitStore.get(key)
      
      // If no entry exists or window has expired, create new entry
      if (!entry || entry.resetTime < now) {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs
        })
        return { success: true }
      }
      
      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
        const remainingTime = formatRemainingTime(entry.resetTime - now)
        
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
                'X-RateLimit-Reset': entry.resetTime.toString()
              }
            }
          )
        }
      }
      
      // Increment count and allow
      entry.count++
      return { success: true }
    },
    
    /**
     * Get remaining requests for a key
     * @param request - The Next.js request object
     * @returns Number of remaining requests in current window
     */
    getRemaining(request: NextRequest): number {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      const entry = rateLimitStore.get(key)
      
      if (!entry || entry.resetTime < Date.now()) {
        return maxRequests
      }
      
      return Math.max(0, maxRequests - entry.count)
    },
    
    /**
     * Reset the rate limit for a specific key
     * @param request - The Next.js request object
     */
    reset(request: NextRequest): void {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      rateLimitStore.delete(key)
    }
  }
}

// Pre-configured rate limiters for auth routes
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10 // 10 attempts per 15 minutes per IP
})

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5 // 5 attempts per hour per IP
})

export const refreshRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 attempts per minute
  // Key generator for refresh token rate limiting - uses user ID if available
  keyGenerator: (request: NextRequest) => {
    // For refresh, we rate limit by IP since user ID isn't available in request
    // This is fine because the refresh token is in cookies
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
