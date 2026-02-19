'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  const handleRefresh = () => {
    router.refresh()
    reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">خطأ في لوحة التحكم</h1>
        <p className="text-muted-foreground mb-6">
          حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
          <Link href="/dashboard">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              الصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
