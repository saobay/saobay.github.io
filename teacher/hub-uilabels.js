/* hub-uilabels.js — Tùy chỉnh chữ hiển thị SAOBAY (2026-10-10)
 * 1. Khi load: tải data/ui-labels.json, thay text các element [data-ui-label]
 * 2. Tab 8 (admin): liệt kê / sửa / thêm label, lưu qua GAS proxy
 */
(function(){
  var LABELS_URL = '../data/ui-labels.json';
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
  var cache = null;

  // --- 1. Load và áp dụng labels ---
  function applyLabels(labels){
    try{
      var els = document.querySelectorAll('[data-ui-label]');
      els.forEach(function(el){
        var key = el.getAttribute('data-ui-label');
        if(key && labels[key] !== undefined && labels[key] !== ''){
          // Giữ icon: nếu element có thẻ con (icon), chỉ thay text node
          // Đơn giản: thay textContent nếu không có element con, ngược lại thay các text node trực tiếp
          var hasChildEl = el.querySelector('*');
          if(!hasChildEl){
            el.textContent = labels[key];
          } else {
            // Thay text node trực tiếp đầu tiên có chữ
            var replaced = false;
            el.childNodes.forEach(function(n){
              if(!replaced && n.nodeType === 3 && n.textContent.trim()){
                n.textContent = ' ' + labels[key];
                replaced = true;
              }
            });
            if(!replaced) el.setAttribute('title', labels[key]);
          }
        }
      });
    }catch(e){ console.warn('ui-labels apply:', e); }
  }

  function loadLabels(){
    fetch(LABELS_URL + '?v=' + Date.now()).then(function(r){
      if(!r.ok) throw 0;
      return r.json();
    }).then(function(j){
      cache = j;
      applyLabels(j);
    }).catch(function(){ /* file chưa có thì thôi */ });
  }

  // --- 2. Tab quản lý (admin) ---
  function isAdmin(){
    try{
      var u = JSON.parse(localStorage.getItem('saobay_user') || '{}');
      return u && (u.role === 'admin');
    }catch(e){ return false; }
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window.uiLabelsRenderList = function(){
    var box = document.getElementById('uilabels-list');
    if(!box) return;
    // Chỉ admin mới quản lý
    if(!isAdmin()){
      box.innerHTML = '<p class="text-xs text-rose-600 font-bold">Chỉ admin mới được tùy chỉnh giao diện.</p>';
      return;
    }
    var showTab = document.getElementById('mod-tab-uilabels');
    if(showTab) showTab.style.display = '';
    if(!cache){
      box.innerHTML = '<p class="text-xs text-slate-400 italic">Đang tải...</p>';
      fetch(LABELS_URL + '?v=' + Date.now()).then(function(r){ return r.json(); }).then(function(j){
        cache = j; window.uiLabelsRenderList();
      }).catch(function(){
        box.innerHTML = '<p class="text-xs text-rose-500">Chưa có file data/ui-labels.json</p>';
      });
      return;
    }
    var keys = Object.keys(cache).filter(function(k){ return k.charAt(0) !== '_'; }).sort();
    var h = '<div class="max-h-96 overflow-y-auto space-y-2 pr-1">';
    keys.forEach(function(k){
      h += '<div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">'
        + '<code class="text-[11px] text-slate-500 w-36 shrink-0 truncate" title="'+esc(k)+'">'+esc(k)+'</code>'
        + '<input data-uilabel-key="'+esc(k)+'" value="'+esc(cache[k])+'" class="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" placeholder="Chữ hiển thị">'
        + '</div>';
    });
    h += '</div><p class="text-[11px] text-slate-400 mt-2">Tổng '+keys.length+' nhãn. Sửa xong bấm "Lưu tất cả thay đổi".</p>';
    box.innerHTML = h;
  };

  window.uiLabelsAddNew = function(){
    var kEl = document.getElementById('uilabel-new-key');
    var vEl = document.getElementById('uilabel-new-val');
    var k = (kEl.value || '').trim().replace(/\s+/g,'_').toLowerCase();
    var v = (vEl.value || '').trim();
    var msg = document.getElementById('uilabels-msg');
    if(!k || !v){ msg.textContent = 'Nhập cả key và chữ hiển thị.'; msg.className='text-xs mt-2 text-rose-600'; return; }
    if(!cache) cache = {};
    cache[k] = v;
    kEl.value = ''; vEl.value = '';
    window.uiLabelsRenderList();
    msg.textContent = 'Đã thêm "'+k+'". Nhớ bấm Lưu tất cả.'; msg.className='text-xs mt-2 text-emerald-600';
  };

  window.uiLabelsSaveAll = function(){
    var msg = document.getElementById('uilabels-msg');
    if(!isAdmin()){ msg.textContent='Chỉ admin mới được lưu.'; msg.className='text-xs mt-2 text-rose-600'; return; }
    // Gom giá trị từ các ô input
    document.querySelectorAll('#uilabels-list [data-uilabel-key]').forEach(function(inp){
      cache[inp.getAttribute('data-uilabel-key')] = inp.value;
    });
    // Giữ comment đầu file
    if(cache._comment === undefined) cache._comment = 'Tùy chỉnh chữ hiển thị trên giao diện SAOBAY. Admin sửa trong mục 8. Tùy chỉnh giao diện của Teacher Hub.';
    msg.textContent = 'Đang lưu...'; msg.className='text-xs mt-2 text-slate-500';
    var payload = JSON.stringify({
      type: 'PUSH_TO_GITHUB',
      filePath: 'data/ui-labels.json',
      content: JSON.stringify(cache, null, 2),
      commitMessage: 'Admin cập nhật ui-labels.json (tùy chỉnh giao diện)',
      title: 'Cập nhật ui-labels'
    });
    fetch(GAS_URL, { method:'POST', body: payload, headers:{'Content-Type':'text/plain;charset=utf-8'} })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if(res && res.status === 'success'){
          msg.textContent = 'Đã lưu! Tải lại trang để thấy thay đổi.'; msg.className='text-xs mt-2 text-emerald-600 font-bold';
          applyLabels(cache);
        } else {
          msg.textContent = 'Lưu thất bại: ' + ((res && res.message) || 'không rõ'); msg.className='text-xs mt-2 text-rose-600';
        }
      })
      .catch(function(e){
        msg.textContent = 'Lỗi mạng khi lưu.'; msg.className='text-xs mt-2 text-rose-600';
      });
  };

  // Hiện tab 8 cho admin khi vào hub
  function showTabForAdmin(){
    if(isAdmin()){
      var t = document.getElementById('mod-tab-uilabels');
      if(t) t.style.display = '';
    }
  }

  // Hook vào switchTeacherModule để render khi mở tab uilabels
  function hookModule(){
    if(typeof switchTeacherModule === 'function' && !window._uilabelsHooked){
      window._uilabelsHooked = true;
      var orig = switchTeacherModule;
      switchTeacherModule = function(m){
        orig(m);
        if(m === 'uilabels') window.uiLabelsRenderList();
      };
      // Nếu hàm gốc là const/let không ghi đè được, fallback: theo dõi click
    }
    // Fallback: lắng nghe click nút tab
    var btn = document.getElementById('mod-tab-uilabels');
    if(btn && !btn._uilabelsBound){
      btn._uilabelsBound = true;
      btn.addEventListener('click', function(){ setTimeout(window.uiLabelsRenderList, 300); });
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadLabels();
    showTabForAdmin();
    hookModule();
    // Thử lại sau 2s (hub load async)
    setTimeout(function(){ showTabForAdmin(); hookModule(); }, 2000);
  });
})();
