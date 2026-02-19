/// <reference lib="webworker" />

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
}

export interface PWARegistration {
  registration: ServiceWorkerRegistration | null;
  installPrompt: BeforeInstallPromptEvent | null;
  status: PWAStatus;
}

// Check if the app is running as a PWA
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS standalone mode
  const isIOSStandalone = ('standalone' in window.navigator) && 
    (window.navigator as Navigator & { standalone?: boolean }).standalone;
  
  return isStandalone || !!isIOSStandalone;
}

// Detect platform
export function detectPlatform(): 'android' | 'ios' | 'desktop' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('android')) {
    return 'android';
  }
  
  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
    return 'ios';
  }
  
  if (userAgent.includes('mobile')) {
    return 'android'; // Default mobile to android
  }
  
  if (userAgent.includes('windows') || userAgent.includes('mac') || userAgent.includes('linux')) {
    return 'desktop';
  }
  
  return 'unknown';
}

// Check if device supports PWA
export function supportsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for service worker support
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  // Check for manifest support
  const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (!link) {
    return false;
  }
  
  return true;
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[PWA] Service Worker registered:', registration.scope);
    
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            console.log('[PWA] New content available, refresh to update');
            window.dispatchEvent(new CustomEvent('pwa-update-available'));
          }
        });
      }
    });
    
    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

// Check for service worker updates
export async function checkForUpdates(registration: ServiceWorkerRegistration | null): Promise<boolean> {
  if (!registration) return false;
  
  try {
    await registration.update();
    return true;
  } catch (error) {
    console.error('[PWA] Failed to check for updates:', error);
    return false;
  }
}

// Activate the waiting service worker
export function activateUpdate(): void {
  if (typeof window === 'undefined') return;
  
  // Tell the waiting service worker to activate
  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
}

// Prompt user to install the PWA
export async function promptInstall(
  installPrompt: BeforeInstallPromptEvent | null
): Promise<'accepted' | 'dismissed' | 'error'> {
  if (!installPrompt) {
    console.log('[PWA] Install prompt not available');
    return 'error';
  }
  
  try {
    // Show the install prompt
    await installPrompt.prompt();
    
    // Wait for the user's response
    const { outcome } = await installPrompt.userChoice;
    
    console.log('[PWA] User response to install prompt:', outcome);
    
    return outcome;
  } catch (error) {
    console.error('[PWA] Failed to show install prompt:', error);
    return 'error';
  }
}

// Cache specific URLs
export async function cacheUrls(urls: string[]): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  if (!navigator.serviceWorker.controller) {
    console.log('[PWA] No service worker controller');
    return false;
  }
  
  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_URLS',
    urls,
  });
  
  return true;
}

// Listen for messages from service worker
export function listenToServiceWorker(
  callback: (data: { type: string; data?: unknown }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: MessageEvent) => {
    callback(event.data);
  };
  
  navigator.serviceWorker.addEventListener('message', handler);
  
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

// Request background sync
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  const registration = await navigator.serviceWorker.ready;
  
  if (!('sync' in registration)) {
    console.log('[PWA] Background sync not supported');
    return false;
  }
  
  try {
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
    console.log('[PWA] Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('[PWA] Failed to register background sync:', error);
    return false;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null;
  
  const registration = await navigator.serviceWorker.ready;
  
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });
    
    console.log('[PWA] Push subscription:', subscription);
    
    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push notifications:', error);
    return null;
  }
}

// Convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Get current PWA status
export function getPWAStatus(): PWAStatus {
  return {
    isInstalled: isPWA(),
    isInstallable: false, // Will be set by the install prompt event
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasUpdate: false, // Will be set by the update event
    platform: detectPlatform(),
  };
}

// iOS specific instructions
export function getIOSInstallInstructions(): string[] {
  return [
    'اضغط على زر المشاركة',
    'اختر "إضافة إلى الشاشة الرئيسية"',
    'اضغط "إضافة" في الأعلى',
  ];
}

// Android specific instructions
export function getAndroidInstallInstructions(): string[] {
  return [
    'اضغط على قائمة المتصفح (⋮)',
    'اختر "تثبيت التطبيق"',
    'اضغط "تثبيت"',
  ];
}

// Desktop specific instructions
export function getDesktopInstallInstructions(): string[] {
  return [
    'انقر على أيقونة التثبيت في شريط العنوان',
    'أو اختر "تثبيت Matrixa" من قائمة المتصفح',
  ];
}

// Get install instructions for current platform
export function getInstallInstructions(): string[] {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'ios':
      return getIOSInstallInstructions();
    case 'android':
      return getAndroidInstallInstructions();
    case 'desktop':
      return getDesktopInstallInstructions();
    default:
      return [];
  }
}
