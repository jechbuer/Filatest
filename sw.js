// Service Worker deaktiviert - App läuft nur online
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Alle Caches löschen
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        })
    );
    self.clients.claim();
});

// Kein Fetch-Handling - alles geht direkt zum Server
