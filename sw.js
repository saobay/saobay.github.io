// SW_REDIRECT_20261016: saobay.github.io chỉ redirect sang workers.dev (không proxy nữa)
// User yêu cầu 2026-10-16: gõ saobay.github.io nhảy thẳng sang workers.dev
const WORKER_URL = 'https://www.saobayhighschool.workers.dev';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);
  // Chỉ xử lý GET cùng origin, bỏ qua sw.js
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname === '/sw.js') return;
  
  // Redirect thẳng sang workers.dev, giữ nguyên path
  const target = WORKER_URL + url.pathname + url.search + url.hash;
  e.respondWith(Response.redirect(target, 302));
});
