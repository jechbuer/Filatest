// 🔧 Service Worker für Filatest Pro
// Mit Offline-Support und Background-Sync

const CACHE_NAME = 'filatest-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/config/firebase.js',
    '/js/config/constants.js',
    '/js/services/db.js',
    '/js/services/masterData.js',
    '/js/services/filamentDictionary.js',
    '/js/services/consumptionLog.js',
    '/js/services/labelPrinter.js',
    '/js/services/lowStockAlert.js',
    '/js/ui/components.js',
    '/js/ui/scanner.js',
    '/data/bambu-pla-basic.json',
    '/data/bambu-petg-basic.json',
    '/data/bambu-abs.json',
    '/data/bambu-tpu.json',
    '/manifest.json',
    '/pwa-install.js',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap',
    'https://unpkg.com/html5-qrcode',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Installation: Assets cachen
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Install complete');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[SW] Cache failed:', err);
            })
    );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch-Handler: Cache-First Strategie
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Firebase und API-Requests nicht cachen
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic')) {
        return;
    }
    
    // API-Requests: Network-First mit Cache-Fallback
    if (request.method === 'POST' || request.headers.get('accept')?.includes('application/json')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Statische Assets: Cache-First
    event.respondWith(cacheFirst(request));
});

// Cache-First Strategie
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        // Im Hintergrund aktualisieren
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
            })
            .catch(() => {});
        
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        // Fallback für HTML
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        throw error;
    }
}

// Network-First Strategie
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache');
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

// 🔁 Background-Sync für Offline-Operationen
const syncQueue = [];

self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);
    
    if (event.tag === 'sync-filaments') {
        event.waitUntil(processSyncQueue());
    }
});

// Sync-Queue verarbeiten
async function processSyncQueue() {
    console.log('[SW] Processing sync queue:', syncQueue.length, 'items');
    
    while (syncQueue.length > 0) {
        const item = syncQueue.shift();
        try {
            await syncToFirebase(item);
        } catch (error) {
            console.error('[SW] Sync failed:', error);
            syncQueue.push(item); // Wieder in Queue
            break;
        }
    }
    
    // Benachrichtigung anzeigen wenn alles synchronisiert
    if (syncQueue.length === 0) {
        await showNotification('✅ Synchronisierung abgeschlossen', 'Alle Daten sind jetzt auf dem neuesten Stand.');
    }
}

async function syncToFirebase(item) {
    // Dies würde die Firebase API aufrufen
    // Für jetzt nur simuliert
    console.log('[SW] Syncing:', item);
}

// 📩 Push-Notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    const data = event.data?.json() || {
        title: 'Filatest',
        body: 'Neue Benachrichtigung',
        icon: '/icons/icon-192x192.png'
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: data.tag || 'default',
            requireInteraction: data.requireInteraction || false,
            actions: data.actions || [],
            data: data.data || {}
        })
    );
});

// Notification Klick
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Existierenden Client fokussieren
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus().then((client) => {
                            // Nachricht an Client senden
                            if (action && data) {
                                client.postMessage({
                                    type: 'NOTIFICATION_ACTION',
                                    action,
                                    data
                                });
                            }
                        });
                    }
                }
                // Neuen Client öffnen
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// 📨 Nachrichten vom Main-Thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SYNC_FILAMENT':
            syncQueue.push(payload);
            // Sync registrieren wenn möglich
            if ('sync' in self.registration) {
                self.registration.sync.register('sync-filaments')
                    .catch((err) => console.error('[SW] Sync registration failed:', err));
            }
            break;
            
        case 'GET_SYNC_STATUS':
            event.source.postMessage({
                type: 'SYNC_STATUS',
                payload: { pending: syncQueue.length }
            });
            break;
            
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.delete(CACHE_NAME)
                    .then(() => {
                        console.log('[SW] Cache cleared');
                        return caches.open(CACHE_NAME).then(cache => 
                            cache.addAll(STATIC_ASSETS)
                        );
                    })
            );
            break;
    }
});

// Hilfsfunktion: Notification anzeigen
async function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        await self.registration.showNotification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png'
        });
    }
}

// Periodische Sync (falls unterstützt)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'sync-filaments') {
            event.waitUntil(processSyncQueue());
        }
    });
}
