'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wrench, RefreshCw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MaintenancePage() {
  const [countdown, setCountdown] = useState(300) // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Wrench className="w-12 h-12 text-amber-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">صيانة النظام</h1>
        <p className="text-muted-foreground mb-6 text-lg">
          نقوم حالياً بتحديث النظام لتحسين تجربتك.
          <br />
          يرجى المحاولة مرة أخرى بعد قليل.
        </p>

        {/* Countdown */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">الوقت المتبقي للتحقق</span>
          </div>
          <p className="text-2xl font-mono font-bold text-primary">
            {formatTime(countdown)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full">
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground mt-8">
          نتعتذر عن أي إزعاج. نشكرك على صبرك.
        </p>
      </div>
    </div>
  )
}
