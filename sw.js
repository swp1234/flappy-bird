// Service Worker - Sky Flap PWA
const CACHE_NAME = 'sky-flap-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/i18n.js',
    '/js/locales/ko.json',
    '/js/locales/en.json',
    '/js/locales/ja.json',
    '/js/locales/zh.json',
    '/js/locales/es.json',
    '/js/locales/pt.json',
    '/js/locales/id.json',
    '/js/locales/tr.json',
    '/js/locales/de.json',
    '/js/locales/fr.json',
    '/js/locales/hi.json',
    '/js/locales/ru.json',
    '/icon-192.svg',
    '/icon-512.svg',
    '/manifest.json'
];

// Install event - Cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache).catch(err => {
                console.warn('Some assets could not be cached:', err);
                // Don't fail the install even if some assets fail
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).then(response => {
            if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
            }
            return response;
        }).catch(() => {
            return caches.match(event.request).then(cached => {
                return cached || caches.match('/index.html');
            });
        })
    );
});

// Handle messages from clients
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
