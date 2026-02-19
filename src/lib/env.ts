/**
 * Environment Variables Validation
 * 
 * Validates required environment variables at startup.
 * SECURITY: No default secrets - all secrets must be explicitly configured.
 */

import { z } from 'zod'

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  
  // Optional but recommended
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Payment (optional - for Paymob integration)
  PAYMOB_API_KEY: z.string().optional(),
  PAYMOB_INTEGRATION_ID: z.string().optional(),
  PAYMOB_IFRAME_ID: z.string().optional(),
  PAYMOB_HMAC_SECRET: z.string().optional(),
  
  // Email (optional - for SMTP integration)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Push Notifications (optional)
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  
  // Redis (optional - for scalable rate limiting in production)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Cron Jobs (optional)
  CRON_SECRET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv
  
  // Only validate on server side
  if (typeof window !== 'undefined') {
    return {} as Env
  }
  
  const result = envSchema.safeParse(process.env)
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => {
      return `  - ${issue.path.join('.')}: ${issue.message}`
    }).join('\n')
    
    console.error('\n' + '='.repeat(60))
    console.error('ENVIRONMENT VALIDATION FAILED')
    console.error('='.repeat(60))
    console.error('\nThe following environment variables are missing or invalid:\n' + errors)
    console.error('\nSECURITY: JWT secrets must be at least 32 characters.')
    console.error('Generate secure secrets with: openssl rand -base64 32')
    console.error('\nRequired environment variables:')
    console.error('  - DATABASE_URL: Database connection string')
    console.error('  - JWT_ACCESS_SECRET: Secret for access tokens (min 32 chars)')
    console.error('  - JWT_REFRESH_SECRET: Secret for refresh tokens (min 32 chars)')
    console.error('='.repeat(60) + '\n')
    
    throw new Error('Environment validation failed. See errors above.')
  }
  
  validatedEnv = result.data
  return validatedEnv
}

// Log warnings for missing optional variables
export function logEnvWarnings() {
  if (typeof window !== 'undefined') return
  
  const warnings: string[] = []
  
  if (!process.env.PAYMOB_API_KEY) {
    warnings.push('Payment integration (Paymob) not configured')
  }
  
  if (!process.env.SMTP_HOST) {
    warnings.push('Email service not configured')
  }
  
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    warnings.push('Push notifications not configured')
  }
  
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    warnings.push('Redis rate limiting not configured (using in-memory fallback)')
  }
  
  if (!process.env.CRON_SECRET) {
    warnings.push('Cron job security not configured')
  }
  
  if (warnings.length > 0) {
    console.log('\nOptional services not configured:')
    warnings.forEach(w => console.log(`  - ${w}`))
    console.log('See FUTURE_UPGRADE_GUIDE.md for setup instructions\n')
  }
}

// Validate on import in server environment
if (typeof window === 'undefined') {
  validateEnv()
  logEnvWarnings()
}

export const env = validatedEnv || ({} as Env)
