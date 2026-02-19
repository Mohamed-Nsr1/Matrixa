/**
 * Environment Variables Validation
 * 
 * Validates required environment variables at startup
 */

import { z } from 'zod'

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  
  // Optional but recommended
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Payment (optional - for future Paymob integration)
  PAYMOB_API_KEY: z.string().optional(),
  PAYMOB_INTEGRATION_ID: z.string().optional(),
  PAYMOB_IFRAME_ID: z.string().optional(),
  PAYMOB_HMAC_SECRET: z.string().optional(),
  
  // Email (optional - for future SMTP integration)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Push Notifications (optional)
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  
  // Redis (optional - for scalable rate limiting)
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
    
    console.error('\n❌ Environment validation failed:\n' + errors + '\n')
    
    // In development, allow missing optional vars
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Running in development mode with missing optional variables')
      const partialEnv: Record<string, string | undefined> = {}
      
      // Get what we can from process.env
      for (const key of Object.keys(envSchema.shape)) {
        partialEnv[key] = process.env[key]
      }
      
      // Set defaults for required fields if missing
      if (!partialEnv.JWT_SECRET) {
        partialEnv.JWT_SECRET = 'dev-jwt-secret-do-not-use-in-production-32ch'
        console.warn('⚠️ Using default JWT_SECRET for development')
      }
      if (!partialEnv.JWT_REFRESH_SECRET) {
        partialEnv.JWT_REFRESH_SECRET = 'dev-refresh-secret-do-not-use-in-prod-32ch'
        console.warn('⚠️ Using default JWT_REFRESH_SECRET for development')
      }
      
      validatedEnv = partialEnv as unknown as Env
      return validatedEnv
    }
    
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
    console.log('\n⚠️ Optional services not configured:')
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
