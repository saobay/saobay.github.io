// SW_R2_PROXY_20261013: saobay.github.io -> proxy sang R2 qua worker www
// Giữ tên miền github.io, nội dung từ R2 (chống clone)
const R2_WORKER = 'https://www.saobayhighschool.workers.dev';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);
  
  // Chỉ proxy request cùng origin (saobay.github.io)
  // Bỏ qua: request tới domain khác, POST, chrome-extension
  if (url.origin !== location.origin) return;
  if (e.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  
  // Bỏ qua chính sw.js để tránh vòng lặp
  if (url.pathname === '/sw.js') return;
  
  e.respondWith(
    fetch(R2_WORKER + url.pathname + url.search, {
      method: 'GET',
      headers: { 'Accept': e.request.headers.get('Accept') || '*/*' }
    }).then(function(res) {
      // Nếu R2 worker trả 404, fallback về GitHub Pages gốc
      if (res.status === 404) return fetch(e.request);
      return res;
    }).catch(function() {
      // Nếu worker lỗi, fallback về GitHub
      return fetch(e.request);
    })
  );
});
