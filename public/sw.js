/// <reference lib="webworker" />

// Minimal passthrough service worker for development/preview environments
// Does not cache anything to avoid authentication and redirect issues

const CACHE_VERSION = 'matrixa-passthrough-v1';

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker (passthrough mode)...');
  event.waitUntil(self.skipWaiting());
});

// Activate event - claim clients and clear old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker (passthrough mode)...');
  
  event.waitUntil(
    Promise.all([
      // Clear ALL old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim(),
    ])
  );
});

// Fetch event - complete passthrough, no caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // For navigation requests, always fetch from network
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache navigation responses
          return response;
        })
        .catch((error) => {
          console.log('[SW] Navigation fetch failed:', error);
          // Return a simple offline page
          return new Response(
            `<!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>غير متصل - Matrixa</title>
              <style>
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  background: #0f0a1a;
                  color: #fff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                  text-align: center;
                }
                .container { max-width: 400px; }
                h1 { color: #8b5cf6; margin-bottom: 16px; }
                p { color: #a1a1aa; margin-bottom: 24px; }
                button {
                  background: #8b5cf6;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 16px;
                }
                button:hover { background: #7c3aed; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔌 غير متصل بالإنترنت</h1>
                <p>يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.</p>
                <button onclick="location.reload()">إعادة المحاولة</button>
              </div>
            </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // For all other requests, just fetch from network (no caching)
  event.respondWith(fetch(request));
});

// Handle message from client
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Clear all caches on demand
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map((name) => caches.delete(name)));
    });
  }
});

console.log('[SW] Service worker loaded (passthrough mode - no caching)');
