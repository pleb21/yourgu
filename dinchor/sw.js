// App-shell cache for offline loading. Data itself lives in localStorage
// (see storage.js) and is already available offline — this only covers
// the HTML/CSS/JS/icons needed to load the page at all with no network.
const CACHE_NAME = 'dinchor-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './storage.js',
  './manifest.json',
  './icon.svg',
  './favicon-16.png',
  './favicon-32.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

// Network-first: always try the live network so an online visit sees the
// latest deploy and refreshes the cache in the process. Only fall back to
// the cached copy when the fetch itself fails (offline).
//
// navigator.onLine on the page only reflects whether the OS thinks it has
// *a* network connection, not whether this specific server is reachable —
// so for navigation requests we tag the cached fallback HTML with a flag
// the page can check, instead of relying on that alone.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    let cached = await caches.match(request);
    if (!cached && request.mode === 'navigate') {
      cached = await caches.match('./index.html');
    }
    if (!cached) throw err;
    return request.mode === 'navigate' ? markServedFromCache(cached) : cached;
  }
}

async function markServedFromCache(response) {
  const html = await response.text();
  const flagged = html.replace('<head>', '<head><script>window.__DINCHOR_OFFLINE__ = true;</script>');
  return new Response(flagged, {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
