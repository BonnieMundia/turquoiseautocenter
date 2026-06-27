/* ============================================================
   Turquoise Auto Centre — Service Worker
   Strategy:
     - Cache-first  → CSS, JS, fonts, images
     - Network-first → HTML pages (always fresh)
     - Network-only  → Firebase/Cloud Functions API calls
   ============================================================ */

const CACHE_NAME    = 'tac-v5';
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
  '/gallery.html',
  '/css/styles.css?v=2',
  '/js/config.js?v=3',
  '/js/main.js?v=2',
  '/js/analytics.js?v=2',
  '/js/blog-firebase.js?v=1',
  '/turquoise-auto-logo.png',
  '/favicon/favicon.ico',
  '/favicon/favicon-32x32.png',
  '/site.webmanifest',
  '/images/hero/hero-1.jpg',
  '/images/hero/hero-2.jpg',
  '/images/hero/hero-3.jpg',
  '/images/hero/hero-4.jpg',
  '/images/gallery/spray-painting.jpg',
  '/images/gallery/auto-workshop.jpg',
  '/images/gallery/panel-beating.jpg',
  '/images/gallery/transformation.jpg',
  '/images/gallery/paint-refresh.jpg',
  '/images/gallery/car-wash.jpg',
  '/images/gallery/detailing.jpg',
  '/images/gallery/ferrari.jpg',
  '/images/gallery/bmw.jpg',
  '/images/gallery/engine.jpg',
  '/images/gallery/mechanical.jpg',
  '/images/gallery/juja-workshop.jpg',
  '/images/gallery/service-bay.jpg',
  '/images/blog/maintenance-tips.jpg',
  '/images/blog/tyre-safety.jpg',
  '/images/blog/engine-diagnostics.jpg',
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

  // Skip non-GET and third-party API calls (Firebase/Cloud Functions, GA)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('cloudfunctions.net')) return;
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
        .catch(() => {
          // Blog post permalinks should never silently fall back to the
          // homepage on a network hiccup -- that's more confusing than a
          // normal browser offline error, since it looks like a redirect bug.
          if (url.pathname.startsWith('/blog/')) {
            return caches.match(request).then(cached => cached || Response.error());
          }
          return caches.match(request).then(cached => cached || caches.match(OFFLINE_PAGE));
        })
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
