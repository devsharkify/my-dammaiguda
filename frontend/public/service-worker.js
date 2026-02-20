/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'my-dammaiguda-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
];

const API_CACHE_NAME = 'my-dammaiguda-api-v1';
const CACHEABLE_API_ROUTES = [
  '/api/aqi/current',
  '/api/news/categories',
  '/api/benefits',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Push notification event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'My Dammaiguda', body: event.data.text() };
    }
  }
  
  const title = data.title || 'My Dammaiguda';
  const options = {
    body: data.body || 'మీకు కొత్త నోటిఫికేషన్ వచ్చింది',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    tag: data.category || 'default',
    renotify: true,
    actions: [
      { action: 'open', title: 'తెరవండి' },
      { action: 'close', title: 'మూసివేయండి' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle notification interactions
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Determine which page to open based on notification data
  const data = event.notification.data || {};
  let targetUrl = '/dashboard';
  
  if (data.category === 'sos') {
    targetUrl = '/family';
  } else if (data.category === 'news') {
    targetUrl = '/news';
  } else if (data.category === 'community') {
    targetUrl = '/wall';
  } else if (data.category === 'health') {
    targetUrl = '/fitness';
  } else if (data.category === 'geofence') {
    targetUrl = '/family';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests - Network first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.includes(route));

  try {
    const response = await fetch(request);
    
    // Cache successful GET responses for cacheable routes
    if (response.ok && isCacheable) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', url.pathname);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'You are offline. Please check your connection.',
        message_te: 'మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. దయచేసి మీ కనెక్షన్ తనిఖీ చేయండి.'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests - Cache first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version and update cache in background
    updateCache(request);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    // Cache the new response
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for static asset:', request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) return offlineResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Update cache in background
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - we already have cached version
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-issues') {
    event.waitUntil(syncPendingIssues());
  }
});

async function syncPendingIssues() {
  // Get pending issues from IndexedDB and sync
  console.log('[SW] Syncing pending issues...');
}

// Periodic Background Sync - fetch fresh data periodically
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'update-aqi') {
    event.waitUntil(updateAQIData());
  }
  
  if (event.tag === 'update-news') {
    event.waitUntil(updateNewsData());
  }
  
  if (event.tag === 'sync-content') {
    event.waitUntil(syncAllContent());
  }
});

// Update AQI data in background
async function updateAQIData() {
  try {
    const response = await fetch('/api/aqi/current');
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put('/api/aqi/current', response.clone());
      console.log('[SW] AQI data updated in background');
    }
  } catch (error) {
    console.log('[SW] Failed to update AQI:', error);
  }
}

// Update news data in background
async function updateNewsData() {
  try {
    const response = await fetch('/api/news/local?limit=10');
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put('/api/news/local?limit=10', response.clone());
      console.log('[SW] News data updated in background');
    }
  } catch (error) {
    console.log('[SW] Failed to update news:', error);
  }
}

// Sync all content
async function syncAllContent() {
  await Promise.all([
    updateAQIData(),
    updateNewsData()
  ]);
  console.log('[SW] All content synced');
}

// Register periodic sync when service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      
      // Register periodic sync if supported
      if ('periodicSync' in self.registration) {
        try {
          await self.registration.periodicSync.register('sync-content', {
            minInterval: 12 * 60 * 60 * 1000 // 12 hours
          });
          console.log('[SW] Periodic sync registered');
        } catch (error) {
          console.log('[SW] Periodic sync not available:', error);
        }
      }
      
      self.clients.claim();
    })()
  );
});

console.log('[SW] Service worker loaded');
