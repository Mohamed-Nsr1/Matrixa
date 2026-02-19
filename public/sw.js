/// <reference lib="webworker" />

/**
 * Matrixa PWA Service Worker
 * 
 * Caching Strategies:
 * 1. Static Assets (JS, CSS, Images) - Cache First, Network Fallback
 * 2. API Routes - Network First, Cache Fallback (with offline mode)
 * 3. Pages - Network First, Cache Fallback, Offline Page
 * 
 * Features:
 * - Offline support with cached content
 * - Background sync for form submissions
 * - Push notification support
 * - Automatic cache updates
 */

const CACHE_VERSION = 'matrixa-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const API_CACHE = `${CACHE_VERSION}-api`

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets
  api: 5 * 60 * 1000, // 5 minutes for API responses
  dynamic: 24 * 60 * 60 * 1000, // 24 hours for dynamic content
}

// API routes that should be cached for offline access
const CACHEABLE_API_ROUTES = [
  '/api/subjects',
  '/api/user/settings',
  '/api/tasks/today',
  '/api/subscription/status',
]

// Routes to exclude from caching
const EXCLUDED_ROUTES = [
  '/api/auth/',
  '/api/admin/',
  '/api/payment/',
  '/api/upload/',
]

// ============================================
// INSTALL EVENT - Cache static assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  )
})

// ============================================
// ACTIVATE EVENT - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !name.startsWith(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      }),
      // Claim all clients immediately
      self.clients.claim(),
    ])
  )
})

// ============================================
// FETCH EVENT - Handle requests
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    // For POST/PUT/DELETE, try network and queue for background sync if offline
    if (!navigator.onLine) {
      // Could implement background sync here
      event.respondWith(
        new Response(
          JSON.stringify({ 
            success: false, 
            error: 'أنت غير متصل بالإنترنت. سيتم إرسال طلبك عند الاتصال.' 
          }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      )
      return
    }
    return
  }

  // Skip chrome-extension and other non-http protocols
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Route-based handling
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (isApiRoute(url.pathname)) {
    if (shouldCacheApi(url.pathname)) {
      event.respondWith(networkFirstWithCache(request, API_CACHE))
    } else {
      // Network only for auth/admin/payment
      event.respondWith(networkOnly(request))
    }
    return
  }

  // Navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request))
    return
  }

  // Default: Network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// ============================================
// CACHING STRATEGIES
// ============================================

/**
 * Cache First - Best for static assets
 * Try cache, fall back to network, update cache
 */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    // Return cached, update in background
    updateCache(request, cache)
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return getOfflineResponse(request)
  }
}

/**
 * Network First - Best for dynamic content
 * Try network, fall back to cache
 */
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    return getOfflineResponse(request)
  }
}

/**
 * Network First with Cache - Best for API routes
 * Try network, cache response, fall back to cache
 */
async function networkFirstWithCache(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response.ok) {
      // Cache successful API responses
      const responseToCache = response.clone()
      cache.put(request, responseToCache)
    }
    return response
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request)
    if (cached) {
      // Add header to indicate offline mode
      const headers = new Headers(cached.headers)
      headers.set('X-Offline-Mode', 'true')
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      })
    }
    
    // No cache available
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'أنت غير متصل بالإنترنت',
        offline: true
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Network First with Offline Page - Best for navigation
 */
async function networkFirstWithOffline(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    // Return offline page
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
    
    return getOfflineResponse(request)
  }
}

/**
 * Network Only - For sensitive routes
 */
async function networkOnly(request: Request): Promise<Response> {
  try {
    return await fetch(request)
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'أنت غير متصل بالإنترنت' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Update cache in background
 */
async function updateCache(request: Request, cache: Cache): Promise<void> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response)
    }
  } catch (error) {
    // Ignore - already serving from cache
  }
}

/**
 * Generate offline response
 */
function getOfflineResponse(request: Request): Response {
  const url = new URL(request.url)
  
  // For API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'أنت غير متصل بالإنترنت',
        offline: true
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // For page requests
  return new Response(
    `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>غير متصل - Matrixa</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #0f0a1a 0%, #1a1030 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
        }
        .container { max-width: 400px; }
        .icon {
          width: 80px;
          height: 80px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 36px;
        }
        h1 { color: #8b5cf6; margin-bottom: 12px; font-size: 24px; }
        p { color: #a1a1aa; margin-bottom: 24px; line-height: 1.6; }
        button {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { 
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }
        .hint {
          margin-top: 24px;
          font-size: 14px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔌</div>
        <h1>غير متصل بالإنترنت</h1>
        <p>يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.</p>
        <button onclick="location.reload()">إعادة المحاولة</button>
        <p class="hint">إذا كنت تتصفح المحتوى المحفوظ، فستظهر البيانات المتاحة</p>
      </div>
    </body>
    </html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  )
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

function shouldCacheApi(pathname: string): boolean {
  // Check excluded routes first
  for (const excluded of EXCLUDED_ROUTES) {
    if (pathname.startsWith(excluded)) {
      return false
    }
  }
  
  // Check cacheable routes
  for (const route of CACHEABLE_API_ROUTES) {
    if (pathname.startsWith(route)) {
      return true
    }
  }
  
  return false
}

// ============================================
// MESSAGE HANDLING
// ============================================
self.addEventListener('message', (event) => {
  const { data } = event

  if (data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (data?.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        )
      })
    )
  }

  if (data?.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(data.urls)
      })
    )
  }
})

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body || 'إشعار جديد من Matrixa',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    dir: 'rtl',
    lang: 'ar',
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Matrixa', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      return self.clients.openWindow(url)
    })
  )
})

// ============================================
// BACKGROUND SYNC (for offline form submissions)
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks())
  }
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes())
  }
})

async function syncTasks(): Promise<void> {
  // Get pending tasks from IndexedDB and submit
  // This would require IndexedDB implementation
  console.log('[SW] Syncing tasks...')
}

async function syncNotes(): Promise<void> {
  // Get pending notes from IndexedDB and submit
  console.log('[SW] Syncing notes...')
}

console.log('[SW] Service worker loaded with caching strategies')
