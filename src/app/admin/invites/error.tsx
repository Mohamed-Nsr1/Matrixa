'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminInvitesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin invites error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">حدث خطأ</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'حدث خطأ أثناء تحميل إدارة رموز الدعوة. يرجى المحاولة مرة أخرى.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default">
            حاول مرة أخرى
          </Button>
          <Button onClick={() => window.location.href = '/admin'} variant="outline">
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    </div>
  )
}
