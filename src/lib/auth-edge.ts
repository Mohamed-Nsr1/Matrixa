/**
 * Edge-compatible Authentication Utilities
 * 
 * Pure JWT verification without database dependencies.
 * This file is safe to use in Edge middleware.
 * 
 * SECURITY: No default secrets - requires environment variables.
 */

import { SignJWT, jwtVerify } from 'jose'

// Secret keys - MUST be set via environment variables
const getSecretKey = (key: string): Uint8Array => {
  const secret = process.env[key]
  
  // SECURITY: No default secrets allowed
  if (!secret) {
    const errorMsg = `SECURITY ERROR: Missing required environment variable: ${key}. JWT secrets must be configured in production.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }
  
  // Validate minimum length for security
  if (secret.length < 32) {
    throw new Error(`SECURITY ERROR: ${key} must be at least 32 characters. Current length: ${secret.length}`)
  }
  
  return new TextEncoder().encode(secret)
}

// Cache for secret keys to avoid repeated lookups
let accessSecretCache: Uint8Array | null = null

const getAccessSecret = (): Uint8Array => {
  if (!accessSecretCache) {
    accessSecretCache = getSecretKey('JWT_ACCESS_SECRET')
  }
  return accessSecretCache
}

// JWT payload interface
export interface JwtPayload {
  userId: string
  email: string
  role: string
  deviceId: string
  onboardingCompleted?: boolean
}

/**
 * Generate access token
 */
export async function generateAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getAccessSecret())
}

/**
 * Generate refresh token (random string)
 */
export async function generateRefreshToken(): Promise<string> {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify access token (Edge-compatible - no database)
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

/**
 * Generate device fingerprint from request headers
 */
export function getDeviceFingerprint(userAgent: string, acceptLanguage: string = ''): string {
  const fingerprint = `${userAgent}:${acceptLanguage}`
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}
