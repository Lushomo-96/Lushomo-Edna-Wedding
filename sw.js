/* Lushomo & Edna wedding site — offline cache.
   Pages and same-site files refresh themselves in the background, so most edits
   reach guests on their next visit. Bump CACHE_NAME for a big change (new photo,
   icons) to force a clean cache. */
const CACHE_NAME = 'le-wedding-v2';
const PRECACHE = ['./', 'index.html', 'manifest.json', 'assets/couple.jpg',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-512-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Pages: network first so updates show straight away; fall back to cache offline.
// Only successful responses are cached, so an error page never replaces the site.
// Same-site files (photo, icons): serve the cached copy, refresh it in the background.
// Fonts and other cross-site files: cache first, stored only when successful.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  const sameSite = req.url.startsWith(self.location.origin);
  const refresh = () => fetch(req).then(res => {
    if (res.ok && (sameSite || req.url.includes('fonts.g'))) {
      const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy));
    }
    return res;
  });
  e.respondWith(caches.match(req).then(hit => {
    if (!hit) return refresh();
    if (sameSite) refresh().catch(() => {});
    return hit;
  }));
});
