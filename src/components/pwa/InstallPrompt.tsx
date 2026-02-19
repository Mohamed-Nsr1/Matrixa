'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWA } from './PWAProvider';
import { getInstallInstructions, detectPlatform } from '@/lib/pwa';

export function InstallPrompt() {
  const { status, showInstallPrompt, isInstallPromptDismissed, dismissInstallPrompt } = usePWA();
  const [isLoading, setIsLoading] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const platform = detectPlatform();
  const instructions = getInstallInstructions();

  // Don't show if already installed, not installable, or dismissed
  if (status.isInstalled || !status.isInstallable || isInstallPromptDismissed) {
    return null;
  }

  const handleInstall = async () => {
    // iOS requires manual install instructions
    if (platform === 'ios') {
      setShowIOSInstructions(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await showInstallPrompt();
      if (result === 'dismissed') {
        dismissInstallPrompt();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="p-4 border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm shadow-lg">
          {!showIOSInstructions ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <img 
                      src="/icons/icon-96x96.png" 
                      alt="Matrixa" 
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">ثبّت التطبيق</h3>
                    <p className="text-sm text-muted-foreground">Matrixa</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={dismissInstallPrompt}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                أضف Matrixa إلى شاشتك الرئيسية للوصول السريع وتجربة أفضل
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={dismissInstallPrompt}
                >
                  لاحقاً
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleInstall}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  {isLoading ? 'جاري التثبيت...' : 'تثبيت'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowIOSInstructions(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-bold text-foreground">تثبيت على iPhone/iPad</h3>
              </div>

              <div className="space-y-3">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {index === 0 && <Share className="h-4 w-4 text-primary" />}
                      {index === 1 && <Plus className="h-4 w-4 text-primary" />}
                      {index === 2 && <Smartphone className="h-4 w-4 text-primary" />}
                      <span>{instruction}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={dismissInstallPrompt}
              >
                فهمت
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact install button for header/navbar
export function InstallButton() {
  const { status, showInstallPrompt, isInstallPromptDismissed } = usePWA();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show if already installed or dismissed
  if (status.isInstalled || !status.isInstallable || isInstallPromptDismissed) {
    return null;
  }

  const handleInstall = async () => {
    setIsLoading(true);
    try {
      await showInstallPrompt();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleInstall}
      disabled={isLoading}
    >
      <Download className="h-4 w-4" />
      {isLoading ? 'جاري...' : 'تثبيت'}
    </Button>
  );
}
