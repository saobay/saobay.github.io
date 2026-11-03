// SW_KILLSWITCH_20261104: go bo chuyen huong SW_REDIRECT_20261016.
// SW cu chan moi request tren saobay.github.io va 302 sang workers.dev (giu nguyen path),
// lam hong moi trang dat tren github.io (vd link du phong phong hop phong-hop-fb.html bi nhay sang Worker dang cham tran 1027).
// SW nay: khong chan fetch nua, tu huy dang ky + xoa cache + tai lai cac tab dang mo.
self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.registration.unregister();
    }).then(function () {
      return self.clients.matchAll({ type: 'window' });
    }).then(function (clients) {
      clients.forEach(function (c) { c.navigate(c.url); });
    })
  );
});

// Khong dang ky fetch handler: moi yeu cau di thang toi GitHub Pages.
