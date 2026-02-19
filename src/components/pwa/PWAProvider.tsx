'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  registerServiceWorker,
  activateUpdate,
  type BeforeInstallPromptEvent,
  type PWAStatus,
  detectPlatform,
  isPWA,
} from '@/lib/pwa';

interface PWAContextType {
  status: PWAStatus;
  installPrompt: BeforeInstallPromptEvent | null;
  showInstallPrompt: () => Promise<'accepted' | 'dismissed' | 'error'>;
  updateApp: () => void;
  isInstallPromptDismissed: boolean;
  dismissInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: true,
    hasUpdate: false,
    platform: 'unknown',
  });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallPromptDismissed, setIsInstallPromptDismissed] = useState(false);

  // Initialize PWA
  useEffect(() => {
    // Check if dismissed from localStorage
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsInstallPromptDismissed(true);
    }

    // Set initial status
    setStatus((prev) => ({
      ...prev,
      isInstalled: isPWA(),
      isOnline: navigator.onLine,
      platform: detectPlatform(),
    }));

    // Register service worker
    registerServiceWorker();

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event fired');
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setStatus((prev) => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setInstallPrompt(null);
      setStatus((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
      }));
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    // Listen for update available event
    const handleUpdateAvailable = () => {
      console.log('[PWA] Update available');
      setStatus((prev) => ({ ...prev, hasUpdate: true }));
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  // Show install prompt
  const showInstallPrompt = useCallback(async (): Promise<'accepted' | 'dismissed' | 'error'> => {
    if (!installPrompt) {
      return 'error';
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setStatus((prev) => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
        }));
      }
      
      return outcome;
    } catch (error) {
      console.error('[PWA] Failed to show install prompt:', error);
      return 'error';
    }
  }, [installPrompt]);

  // Update app
  const updateApp = useCallback(() => {
    activateUpdate();
    window.location.reload();
  }, []);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setIsInstallPromptDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  return (
    <PWAContext.Provider
      value={{
        status,
        installPrompt,
        showInstallPrompt,
        updateApp,
        isInstallPromptDismissed,
        dismissInstallPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
