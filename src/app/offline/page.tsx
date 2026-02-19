'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WifiOff, RefreshCw, Home, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  useEffect(() => {
    // Register service worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('Service worker ready')
      })
    }
  }, [])

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
      <Card className="w-full max-w-md border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-primary/20 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-violet-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3 bg-gradient-to-l from-white to-white/70 bg-clip-text text-transparent">
            غير متصل بالإنترنت
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            يبدو أنك غير متصل بالإنترنت حالياً. تحقق من اتصالك بالشبكة وحاول مرة أخرى.
          </p>

          {/* Tips */}
          <div className="bg-white/[0.02] rounded-lg p-4 mb-6 text-right">
            <h3 className="text-sm font-medium mb-2 text-violet-400">نصائح:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• تحقق من اتصال الواي فاي أو البيانات</li>
              <li>• حاول تشغيل وضع الطيران وإيقافه</li>
              <li>• يمكنك تصفح المحتوى المحفوظ مسبقاً</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full bg-gradient-to-l from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>

            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>

          {/* PWA hint */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <BookOpen className="w-3 h-3" />
              تم تثبيت التطبيق؟ يمكنك استخدامه بدون إنترنت
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
