'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/dashboard';
    } else {
      // Force check
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <div className="text-center space-y-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <WifiOff className="w-10 h-10 text-primary" />
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                غير متصل بالإنترنت
              </h1>
              <p className="text-muted-foreground">
                يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.
              </p>
            </div>

            {/* Status */}
            {isOnline && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <p className="text-sm text-green-500 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  عُد الاتصال بالإنترنت!
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleRetry}
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </Button>
              <Button
                className="flex-1 gap-2"
                asChild
              >
                <Link href="/dashboard">
                  <Home className="w-4 h-4" />
                  الرئيسية
                </Link>
              </Button>
            </div>

            {/* Cached Content Info */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>بعض المحتويات قد تكون متاحة من الذاكرة المؤقتة</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
