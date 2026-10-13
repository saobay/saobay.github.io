// SW_MINIMAL_20261013: che do GitHub-only tam thoi (khong proxy sang Worker).
// Mai se bat lai cloud. SW nay khong chan request nao - tat ca di thang GitHub Pages.
self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});
// Khong co fetch handler -> moi request di thang network (GitHub Pages)
