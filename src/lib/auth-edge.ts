/**
 * Edge-compatible Authentication Utilities
 * 
 * Pure JWT verification without database dependencies.
 * This file is safe to use in Edge middleware.
 */

import { SignJWT, jwtVerify } from 'jose'

// Default secrets for development (should always be overridden in production)
const DEFAULT_ACCESS_SECRET = 'matrixa-dev-access-secret-key-2024-min-32-chars!'
const DEFAULT_REFRESH_SECRET = 'matrixa-dev-refresh-secret-key-2024-min-32-chars!'

// Secret keys (should be in environment variables)
const getSecretKey = (key: string, defaultValue: string) => {
  const secret = process.env[key] || defaultValue
  if (!process.env[key] && process.env.NODE_ENV === 'production') {
    console.error(`WARNING: Missing environment variable: ${key} - using default in production!`)
  }
  return new TextEncoder().encode(secret)
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
    .sign(getSecretKey('JWT_ACCESS_SECRET', DEFAULT_ACCESS_SECRET))
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
    const { payload } = await jwtVerify(token, getSecretKey('JWT_ACCESS_SECRET', DEFAULT_ACCESS_SECRET))
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
