// sw.js - Service Worker
const CACHE_NAME = 'antihero-v2.0';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/charts.js',
    '/js/export.js',
    '/js/i18n.js'
];

const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip Chrome extensions and devtools
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version and update cache in background
                    event.waitUntil(
                        fetch(event.request)
                            .then(response => {
                                if (response.ok) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(event.request, response));
                                }
                            })
                            .catch(() => {})
                    );
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // Cache successful responses
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseToCache));
                        
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Background sync for offline saves
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-entries') {
        event.waitUntil(syncEntries());
    }
});

async function syncEntries() {
    // This would sync IndexedDB data with a server if one existed
    console.log('Background sync triggered');
}

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || 'Не забудь отметить день!',
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            date: new Date().toISOString()
        },
        actions: [
            { action: 'open', title: 'Открыть' },
            { action: 'dismiss', title: 'Закрыть' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('АНТИГЕРОЙ', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
