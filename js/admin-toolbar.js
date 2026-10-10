/* js/admin-toolbar.js — Thanh công cụ admin nổi trên MỌI trang SAOBAY (2026-10-10)
 * - Chỉ hiện khi admin đăng nhập (localStorage saobay_user.role === 'admin')
 * - Nút "✏️ Sửa giao diện": bật chế độ sửa inline — bấm vào chữ/nút có [data-ui-label]
 *   để sửa ngay tại chỗ như Word, Enter/bấm ra ngoài → tự lưu vào data/ui-labels.json
 * - Nếu trang đã có hub-inline-edit.js (teacher-hub) thì không tạo trùng.
 */
(function(){
  if(window._adminToolbarLoaded) return;
  window._adminToolbarLoaded = true;
  // teacher-hub đã có nút riêng trên thanh admin → không cần toolbar nổi
  if(window._inlineEditLoaded) return;

  var LABELS_URL = location.origin + '/data/ui-labels.json';
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
  var cache = null, editMode = false, saving = false, activeInput = null;

  function isAdmin(){
    try{
      var u = JSON.parse(localStorage.getItem('saobay_user') || '{}');
      return u && (u.role === 'admin');
    }catch(e){ return false; }
  }

  function injectCSS(){
    if(document.getElementById('admintoolbar-css')) return;
    var s = document.createElement('style');
    s.id = 'admintoolbar-css';
    s.textContent = [
      '#admintoolbar{position:fixed;right:14px;bottom:14px;z-index:99990;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:inherit;}',
      '#admintoolbar .at-main{width:46px;height:46px;border-radius:50%;border:none;background:#1d4ed8;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3);}',
      '#admintoolbar .at-panel{display:none;flex-direction:column;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);min-width:170px;}',
      '#admintoolbar.open .at-panel{display:flex;}',
      '#admintoolbar .at-btn{border:none;border-radius:8px;padding:8px 10px;font-size:13px;font-weight:700;cursor:pointer;text-align:left;}',
      '#admintoolbar .at-edit{background:#f59e0b;color:#fff;}',
      '#admintoolbar .at-edit.on{background:#059669;}',
      '#admintoolbar .at-note{font-size:11px;color:#6b7280;padding:0 2px;}',
      'body.uilabel-editing [data-ui-label]{cursor:text !important;}',
      'body.uilabel-editing [data-ui-label]:hover{outline:2px dashed #f59e0b !important;outline-offset:2px;background:rgba(245,158,11,.08);}',
      '.uilabel-inline-input{font:inherit;padding:2px 6px;border:2px solid #f59e0b;border-radius:6px;background:#fffbeb;color:#111;max-width:90vw;}',
      '#uilabel-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;padding:10px 18px;border-radius:10px;font-weight:700;font-size:14px;color:#fff;background:#059669;box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:0;transition:opacity .25s;pointer-events:none;}',
      '#uilabel-toast.show{opacity:1;}',
      '#uilabel-toast.err{background:#dc2626;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var toastTimer = null;
  function toast(msg, ok){
    var t = document.getElementById('uilabel-toast');
    if(!t){ t = document.createElement('div'); t.id = 'uilabel-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = (ok === false) ? 'err' : '';
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 1800);
  }

  function loadCache(cb){
    fetch(LABELS_URL + '?v=' + Date.now()).then(function(r){
      if(!r.ok) throw 0;
      return r.json();
    }).then(function(j){ cache = j; applyLabels(); cb && cb(true); })
      .catch(function(){ cb && cb(false); });
  }

  function applyLabels(){
    try{
      if(!cache) return;
      var els = document.querySelectorAll('[data-ui-label]');
      els.forEach(function(el){
        var key = el.getAttribute('data-ui-label');
        if(key && cache[key] !== undefined && cache[key] !== ''){
          if(el.closest && el.closest('#admintoolbar')) return; // không sửa chính toolbar
          var hasChildEl = el.querySelector('*');
          if(!hasChildEl){ el.textContent = cache[key]; }
          else{
            var replaced = false;
            el.childNodes.forEach(function(n){
              if(!replaced && n.nodeType === 3 && n.textContent.trim()){
                n.textContent = ' ' + cache[key]; replaced = true;
              }
            });
            if(!replaced) el.setAttribute('title', cache[key]);
          }
        }
      });
    }catch(e){ console.warn('admin-toolbar apply:', e); }
  }

  function saveLabels(cb){
    if(saving){ cb && cb(false); return; }
    saving = true;
    if(cache._comment === undefined)
      cache._comment = 'Tùy chỉnh chữ hiển thị trên giao diện SAOBAY. Admin sửa inline trên mọi trang.';
    var payload = JSON.stringify({
      type: 'PUSH_TO_GITHUB',
      filePath: 'data/ui-labels.json',
      content: JSON.stringify(cache, null, 2),
      commitMessage: 'Admin sửa giao diện inline (thanh công cụ nổi)',
      title: 'Cập nhật ui-labels inline'
    });
    fetch(GAS_URL, { method:'POST', body: payload, headers:{'Content-Type':'text/plain;charset=utf-8'} })
      .then(function(r){ return r.json(); })
      .then(function(res){ saving = false; cb && cb(res && res.status === 'success'); })
      .catch(function(){ saving = false; cb && cb(false); });
  }

  function cleanup(a){
    if(a.input && a.input.parentNode) a.input.parentNode.removeChild(a.input);
    if(a.el) a.el.style.display = '';
    if(activeInput === a) activeInput = null;
  }

  function commitActive(){
    var a = activeInput;
    if(!a || a.done) return;
    a.done = true;
    var v = a.input.value.trim();
    var old = (cache && cache[a.key] !== undefined) ? String(cache[a.key]) : '';
    cleanup(a);
    if(!cache){ toast('Chưa tải được cấu hình labels.', false); return; }
    if(v && v !== old){
      cache[a.key] = v;
      toast('Đang lưu...');
      saveLabels(function(ok){
        toast(ok ? 'Đã lưu!' : 'Lưu thất bại, thử lại.', ok);
        if(ok) applyLabels();
      });
    }
  }

  function cancelActive(){
    var a = activeInput;
    if(!a || a.done) return;
    a.done = true;
    cleanup(a);
  }

  function openEditor(el){
    commitActive();
    var key = el.getAttribute('data-ui-label');
    if(!key) return;
    if(!cache){
      toast('Đang tải cấu hình, thử lại sau 1 giây...', false);
      loadCache(function(ok){ if(ok) openEditor(el); });
      return;
    }
    var cur = (cache[key] !== undefined && cache[key] !== '') ? String(cache[key]) : el.textContent.trim();
    var input = document.createElement('input');
    input.type = 'text';
    input.value = cur;
    input.className = 'uilabel-inline-input';
    try{
      var r = el.getBoundingClientRect();
      input.style.width = Math.max(80, Math.min(r.width || 80, 600)) + 'px';
    }catch(e){ input.style.width = '200px'; }
    el.style.display = 'none';
    el.parentNode.insertBefore(input, el.nextSibling);
    input.focus();
    try{ input.select(); }catch(e){}
    activeInput = { el: el, input: input, key: key, done: false };
    input.addEventListener('keydown', function(ev){
      if(ev.key === 'Enter'){ ev.preventDefault(); commitActive(); }
      else if(ev.key === 'Escape'){ ev.preventDefault(); cancelActive(); }
      ev.stopPropagation();
    });
    input.addEventListener('blur', function(){ commitActive(); });
    input.addEventListener('click', function(ev){ ev.stopPropagation(); });
    input.addEventListener('mousedown', function(ev){ ev.stopPropagation(); });
  }

  function onDocClick(e){
    if(!editMode) return;
    var t = e.target;
    if(t.closest && t.closest('#admintoolbar')) return;
    var el = (t && t.closest) ? t.closest('[data-ui-label]') : null;
    if(!el) return;
    if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
    e.preventDefault();
    e.stopPropagation();
    openEditor(el);
  }
  document.addEventListener('click', onDocClick, true);
  document.addEventListener('mousedown', function(e){
    if(!editMode) return;
    var t = e.target;
    if(t.closest && t.closest('#admintoolbar')) return;
    var el = (t && t.closest) ? t.closest('[data-ui-label]') : null;
    if(el) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  function toggleEdit(){
    if(!isAdmin()){ toast('Chỉ admin mới được sửa giao diện.', false); return; }
    editMode = !editMode;
    document.body.classList.toggle('uilabel-editing', editMode);
    if(!editMode) commitActive();
    var b = document.getElementById('at-edit-btn');
    if(b){ b.classList.toggle('on', editMode); b.textContent = editMode ? '✅ Đang sửa (bấm để tắt)' : '✏️ Sửa giao diện'; }
    toast(editMode ? 'Chế độ sửa: bấm vào chữ/nút để sửa, Enter để lưu' : 'Đã tắt chế độ sửa', true);
  }
  window.toggleInlineEdit = toggleEdit; // tương thích với hub-inline-edit

  function buildToolbar(){
    if(document.getElementById('admintoolbar')) return;
    var bar = document.createElement('div');
    bar.id = 'admintoolbar';
    bar.innerHTML =
      '<div class="at-panel">' +
        '<button class="at-btn at-edit" id="at-edit-btn">✏️ Sửa giao diện</button>' +
        '<div class="at-note">Bấm nút trên, rồi bấm vào chữ/nút bất kỳ để sửa tại chỗ.</div>' +
      '</div>' +
      '<button class="at-main" id="at-main-btn" title="Công cụ admin">⚙️</button>';
    document.body.appendChild(bar);
    document.getElementById('at-main-btn').addEventListener('click', function(){
      bar.classList.toggle('open');
    });
    document.getElementById('at-edit-btn').addEventListener('click', function(){
      toggleEdit();
    });
  }

  function init(){
    injectCSS();
    if(!isAdmin()) return;
    buildToolbar();
    loadCache();
    // kiểm tra lại sau 2s (trường hợp localStorage set muộn)
    setTimeout(function(){ if(isAdmin()){ buildToolbar(); } }, 2000);
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();
})();
