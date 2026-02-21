/**
 * PARAGON Coaching Center - Service Worker
 * ===========================================
 * Cache Strategy:
 *   - Cache First: static assets (CSS, JS, fonts, images, icons)
 *   - Network First: API calls (always fresh data, fallback to cache)
 *   - Offline Fallback: branded offline.html when no cache and no network
 *
 * Security:
 *   - Only GET requests are cached
 *   - Never caches POST/login or sensitive API responses
 *
 * Version Management:
 *   - Bump CACHE_VERSION to deploy a new SW and clear old caches
 */

// ─── Cache Version ───────────────────────────────────────────────
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `paragon-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `paragon-dynamic-${CACHE_VERSION}`;
const API_CACHE = `paragon-api-${CACHE_VERSION}`;

// ─── Assets to Pre-cache ─────────────────────────────────────────
const PRE_CACHE_ASSETS = [
    '/offline.html',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// ─── Install Event ───────────────────────────────────────────────
// Pre-cache essential offline assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker:', CACHE_VERSION);
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Pre-caching offline assets');
                return cache.addAll(PRE_CACHE_ASSETS);
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// ─── Activate Event ──────────────────────────────────────────────
// Clean up old caches from previous versions
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker:', CACHE_VERSION);
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete caches that don't match current version
                            return name.startsWith('paragon-') &&
                                name !== STATIC_CACHE &&
                                name !== DYNAMIC_CACHE &&
                                name !== API_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Take control of all open clients immediately
                return self.clients.claim();
            })
            .then(() => {
                // Store the last sync time
                return caches.open(STATIC_CACHE).then((cache) => {
                    const syncResponse = new Response(new Date().toISOString());
                    return cache.put('/__last_sync_time', syncResponse);
                });
            })
    );
});

// ─── Fetch Event ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // SECURITY: Only cache GET requests
    if (request.method !== 'GET') return;

    // Skip caching for Chrome extensions, dev tools, etc.
    if (!url.protocol.startsWith('http')) return;

    // Skip caching for WebSocket connections
    if (url.protocol === 'wss:' || url.protocol === 'ws:') return;

    // ── API Requests: Network First ──
    if (url.pathname.startsWith('/api/')) {
        // Never cache auth-related API calls
        if (url.pathname.includes('/auth/')) return;

        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }

    // ── Static Assets: Cache First ──
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // ── HTML Navigation: Network First with offline fallback ──
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(navigationStrategy(request));
        return;
    }

    // ── Everything else: Network First ──
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// ─── Cache Strategies ────────────────────────────────────────────

/**
 * Cache First Strategy
 * Best for: static assets that rarely change (CSS, JS, fonts, images)
 * Tries cache first, falls back to network and caches the response
 */
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If both cache and network fail, try the offline page for HTML
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}

/**
 * Network First Strategy
 * Best for: API calls and dynamic content (always try fresh data)
 * Tries network first, falls back to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
            // Update last sync time on successful API fetch
            if (cacheName === API_CACHE) {
                const syncCache = await caches.open(STATIC_CACHE);
                await syncCache.put('/__last_sync_time', new Response(new Date().toISOString()));
            }
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return new Response(
            JSON.stringify({ success: false, message: 'You are offline' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Navigation Strategy
 * For HTML page requests — try network, fall back to offline.html
 */
async function navigationStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        // Cache the navigation response for offline use
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Try to serve a cached version of the page
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        // Last resort: serve the offline page
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) return offlinePage;

        return new Response('<h1>Offline</h1>', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// ─── Helper Functions ────────────────────────────────────────────

/**
 * Check if a URL path is a static asset that should use cache-first
 */
function isStaticAsset(pathname) {
    const staticExtensions = [
        '.css', '.js', '.mjs',
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
        '.woff', '.woff2', '.ttf', '.eot', '.otf',
        '.json', '.webmanifest'
    ];
    return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// ─── Background Sync (for form submissions that fail offline) ───
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[SW] Background sync triggered');
        event.waitUntil(
            // Process any queued requests
            processBackgroundSync()
        );
    }
});

async function processBackgroundSync() {
    try {
        // Check if there are queued requests in IndexedDB
        // This is a placeholder — integrate with your form submission logic
        console.log('[SW] Processing background sync queue...');
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// ─── Push Notifications (future-ready) ──────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const title = data.title || 'PARAGON Coaching Center';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/student' }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/student';
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Focus if already open
            for (const client of clients) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new tab
            return self.clients.openWindow(url);
        })
    );
});
