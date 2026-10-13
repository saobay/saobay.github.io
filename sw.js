/* SB_SW_PROXY_20261013_V4
 * github.io -> Cloudflare Worker (https://saobay.saobayhighschool.workers.dev)
 * Giu nguyen ten mien saobay.github.io tren thanh dia chi + giu dang nhap (cung origin).
 * Yeu cau bat buoc phia Cloudflare: header Access-Control-Allow-Origin: *
 *
 * V2: Worker da ngat auto-deploy (dong bang). Du lieu dong (/data/, /used/)
 *     bypass ve repo origin. Chi noi dung tinh proxy sang Worker.
 * V3: UI hotfix - bo nut noi cay thu muc, Zalo xuong cuoi trang (tiem vao HTML).
 * V4 (2026-10-13): Worker redirect 307 moi URL .html sang dang gon (vd
 *     /teacher/teacher-hub.html -> /teacher/teacher-hub); fetch cors qua SW
 *     gap 307 gay ERR_FAILED. -> Strip .html truoc khi proxy de tranh redirect.
 */
const UPSTREAM = 'https://saobay.saobayhighschool.workers.dev';
// Bypass = phuc vu tu repo origin (luon moi):
const ORIGIN_EXACT = ['/sw.js'];
const ORIGIN_PREFIXES = ['/data/', '/used/'];

// UI fix tiem vao HTML (user 2026-10-13)
const UI_FIX_CSS = '<style id="sb-ui-fix-20261013">'
  + '#sb-tree-reopen-btn{display:none!important;visibility:hidden!important;pointer-events:none!important;}'
  + '</style>';
const UI_FIX_JS = '<script>(function(){'
  + 'function fixUI(){'
  + 'var tb=document.getElementById("sb-tree-reopen-btn");if(tb)tb.remove();'
  + 'var z=document.querySelector(\'a[href*="zalo.me/0859946899"]\');'
  + 'if(z&&!z.dataset.sbFixed){z.dataset.sbFixed="1";'
  + 'z.style.position="static";z.style.bottom="auto";z.style.right="auto";z.style.zIndex="auto";'
  + 'z.style.margin="18px auto";z.style.display="inline-flex";'
  + 'var w=document.createElement("div");w.style.textAlign="center";w.style.padding="16px 12px 28px";'
  + 'z.parentNode.insertBefore(w,z);w.appendChild(z);}'
  + '}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fixUI);else fixUI();'
  + 'new MutationObserver(function(){var tb=document.getElementById("sb-tree-reopen-btn");if(tb)tb.remove();})'
  + '.observe(document.documentElement,{childList:true,subtree:true});'
  + '})();</script>';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  let u;
  try { u = new URL(e.request.url); } catch (_) { return; }
  if (u.origin !== self.location.origin) return;
  for (const p of ORIGIN_EXACT) {
    if (u.pathname === p) return;
  }
  for (const p of ORIGIN_PREFIXES) {
    if (u.pathname === p.slice(0, -1) || u.pathname.startsWith(p)) return;
  }
  // V4: Worker redirect 307 .html -> URL gon. Strip .html truoc de tranh redirect.
  let path = u.pathname;
  if (path === '/index.html') {
    path = '/';
  } else if (path.length > 5 && path.toLowerCase().endsWith('.html')) {
    path = path.slice(0, -5);
  }
  const target = UPSTREAM + path + u.search;
  e.respondWith(
    fetch(target, { mode: 'cors', redirect: 'follow', credentials: 'omit' })
      .then(async (res) => {
        if (!res || (res.status >= 500 && res.status < 600)) return fetch(e.request);
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/html')) {
          try {
            let html = await res.text();
            if (html.includes('</head>')) {
              html = html.replace('</head>', UI_FIX_CSS + '</head>');
            }
            if (html.includes('</body>')) {
              html = html.replace('</body>', UI_FIX_JS + '</body>');
            }
            return new Response(html, {
              status: res.status,
              statusText: res.statusText,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          } catch (_) { /* tra nguyen ban */ }
        }
        return res;
      })
      .catch(() => fetch(e.request))
  );
});
