/* hub-inline-edit.js — Sửa giao diện inline tại chỗ (2026-10-10)
 * Admin bấm nút "Sửa giao diện" trên thanh toolbar → bật chế độ sửa:
 * - mọi element [data-ui-label] hiện viền đứt nét khi hover
 * - bấm vào → ô input inline, Enter hoặc bấm ra ngoài → tự lưu vào data/ui-labels.json qua GAS proxy
 * - bấm lại nút để tắt chế độ sửa. Chỉ admin thấy nút.
 */
(function(){
  if(window._inlineEditLoaded) return;
  window._inlineEditLoaded = true;

  var LABELS_URL = '../data/ui-labels.json';
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
  var EDIT_BTN_ID = 'admin-inline-edit-btn';
  var cache = null;
  var editMode = false;
  var saving = false;
  var activeInput = null;

  function isAdmin(){
    try{
      var u = JSON.parse(localStorage.getItem('saobay_user') || '{}');
      return u && (u.role === 'admin');
    }catch(e){ return false; }
  }

  function injectCSS(){
    if(document.getElementById('uilabel-edit-css')) return;
    var s = document.createElement('style');
    s.id = 'uilabel-edit-css';
    s.textContent = [
      'body.uilabel-editing [data-ui-label]{cursor:text !important;}',
      'body.uilabel-editing [data-ui-label]:hover{outline:2px dashed #f59e0b !important;outline-offset:2px;background:rgba(245,158,11,.08);}',
      '.uilabel-inline-input{font:inherit;padding:2px 6px;border:2px solid #f59e0b;border-radius:6px;background:#fffbeb;color:#111;max-width:90vw;}',
      'body.uilabel-editing #' + EDIT_BTN_ID + '{outline:3px solid #facc15 !important;}',
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
    }).then(function(j){ cache = j; cb && cb(true); })
      .catch(function(){ cb && cb(false); });
  }

  // Áp dụng lại labels lên trang (bản gọn, đồng bộ với hub-uilabels.js)
  function applyLabels(){
    try{
      if(!cache) return;
      var els = document.querySelectorAll('[data-ui-label]');
      els.forEach(function(el){
        var key = el.getAttribute('data-ui-label');
        if(key && cache[key] !== undefined && cache[key] !== ''){
          if(el.id === EDIT_BTN_ID) return; // giữ trạng thái nút bật/tắt
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
    }catch(e){ console.warn('inline-edit apply:', e); }
  }

  function saveLabels(cb){
    if(saving){ cb && cb(false); return; }
    saving = true;
    if(cache._comment === undefined)
      cache._comment = 'Tùy chỉnh chữ hiển thị trên giao diện SAOBAY. Admin sửa inline trong Teacher Hub.';
    var payload = JSON.stringify({
      type: 'PUSH_TO_GITHUB',
      filePath: 'data/ui-labels.json',
      content: JSON.stringify(cache, null, 2),
      commitMessage: 'Admin sửa giao diện inline (tùy chỉnh giao diện)',
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
      if(typeof window.uiLabelsUpdateCache === 'function') window.uiLabelsUpdateCache(a.key, v);
      toast('Đang lưu...');
      saveLabels(function(ok){
        toast(ok ? 'Đã lưu!' : 'Lưu thất bại, thử lại.', ok);
        if(ok){
          applyLabels();
          if(typeof window.uiLabelsRenderList === 'function') window.uiLabelsRenderList();
        }
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
    commitActive(); // lưu ô đang mở dở (nếu có)
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
    var el = (t && t.closest) ? t.closest('[data-ui-label]') : null;
    if(!el) return;
    if(el.closest('#' + EDIT_BTN_ID)) return; // không sửa chính nút bật/tắt
    if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
    e.preventDefault();
    e.stopPropagation();
    openEditor(el);
  }
  document.addEventListener('click', onDocClick, true);
  document.addEventListener('mousedown', function(e){
    if(!editMode) return;
    var t = e.target;
    var el = (t && t.closest) ? t.closest('[data-ui-label]') : null;
    if(el && !el.closest('#' + EDIT_BTN_ID)) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  window.toggleInlineEdit = function(){
    if(!isAdmin()){ toast('Chỉ admin mới được sửa giao diện.', false); return; }
    editMode = !editMode;
    document.body.classList.toggle('uilabel-editing', editMode);
    if(!editMode) commitActive();
    toast(editMode
      ? 'Chế độ sửa: bấm vào chữ/nút để sửa, Enter để lưu'
      : 'Đã tắt chế độ sửa', true);
  };

  function showBtn(){
    if(isAdmin()){
      var b = document.getElementById(EDIT_BTN_ID);
      if(b) b.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    injectCSS();
    loadCache();
    showBtn();
    setTimeout(function(){ showBtn(); }, 2000);
  });
})();
