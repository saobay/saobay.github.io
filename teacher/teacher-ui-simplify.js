// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261012_0540
// Tab 2: thay the renderLessonManagementList goc bang DS DE THI GV tai len, gom:
//  (a) file de .html trong data/ (Word/AI day cong khai)
//  (b) de luu rieng/len lich trong data/exam-schedule.json (exams-pending) - de Word/matran deu vao day
// On dinh: khong interval vo han, fetch 1 lan/phien (cache chung 1 promise).
(function(){
'use strict';
var dataCache = null;    // {files:[], scheduled:[]}
var dataPromise = null;

function addClearBtn(){
  if(document.getElementById('btn-clear-cache')) return true;
  if(!document.body) return false;
  var b=document.createElement('button');
  b.id='btn-clear-cache'; b.textContent='🧹 Xóa cache';
  b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9998;padding:8px 12px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;';
  b.onclick=function(){
    if(!confirm('Xoa cache? (giu dang nhap)')) return;
    var bk={};
    ['saobay_user','github_token','saobay_admin_token','saobay_github_token'].forEach(function(k){var v=localStorage.getItem(k); if(v) bk[k]=v;});
    if('caches' in window) caches.keys().then(function(ns){ ns.forEach(function(x){ caches.delete(x); }); });
    localStorage.clear();
    Object.keys(bk).forEach(function(k){ localStorage.setItem(k,bk[k]); });
    location.href=location.href.split('?')[0]+'?_cb='+Date.now();
  };
  document.body.appendChild(b);
  return true;
}
(function(){
  var n=0, t=setInterval(function(){ n++; if(addClearBtn() || n>=15) clearInterval(t); },1000);
})();

function ghHeaders(){
  var h={'Accept':'application/vnd.github+json'};
  var tk=localStorage.getItem('saobay_github_token')||localStorage.getItem('github_token');
  if(tk) h['Authorization']='Bearer '+tk;
  return h;
}

function fetchAll(){
  if(dataCache) return Promise.resolve(dataCache);
  if(dataPromise) return dataPromise;
  var pFiles=fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1',{headers:ghHeaders()})
    .then(function(r){ if(!r.ok) throw new Error('GitHub API: '+r.status); return r.json(); })
    .then(function(data){
      return (data.tree||[]).filter(function(i){
        if(i.type!=='blob'||!i.path.endsWith('.html')) return false;
        if(i.path.indexOf('data/')!==0) return false;
        var n=i.path.toLowerCase();
        if(n.indexOf('data/bank')===0||n.indexOf('data/scores')===0) return false;
        if(n.indexOf('_bai_tap_')>=0||n.indexOf('_ly_thuyet_')>=0) return false;
        if(n.indexOf('bai_tap_none')>=0||n.indexOf('ly_thuyet_none')>=0) return false;
        return true;
      });
    });
  var pSched=fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/exam-schedule.json?t='+Date.now(),{cache:'no-store'})
    .then(function(r){ return r.ok ? r.json() : {exams:[]}; })
    .then(function(j){ return (j && Array.isArray(j.exams)) ? j.exams : []; })
    .catch(function(){ return []; });
  dataPromise=Promise.all([pFiles,pSched]).then(function(res){
    dataCache={files:res[0], scheduled:res[1]};
    dataPromise=null;
    return dataCache;
  }).catch(function(e){ dataPromise=null; throw e; });
  return dataPromise;
}

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderExams(){
  var c=document.getElementById('manage-lessons-table-container');
  if(!c) return;
  if(!dataCache) c.innerHTML='<div id="saobay-exams-box"><p style="color:#666">⏳ Đang tải danh sách đề thi...</p></div>';
  fetchAll().then(function(d){
    var cc=document.getElementById('manage-lessons-table-container');
    if(!cc) return;
    var files=d.files, sched=d.scheduled;
    if(!files.length && !sched.length){
      cc.innerHTML='<div id="saobay-exams-box" style="padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px">'
        +'<p style="font-weight:bold;margin:0 0 6px">📝 Đề thi đã tải lên</p>'
        +'<p style="color:#64748b;margin:0 0 8px">Chưa có đề thi nào. Đề tải lên qua Word / AI / tạo từ Bank sẽ hiện ở đây.</p>'
        +'<button id="saobay-exams-reload" style="padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🔄 Tải lại</button></div>';
    } else {
      var h='<div id="saobay-exams-box" style="padding:6px 2px">';
      h+='<p style="font-weight:bold;margin:0 0 8px">📝 Đề thi đã tải lên '
        +'<button id="saobay-exams-reload" style="margin-left:8px;padding:4px 10px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">🔄 Tải lại</button></p>';
      if(sched.length){
        h+='<p style="font-weight:bold;color:#334155;margin:10px 0 4px">📌 Đề lưu riêng / lên lịch kiểm tra ('+sched.length+')</p><ul style="list-style:none;padding:0;margin:0">';
        sched.slice().reverse().forEach(function(x){
          var st = x.status==='draft' ? '📝 Chuẩn bị (bản nháp)' : esc(x.status||'');
          var when = x.examTime ? ('🕐 '+esc(x.examTime)) : 'Chưa đặt giờ';
          var created = x.createdAt ? new Date(x.createdAt).toLocaleString('vi-VN') : '';
          h+='<li style="padding:8px;border-bottom:1px solid #eee">📌 <b>'+esc(x.title||'(không tên)')+'</b><br>'
            +'<small style="color:#555">'+esc(x.className||'')+' • '+when+' • '+st+(created?' • Tạo: '+created:'')+'</small></li>';
        });
        h+='</ul>';
      }
      if(files.length){
        h+='<p style="font-weight:bold;color:#334155;margin:12px 0 4px">🌐 Đề công khai dạng file ('+files.length+')</p><ul style="list-style:none;padding:0;margin:0">';
        files.forEach(function(x){
          var name=x.path.split('/').pop().replace(/\.html$/,'');
          h+='<li style="padding:8px;border-bottom:1px solid #eee">📝 <b>'+esc(name)+'</b><br>'
            +'<small style="color:#888">'+esc(x.path)+'</small> '
            +'<a href="https://saobay.github.io/'+x.path+'" target="_blank" style="color:#2563eb">Mở</a></li>';
        });
        h+='</ul>';
      }
      cc.innerHTML=h+'</div>';
    }
    var rb=document.getElementById('saobay-exams-reload');
    if(rb) rb.onclick=function(){ dataCache=null; renderExams(); };
  }).catch(function(e){
    var cc=document.getElementById('manage-lessons-table-container');
    if(cc) cc.innerHTML='<div id="saobay-exams-box"><p style="color:red">Không tải được danh sách đề ('+e.message+'). Kiểm tra mạng rồi bấm lại tab 2.</p></div>';
  });
}

// Thay the ham goc (poll gioi han 80 x 250ms = 20s)
(function(){
  var n=0;
  var t=setInterval(function(){
    n++;
    if(typeof window.renderLessonManagementList==='function' && !window.renderLessonManagementList.__saobayExams){
      var wrapped=function(){ renderExams(); };
      wrapped.__saobayExams=true;
      window.renderLessonManagementList=wrapped;
      clearInterval(t);
      console.log('SAOBAY: da thay the renderLessonManagementList bang ds de thi');
    } else if(n>=80){
      clearInterval(t);
    }
  },250);
})();

// Du phong: bam tab 2 ma chua co ds de thi thi render
document.addEventListener('click',function(e){
  var t=e.target, found=false;
  while(t && t!==document){ if(t.id==='mod-tab-manage'){ found=true; break; } t=t.parentElement; }
  if(!found) return;
  setTimeout(function(){
    var c=document.getElementById('manage-lessons-table-container');
    if(c && !c.querySelector('#saobay-exams-box')) renderExams();
  },600);
}, true);


// === 0540: BO CAY THU MUC BEN TRAI O MOI CHE DO + BO CHON NOI LUU RIENG TRONG FORM ===
// Bank 1 (Ly thuyet/Bai tap): chon Khoi -> Mon -> Chuong, gan vao currentSelectedFolderId + dong bo o meta.
// Bank 2 (De thi / Word-AI): chon Khoi -> Mon, gan window.SB_BANK2 (hook luu lich uu tien doc gia tri nay).
var _sbTree = null;         // {grades: {'6': {subjects: {'Toán 6': {path, chapters: [{name, path}]}}}}}
var _sbCurMode = 'theory';

function _sbHideTreeAside(){
  var tree = document.getElementById('folder-tree');
  var aside = tree ? tree.closest('aside') : null;
  if (aside) aside.style.display = 'none';
}

var _sbSubjOrder = ['Toán','Ngữ văn','Văn','Tiếng Anh','Anh','Vật lý','Lý','Hóa học','Hóa','Sinh học','Sinh','Lịch sử','Sử','Địa lý','Địa','Tin học','Tin','GDCD','Công nghệ','KHTN','GDKTPL'];
var _sbCodeMap = {'toán':'TOAN','ngữ văn':'VAN','văn':'VAN','tiếng anh':'ANH','anh':'ANH','vật lý':'LY','lý':'LY','hóa học':'HOA','hóa':'HOA','sinh học':'SINH','sinh':'SINH','lịch sử':'SU','sử':'SU','địa lý':'DIA','địa':'DIA','tin học':'TIN','tin':'TIN','gdcd':'GDCD','công nghệ':'CONGNGHE','khtn':'KHTN','gdktpl':'GDKTPL'};
function _sbCodeOf(folderName){
  var m = String(folderName || '').match(/^(.+?)\s+\d{1,2}$/);
  var name = (m ? m[1] : String(folderName || '')).trim();
  var key = name.toLowerCase();
  if (_sbCodeMap[key]) return _sbCodeMap[key];
  var bare = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase().replace(/\s+/g, '');
  return bare || 'TOAN';
}
function _sbNum(str){ var m = String(str || '').match(/(\d+)/); return m ? parseInt(m[1], 10) : 0; }

function _sbBuildTree(paths){
  var root = {};
  paths.forEach(function(p){
    var seg = p.split('/');
    if (seg[0] !== 'data') return;
    var gi = -1;
    for (var i = 1; i < seg.length; i++){ if (/^Khối lớp\s*\d+$/.test(seg[i])) { gi = i; break; } }
    if (gi < 0 || gi + 1 >= seg.length) return;
    var grade = String(_sbNum(seg[gi]));
    var subjFolder = seg[gi + 1];
    if (!/\d/.test(subjFolder)) return;
    var subjPath = seg.slice(0, gi + 2).join('/');
    if (!root[grade]) root[grade] = {};
    if (!root[grade][subjFolder]) root[grade][subjFolder] = { path: subjPath, chapters: {} };
    if (gi + 2 < seg.length) {
      var chName = seg[gi + 2];
      var chPath = seg.slice(0, gi + 3).join('/');
      root[grade][subjFolder].chapters[chName] = chPath;
    }
  });
  Object.keys(root).forEach(function(g){
    Object.keys(root[g]).forEach(function(sf){
      var chs = root[g][sf].chapters;
      root[g][sf].chapterList = Object.keys(chs).map(function(n){ return { name: n, path: chs[n] }; })
        .sort(function(a, b){ return _sbNum(a.name) - _sbNum(b.name) || a.name.localeCompare(b.name); });
      delete root[g][sf].chapters;
    });
  });
  return root;
}

function _sbFillGrades(sel, keepVal){
  var grades = Object.keys(_sbTree || {}).sort(function(a, b){ return parseInt(a, 10) - parseInt(b, 10); });
  sel.innerHTML = '<option value="">— Chọn khối —</option>' + grades.map(function(g){ return '<option value="' + g + '">Khối lớp ' + g + '</option>'; }).join('');
  if (keepVal && grades.indexOf(String(keepVal)) >= 0) sel.value = String(keepVal);
}
function _sbFillSubjects(sel, grade, keepVal){
  var subs = [];
  if (_sbTree && _sbTree[grade]) {
    subs = Object.keys(_sbTree[grade]).sort(function(a, b){
      var na = a.replace(/\s+\d+$/, ''), nb = b.replace(/\s+\d+$/, '');
      var ia = _sbSubjOrder.indexOf(na), ib = _sbSubjOrder.indexOf(nb);
      if (ia < 0) ia = 99; if (ib < 0) ib = 99;
      return ia - ib || a.localeCompare(b);
    });
  }
  if (!subs.length) {
    subs = _sbSubjOrder.map(function(n){ return n + ' ' + grade; });
  }
  sel.innerHTML = '<option value="">— Chọn môn —</option>' + subs.map(function(s){ return '<option value="' + s + '">' + s + '</option>'; }).join('');
  if (keepVal && subs.indexOf(keepVal) >= 0) sel.value = keepVal;
}

function _sbSyncMeta(subjectCode, grade, chapterNum){
  var sEl = document.getElementById('item-subject');
  var gEl = document.getElementById('item-grade');
  var cEl = document.getElementById('item-chapter');
  if (sEl && subjectCode) sEl.value = subjectCode;
  if (gEl && grade) gEl.value = grade;
  if (cEl && chapterNum) cEl.value = chapterNum;
}

function _sbApplyBank1(){
  var g = document.getElementById('sb-b1-grade').value;
  var sf = document.getElementById('sb-b1-subject').value;
  var ch = document.getElementById('sb-b1-chapter').value;
  var prev = document.getElementById('sb-b1-path');
  if (!g || !sf) { if (prev) prev.textContent = 'Chưa chọn nơi lưu.'; return; }
  var node = _sbTree && _sbTree[g] ? _sbTree[g][sf] : null;
  var path = ch || (node ? node.path : '');
  if (!path) { if (prev) prev.textContent = 'Chưa chọn nơi lưu.'; return; }
  try { currentSelectedFolderId = path; } catch(e) {}
  try { currentSelectedFolderName = path; } catch(e) {}
  var lbl = document.getElementById('selected-folder-name');
  if (lbl) lbl.textContent = path;
  _sbSyncMeta(_sbCodeOf(sf), g, ch ? _sbNum(ch.split('/').pop()) : '');
  if (prev) prev.textContent = 'Sẽ lưu vào: ' + path;
}

function _sbApplyBank2(){
  var g = document.getElementById('sb-b2-grade').value;
  var sf = document.getElementById('sb-b2-subject').value;
  var prev = document.getElementById('sb-b2-path');
  if (!g || !sf) { window.SB_BANK2 = null; if (prev) prev.textContent = 'Chưa chọn — đề sẽ lưu theo thông tin mặc định.'; return; }
  var code = _sbCodeOf(sf);
  window.SB_BANK2 = { grade: g, subject: code };
  _sbSyncMeta(code, g, '');
  if (prev) prev.textContent = 'Đề sẽ lưu vào Bank 2: data/bank-de/Khối lớp ' + g + '/' + code + ' ' + g + '/<ID đăng nhập của bạn>/';
}

function _sbApplyModeVisibility(mode){
  _sbCurMode = mode || _sbCurMode;
  _sbHideTreeAside();
  var b1 = document.getElementById('sb-bank1-box');
  var b2 = document.getElementById('sb-bank2-box');
  if (!b1 || !b2) return;
  if (_sbCurMode === 'bank') { b1.style.display = 'none'; b2.style.display = 'none'; window.SB_BANK2 = null; }
  else if (_sbCurMode === 'direct') { b1.style.display = ''; b2.style.display = ''; }
  else { b1.style.display = ''; b2.style.display = 'none'; window.SB_BANK2 = null; }
}

function _sbInitPickers(){
  _sbHideTreeAside();
  var grid = document.getElementById('subject-meta-grid');
  if (!grid || document.getElementById('sb-loc-picker')) return;
  var panel = document.createElement('div');
  panel.id = 'sb-loc-picker';
  panel.className = 'bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 space-y-2';
  panel.innerHTML =
    '<div id="sb-bank1-box">' +
      '<div class="text-[11px] font-bold text-emerald-900 mb-1">📁 Nơi lưu Lý thuyết / Bài tập (Bank 1)</div>' +
      '<div class="grid grid-cols-3 gap-2">' +
        '<select id="sb-b1-grade" class="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white border-slate-300"></select>' +
        '<select id="sb-b1-subject" class="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white border-slate-300"></select>' +
        '<select id="sb-b1-chapter" class="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white border-slate-300"></select>' +
      '</div>' +
      '<div id="sb-b1-path" class="text-[11px] text-slate-500 mt-1">Đang tải danh mục thư mục...</div>' +
    '</div>' +
    '<div id="sb-bank2-box" style="display:none">' +
      '<div class="text-[11px] font-bold text-indigo-900 mb-1">🗂️ Nơi lưu Đề kiểm tra (Bank 2 — bank đề riêng, không có thư mục chương)</div>' +
      '<div class="grid grid-cols-2 gap-2">' +
        '<select id="sb-b2-grade" class="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white border-slate-300"></select>' +
        '<select id="sb-b2-subject" class="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white border-slate-300"></select>' +
      '</div>' +
      '<div id="sb-b2-path" class="text-[11px] text-slate-500 mt-1">Đề sẽ lưu vào Bank 2 theo Khối → Môn → ID đăng nhập của bạn (tự động).</div>' +
    '</div>';
  grid.parentNode.insertBefore(panel, grid);

  var b1g = document.getElementById('sb-b1-grade'), b1s = document.getElementById('sb-b1-subject'), b1c = document.getElementById('sb-b1-chapter');
  var b2g = document.getElementById('sb-b2-grade'), b2s = document.getElementById('sb-b2-subject');
  b1g.addEventListener('change', function(){
    _sbFillSubjects(b1s, b1g.value, '');
    b1c.innerHTML = '<option value="">— Chọn chương —</option>';
    _sbApplyBank1();
  });
  b1s.addEventListener('change', function(){
    var node = _sbTree && _sbTree[b1g.value] ? _sbTree[b1g.value][b1s.value] : null;
    var list = node ? node.chapterList : [];
    if (list.length) {
      b1c.innerHTML = '<option value="">— Chọn chương —</option>' + list.map(function(c){ return '<option value="' + c.path + '">' + c.name + '</option>'; }).join('');
      b1c.disabled = false;
    } else {
      b1c.innerHTML = '<option value="">(Môn chưa chia chương — lưu vào thư mục môn)</option>';
      b1c.disabled = true;
    }
    _sbApplyBank1();
  });
  b1c.addEventListener('change', _sbApplyBank1);
  b2g.addEventListener('change', function(){ _sbFillSubjects(b2s, b2g.value, ''); _sbApplyBank2(); });
  b2s.addEventListener('change', _sbApplyBank2);

  fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1', { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(function(r){ return r.json(); })
    .then(function(j){
      var paths = (j.tree || []).filter(function(t){ return t.type === 'tree'; }).map(function(t){ return t.path; });
      _sbTree = _sbBuildTree(paths);
      _sbFillGrades(b1g, ''); _sbFillGrades(b2g, '');
      document.getElementById('sb-b1-path').textContent = 'Chọn khối → môn → chương để đặt nơi lưu.';
      // Khoi phuc lua chon tu thu muc dang chon (neu co)
      try {
        if (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) {
          var seg = String(currentSelectedFolderId).split('/');
          var gi = -1;
          for (var i = 0; i < seg.length; i++){ if (/^Khối lớp\s*\d+$/.test(seg[i])) { gi = i; break; } }
          if (gi >= 0 && seg[gi + 1]) {
            b1g.value = String(_sbNum(seg[gi]));
            _sbFillSubjects(b1s, b1g.value, seg[gi + 1]);
            b1s.value = seg[gi + 1];
            b1s.dispatchEvent(new Event('change'));
            if (seg[gi + 2]) {
              var node = _sbTree[b1g.value] ? _sbTree[b1g.value][b1s.value] : null;
              if (node) {
                var hit = node.chapterList.filter(function(c){ return c.name === seg[gi + 2]; })[0];
                if (hit) { b1c.value = hit.path; _sbApplyBank1(); }
              }
            }
          }
        }
      } catch(e) {}
      _sbApplyModeVisibility(_sbCurMode);
    })
    .catch(function(){
      document.getElementById('sb-b1-path').textContent = 'Không tải được danh mục thư mục (kiểm tra mạng).';
    });
  _sbApplyModeVisibility(typeof currentPushTab !== 'undefined' ? currentPushTab : 'theory');
}

(function(){
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    if (document.getElementById('subject-meta-grid')) { _sbInitPickers(); clearInterval(iv); }
    if (tries > 60) clearInterval(iv);
  }, 250);
  // Boc switchPushMode: doi che do la cap nhat an/hien bo chon + an cay
  var t2 = 0;
  var iv2 = setInterval(function(){
    t2++;
    if (typeof window.switchPushMode === 'function' && !window.switchPushMode.__sb540) {
      var orig = window.switchPushMode;
      var wrapped = function(mode){
        var r = orig.apply(this, arguments);
        try { _sbApplyModeVisibility(mode); } catch(e) {}
        return r;
      };
      wrapped.__sb540 = true;
      window.switchPushMode = wrapped;
      clearInterval(iv2);
    }
    if (t2 > 60) clearInterval(iv2);
  }, 250);
})();

console.log('SAOBAY wrap 0540 loaded');
})();
