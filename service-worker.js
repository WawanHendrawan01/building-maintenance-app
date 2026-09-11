const CACHE_NAME = 'reazt-shell-v3-special-project';
const APP_SHELL = [
    './',
    './index.html',
    './login.html',
    './style.css?v=20260910-mobile1',
    './pr-module.css',
    './script.js?v=20260910-mobile1',
    './pr-module.js',
    './special-project-module.js',
    './special-project-module.css',
    './firebase-init.js',
    './login-auth.js',
    './assets/logo.svg',
    './assets/Putih_PNG.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/apple-touch-icon.png',
    './manifest.webmanifest'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(async () => {
                const cached = await caches.match(request);
                if (cached) return cached;
                if (request.mode === 'navigate') return caches.match('./index.html');
                throw new Error('Network unavailable and resource is not cached.');
            })
    );
});
