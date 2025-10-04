const CACHE_NAME = 'yourgu-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/yourgucal-icon-512.png',
  '/yourgucal-icon-192.png'
  // Add icon files here if used, e.g., '/icon-192.png', '/icon-512.png'
];

// Install event: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event: serve cached files if offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
