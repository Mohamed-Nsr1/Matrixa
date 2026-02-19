'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWA } from './PWAProvider';

export function UpdateNotification() {
  const { status, updateApp } = usePWA();

  if (!status.hasUpdate) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="p-4 border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm shadow-lg">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">تحديث متاح</h3>
                  <p className="text-sm text-muted-foreground">إصدار جديد من Matrixa</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              هناك إصدار جديد متاح. حدّث الآن للحصول على أحدث الميزات والإصلاحات.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                لاحقاً
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={updateApp}
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Online/Offline status indicator
export function OnlineStatusIndicator() {
  const { status } = usePWA();

  if (status.isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
      <Card className="p-3 bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span>أنت غير متصل بالإنترنت</span>
        </div>
      </Card>
    </div>
  );
}
