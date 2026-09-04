const CACHE_NAME = 'flappy-bird-v9';
const APP_PATH = '/flappy-bird/';
const ASSETS = [
    './', './index.html', './manifest.json', './css/style.css', './js/app.js', './js/i18n.js',
    './assets/bird-opt.png', './assets/pipe-opt.png', './assets/bg-opt.jpg', './assets/ground-opt.png',
    './js/locales/ko.json', './js/locales/en.json', './js/locales/ja.json', './js/locales/zh.json',
    './js/locales/es.json', './js/locales/pt.json', './js/locales/id.json', './js/locales/tr.json',
    './js/locales/de.json', './js/locales/fr.json', './js/locales/hi.json', './js/locales/ru.json',
    './icon-192.svg', './icon-512.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys()
        .then((names) => Promise.all(names
            .filter((name) => (/^(?:sky-flap|flappy-bird)-/.test(name)) && name !== CACHE_NAME)
            .map((name) => caches.delete(name))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_PATH)) return;
    event.respondWith(fetch(event.request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html'))));
});
