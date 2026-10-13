// SW_R2_PROXY_20261014: Proxy saobay.github.io sang Cloudflare Worker (R2)
const WORKER_URL = 'https://www.saobayhighschool.workers.dev';
const CACHE_NAME = 'saobay-sw-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);
  // Chỉ proxy GET cùng origin
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Không proxy sw.js chính nó
  if (url.pathname === '/sw.js') return;
  
  e.respondWith(
    fetch(WORKER_URL + url.pathname + url.search, {
      method: 'GET',
      headers: e.request.headers
    }).then(function(resp) {
      // Worker trả 404 thì fallback về GitHub
      if (resp.status === 404) return fetch(e.request);
      return resp;
    }).catch(function() {
      // Worker lỗi thì fallback về GitHub
      return fetch(e.request);
    })
  );
});
