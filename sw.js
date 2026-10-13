/* SB_SW_PROXY_20261013_V2
 * github.io -> Cloudflare Worker (https://saobay.saobayhighschool.workers.dev)
 * Giu nguyen ten mien saobay.github.io tren thanh dia chi + giu dang nhap (cung origin).
 * Yeu cau bat buoc phia Cloudflare: header Access-Control-Allow-Origin: *
 * (khong co header nay, trinh duyet chan doc JSON -> app hong).
 *
 * V2: Worker da ngat auto-deploy (dong bang). Toan bo du lieu dong PHAl lay tu
 * repo origin (GitHub Pages) noi GAS/admin ghi vao -> bypass /data/ + /used/.
 * Chi noi dung tinh (HTML/JS/CSS/anh) moi proxy sang Worker.
 */
const UPSTREAM = 'https://saobay.saobayhighschool.workers.dev';
// Bypass = phuc vu tu repo origin (luon moi):
// - /sw.js: chinh file nay, luon lay tu origin
// - /data/: diem (scores), bao loi (reports), bao tri, thong ke, bank3,
//           cho-duyet, nhiem vu, reviewers... (GAS + admin ghi vao day)
// - /used/: database mat khau (used.is), han tai khoan, dang ky
const ORIGIN_EXACT = ['/sw.js'];
const ORIGIN_PREFIXES = ['/data/', '/used/'];

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  // Chi can thiep GET; POST/PUT... de trinh duyet xu ly binh thuong
  if (e.request.method !== 'GET') return;
  let u;
  try { u = new URL(e.request.url); } catch (_) { return; }
  // Request khac origin (GAS script.google.com, CDN tailwind/mathjax...) -> bo qua
  if (u.origin !== self.location.origin) return;
  for (const p of ORIGIN_EXACT) {
    if (u.pathname === p) return;
  }
  for (const p of ORIGIN_PREFIXES) {
    if (u.pathname === p.slice(0, -1) || u.pathname.startsWith(p)) return;
  }
  const target = UPSTREAM + u.pathname + u.search;
  e.respondWith(
    fetch(target, { mode: 'cors', redirect: 'follow', credentials: 'omit' })
      .then((res) => {
        // Upstream hong/tra loi loi -> fallback ve origin
        if (!res || (res.status >= 500 && res.status < 600)) return fetch(e.request);
        return res;
      })
      .catch(() => fetch(e.request))
  );
});
