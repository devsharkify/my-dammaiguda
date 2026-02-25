/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'my-dammaiguda-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
];

const API_CACHE_NAME = 'my-dammaiguda-api-v3';
const CACHEABLE_API_ROUTES = [
  '/api/aqi/both',
  '/api/aqi/current',
  '/api/news/local',
  '/api/news/categories',
  '/api/benefits',
  '/api/panchangam/today',
  '/api/astrology/horoscope',
];

// Cache duration in milliseconds
const CACHE_DURATIONS = {
  panchangam: 24 * 60 * 60 * 1000,  // 24 hours (refreshes daily)
  aqi: 30 * 60 * 1000,              // 30 minutes
  news: 60 * 60 * 1000,             // 1 hour
  default: 12 * 60 * 60 * 1000      // 12 hours
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v4...');
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
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: data.url },
    tag: data.tag || data.category || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'తెరవండి' },
      { action: 'close', title: 'మూసివేయండి' }
    ],
    // Add image if provided
    ...(data.image && { image: data.image })
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
  let targetUrl = data.url || '/dashboard';
  
  // Category-based routing
  const categoryRoutes = {
    'grievance': '/issues',
    'news': '/news',
    'panchangam': '/astrology',
    'announcement': '/wall',
    'health': '/fitness',
    'aqi': '/dashboard',
    'sos': '/family',
    'community': '/wall',
    'geofence': '/family'
  };
  
  if (data.category && categoryRoutes[data.category]) {
    targetUrl = categoryRoutes[data.category];
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

  // API requests - Network first, cache fallback with smart caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests - Network first strategy with smart caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.includes(route));
  
  // Determine cache duration based on API type
  let cacheDuration = CACHE_DURATIONS.default;
  if (url.pathname.includes('/panchangam')) {
    cacheDuration = CACHE_DURATIONS.panchangam;
  } else if (url.pathname.includes('/aqi')) {
    cacheDuration = CACHE_DURATIONS.aqi;
  } else if (url.pathname.includes('/news')) {
    cacheDuration = CACHE_DURATIONS.news;
  }

  try {
    const response = await fetch(request);
    
    // Cache successful GET responses for cacheable routes
    if (response.ok && isCacheable) {
      const cache = await caches.open(API_CACHE_NAME);
      const responseToCache = response.clone();
      
      // Add timestamp to cached response headers
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', url.pathname);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        if (age < cacheDuration) {
          console.log('[SW] Serving from cache (age:', Math.round(age/1000), 's)');
          return cachedResponse;
        }
      }
      // Even if expired, return stale cache when offline
      console.log('[SW] Serving stale cache (offline)');
      return cachedResponse;
    }
    
    // Return offline response for API
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'You are offline. Please check your connection.',
        message_te: 'మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. దయచేసి మీ కనెక్షన్ తనిఖీ చేయండి.',
        cached: false
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
          // Register location sync (more frequent - every 15 mins)
          await self.registration.periodicSync.register('sync-location', {
            minInterval: 15 * 60 * 1000 // 15 minutes
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

// Background Sync for location updates
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocationInBackground());
  } else if (event.tag === 'sync-content') {
    event.waitUntil(syncAllContent());
  }
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocationInBackground());
  } else if (event.tag === 'sync-content') {
    event.waitUntil(syncAllContent());
  }
});

// Background Location Sync Function
async function syncLocationInBackground() {
  console.log('[SW] Syncing location in background...');
  
  try {
    // Get stored auth token and location permission status
    const storedData = await getStoredData();
    
    if (!storedData.token || !storedData.locationEnabled) {
      console.log('[SW] No token or location not enabled');
      return;
    }
    
    // Use Geolocation API (works in service worker on some platforms)
    if ('geolocation' in navigator) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        });
      });
      
      // Send location to server
      const response = await fetch('/api/family/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedData.token}`
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          battery_level: await getBatteryLevel()
        })
      });
      
      if (response.ok) {
        console.log('[SW] Location synced successfully');
      }
    }
  } catch (error) {
    console.log('[SW] Background location sync failed:', error);
  }
}

// Get stored data from IndexedDB
async function getStoredData() {
  return new Promise((resolve) => {
    // Default values
    const defaults = { token: null, locationEnabled: false };
    
    try {
      // Try to get from IndexedDB
      const request = indexedDB.open('dammaiguda_sw', 1);
      
      request.onerror = () => resolve(defaults);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          resolve(defaults);
          return;
        }
        
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const getRequest = store.get('auth');
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || defaults);
        };
        getRequest.onerror = () => resolve(defaults);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    } catch (e) {
      resolve(defaults);
    }
  });
}

// Get battery level
async function getBatteryLevel() {
  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      return Math.round(battery.level * 100);
    }
  } catch (e) {
    console.log('[SW] Battery API not available');
  }
  return null;
}

// Handle location request from family member
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'ENABLE_BACKGROUND_LOCATION') {
    // Store auth token for background sync
    storeAuthData(event.data.token, true);
  } else if (event.data && event.data.type === 'DISABLE_BACKGROUND_LOCATION') {
    storeAuthData(null, false);
  } else if (event.data && event.data.type === 'REQUEST_LOCATION_NOW') {
    // Immediately sync location
    syncLocationInBackground();
  }
});

// Store auth data in IndexedDB for background access
async function storeAuthData(token, locationEnabled) {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('dammaiguda_sw', 1);
      
      request.onerror = () => resolve(false);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        
        store.put({ id: 'auth', token, locationEnabled });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    } catch (e) {
      resolve(false);
    }
  });
}

console.log('[SW] Service worker loaded with background location support');
