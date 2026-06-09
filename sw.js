/* ============================================================
   Turquoise Auto Centre — Service Worker
   Strategy:
     - Cache-first  → CSS, JS, fonts, images
     - Network-first → HTML pages (always fresh)
     - Network-only  → Supabase API calls
   ============================================================ */

const CACHE_NAME    = 'tac-v1';
const OFFLINE_PAGE  = '/index.html';

const PRECACHE = [
  '/',
  '/index.html',
  '/services.html',
  '/pricing.html',
  '/faq.html',
  '/about.html',
  '/blog.html',
  '/contact.html',
  '/css/styles.css',
  '/js/config.js',
  '/js/main.js',
  '/js/analytics.js',
  '/js/blog-supabase.js',
  '/turquoise-auto-logo.png',
  '/favicon/favicon.ico',
  '/favicon/favicon-32x32.png',
  '/site.webmanifest',
];

/* ── Install: pre-cache static shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and third-party API calls (Supabase, GA)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('google-analytics.com')) return;
  if (url.hostname.includes('googletagmanager.com')) return;

  // HTML pages — network-first, fall back to cache then offline page
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match(OFFLINE_PAGE))
        )
    );
    return;
  }

  // Static assets — cache-first, update in background
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
