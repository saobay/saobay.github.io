// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261012_1400
// SB_STUDYMIN_20261012_V1: giao nhiệm vụ lý thuyết kèm số phút học tối thiểu GV đặt (mặc định 5) -> task.studyMinutes
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

var SB_GAS_URL = 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';

function sbExamViewer(){
  var u = null;
  try { u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); } catch(e){}
  var id = '';
  try { if (typeof teacherId !== 'undefined' && teacherId) id = String(teacherId); } catch(e){}
  if (!id && u && u.id) id = String(u.id);
  return { id: id, name: (u && u.name) || '', isAdmin: !!(u && u.role === 'admin') };
}

function sbGasPush(filePath, contentStr, msg){
  return fetch(SB_GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: filePath, content: contentStr, commitMessage: msg }) })
    .then(function(r){ return r.json(); })
    .then(function(j){ if (!j || j.status !== 'success') throw new Error((j && j.message) || 'GAS lỗi'); return j; });
}
function sbGasDelete(filePath, msg){
  return fetch(SB_GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ type: 'DELETE_FROM_GITHUB', filePath: filePath, commitMessage: msg }) })
    .then(function(r){ return r.json(); }).catch(function(){ return null; });
}

// Đọc exam-schedule.json tươi, áp thay đổi, ghi lại; xong nạp lại danh sách.
function sbExamMutate(mutator, okMsg){
  var hh = ghHeaders(); hh['Accept'] = 'application/vnd.github.raw';
  return fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/data/exam-schedule.json', { headers: hh })
    .then(function(r){ return r.ok ? r.json() : { exams: [] }; })
    .then(function(j){
      var exams = (j && Array.isArray(j.exams)) ? j.exams : [];
      if (mutator(exams) === false) throw new Error('Không tìm thấy đề trong lịch.');
      return sbGasPush('data/exam-schedule.json', JSON.stringify({ exams: exams }, null, 1), 'Cap nhat de: ' + okMsg);
    })
    .then(function(){ dataCache = null; renderExams(); });
}
function sbExamPatch(id, patch, okMsg){
  return sbExamMutate(function(exams){
    var e = exams.filter(function(x){ return x.id === id; })[0];
    if (!e) return false;
    Object.keys(patch).forEach(function(k){ e[k] = patch[k]; });
    return true;
  }, okMsg);
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
  var pSched=(function(){ var hh=ghHeaders(); hh['Accept']='application/vnd.github.raw'; return fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/data/exam-schedule.json',{headers:hh}); })()
    .then(function(r){ return r.ok ? r.json() : {exams:[]}; })
    .then(function(j){ return (j && Array.isArray(j.exams)) ? j.exams : []; })
    .catch(function(){ return []; });
  var pClasses=(function(){ var hh=ghHeaders(); hh['Accept']='application/vnd.github.raw'; return fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/data/private/classes.json',{headers:hh}); })()
    .then(function(r){ return r.ok ? r.json() : {classes:[]}; })
    .then(function(j){ return (j && Array.isArray(j.classes)) ? j.classes : []; })
    .catch(function(){ return []; });
  dataPromise=Promise.all([pFiles,pSched,pClasses]).then(function(res){
    dataCache={files:res[0], scheduled:res[1], classes:res[2]};
    dataPromise=null;
    return dataCache;
  }).catch(function(e){ dataPromise=null; throw e; });
  return dataPromise;
}

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function sbExamStatusText(x){
  if (x.status === 'draft') return '⏳ Chờ giao cho HS';
  if (x.status === 'published') return '✅ ĐÃ GIAO — HS làm được ngay';
  if (x.status === 'active') return '🔴 Đang mở cho HS làm';
  if (x.status === 'scheduled') return '⏰ Đã đặt lịch — tự giao lúc ' + (x.examTime ? new Date(x.examTime).toLocaleString('vi-VN') : '?');
  return esc(x.status || '');
}

function renderExams(){
  var c=document.getElementById('manage-lessons-table-container');
  if(!c) return;
  if(!dataCache) c.innerHTML='<div id="saobay-exams-box"><p style="color:#666">⏳ Đang tải danh sách đề thi...</p></div>';
  fetchAll().then(function(d){
    var cc=document.getElementById('manage-lessons-table-container');
    if(!cc) return;
    var files=d.files, sched=d.scheduled, classes=d.classes||[];
    var viewer=sbExamViewer();
    // Phân quyền: GV chỉ thấy đề của mình; admin thấy tất cả + lọc theo GV
    var adminFilter=window.__sbExamTeacherFilter||'';
    var visible=sched.filter(function(x){
      if(viewer.isAdmin) return !adminFilter || String(x.teacherId||'')===adminFilter;
      if(!viewer.id) return true;
      return String(x.teacherId||'')===viewer.id;
    });
    if(!files.length && !sched.length){
      cc.innerHTML='<div id="saobay-exams-box" style="padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px">'
        +'<p style="font-weight:bold;margin:0 0 6px">📝 Đề thi đã tải lên</p>'
        +'<p style="color:#64748b;margin:0 0 8px">Chưa có đề thi nào. Đề tải lên qua Word / AI / tạo từ Bank sẽ hiện ở đây.</p>'
        +'<button id="saobay-exams-reload" style="padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🔄 Tải lại</button></div>';
    } else {
      var h='<div id="saobay-exams-box" style="padding:6px 2px">';
      h+='<p style="font-weight:bold;margin:0 0 8px">📝 Đề thi đã tải lên '
        +'<button id="saobay-exams-reload" style="margin-left:8px;padding:4px 10px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">🔄 Tải lại</button></p>';
      if(viewer.isAdmin){
        var teachers={};
        sched.forEach(function(x){ if(x.teacherId) teachers[String(x.teacherId)]=x.teacherName||''; });
        h+='<div style="margin:6px 0 10px;padding:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px"><b style="font-size:13px">👑 Admin — lọc theo giáo viên:</b> ';
        h+='<button data-sb-teacher-filter="" style="margin:2px;padding:4px 10px;border-radius:999px;border:1px solid #d97706;cursor:pointer;font-size:12px;'+(adminFilter===''?'background:#d97706;color:#fff':'background:#fff')+'">Tất cả GV</button>';
        Object.keys(teachers).forEach(function(tid){
          var label=(teachers[tid]?teachers[tid]+' ':'')+'('+tid+')';
          h+='<button data-sb-teacher-filter="'+esc(tid)+'" style="margin:2px;padding:4px 10px;border-radius:999px;border:1px solid #d97706;cursor:pointer;font-size:12px;'+(adminFilter===tid?'background:#d97706;color:#fff':'background:#fff')+'">'+esc(label)+'</button>';
        });
        h+='</div>';
      }
      if(sched.length){
        h+='<p style="font-weight:bold;color:#334155;margin:10px 0 4px">📌 Đề lưu riêng / lên lịch kiểm tra ('+visible.length+')</p><ul style="list-style:none;padding:0;margin:0">';
        visible.slice().reverse().forEach(function(x){
          var when = x.examTime ? ('🕐 '+new Date(x.examTime).toLocaleString('vi-VN')) : 'Chưa đặt giờ';
          var created = x.createdAt ? new Date(x.createdAt).toLocaleString('vi-VN') : '';
          var btn='padding:4px 10px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;margin:2px 2px 2px 0;';
          h+='<li style="padding:8px;border-bottom:1px solid #eee">📌 <b>'+esc(x.title||'(không tên)')+'</b>'
            +(viewer.isAdmin?'<br><small style="color:#92400e">GV: '+esc(x.teacherName||'')+' ('+esc(x.teacherId||'')+')</small>':'')
            +'<br><small style="color:#555">'+esc(x.className||'')+' • '+when+' • '+sbExamStatusText(x)+(created?' • Tạo: '+created:'')+'</small>'
            +'<div style="margin-top:4px">'
            +(x.status==='draft'?'<button data-exam-act="assign" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#16a34a;color:#fff">🚀 Giao bài cho lớp</button>'
            +'<button data-exam-act="publish" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#7c3aed;color:#fff">🌐 Public đề</button>':'')
            +(x.status==='scheduled'?'<button data-exam-act="schedule" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#f59e0b;color:#fff">🕐 Đổi giờ tự giao</button>':'')
            +(x.status==='published'||x.status==='active'||x.status==='scheduled'?'<button data-exam-act="unpublish" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#64748b;color:#fff">↩️ Thu hồi về nháp</button>':'')
            +'<button data-exam-act="edit" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#2563eb;color:#fff">✏️ Sửa</button>'
            +'<button data-exam-act="delete" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#dc2626;color:#fff">🗑 Xóa</button>'
            +'</div>'
            +(x.file && String(x.file).indexOf('data/bank-de/') === 0 ? '<div id="sb-share-slot-' + esc(x.id) + '" style="margin-top:2px"></div>' : '')
            +'<div id="sb-assign-form-'+esc(x.id)+'" style="display:none;margin-top:6px;padding:8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">'
            +'<div style="font-size:12px;font-weight:bold;margin-bottom:4px">Chọn lớp để giao đề này (đánh dấu nhiều lớp):</div>'
            +'<div id="sb-assign-classes-'+esc(x.id)+'"><span style="font-size:12px;color:#666">⏳ Đang tải danh sách lớp...</span></div>'
            +'<div style="margin-top:6px;font-size:12px"><label style="font-weight:bold"><input type="radio" name="sb-amode-'+esc(x.id)+'" value="now" checked> ⚡ Giao ngay (HS làm được luôn)</label> '
            +'<label style="font-weight:bold;margin-left:10px"><input type="radio" name="sb-amode-'+esc(x.id)+'" value="time"> 🕐 Đặt giờ tự giao: </label><input type="datetime-local" id="sb-assign-time-'+esc(x.id)+'" value="'+(x.examTime?String(x.examTime).slice(0,16):'')+'" style="padding:4px;border:1px solid #ccc;border-radius:6px;font-size:13px"></div>'
            +'<div style="margin-top:6px"><button data-exam-act="assign-save" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#16a34a;color:#fff">🚀 Giao cho các lớp đã chọn</button>'
            +'<button data-exam-act="form-close" data-exam-id="'+esc(x.id)+'" data-form="assign" style="'+btn+'background:#e2e8f0;color:#334155">Hủy</button></div>'
            +'<div style="font-size:11px;color:#666;margin-top:2px">Lớp gốc của đề được cập nhật tại chỗ; các lớp thêm sẽ nhận một bản giao riêng dùng chung file đề.</div></div>'
            +'<div id="sb-sched-form-'+esc(x.id)+'" style="display:none;margin-top:6px;padding:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px">'
            +'<label style="font-size:12px;font-weight:bold">Giờ tự giao đề: </label><input type="datetime-local" id="sb-sched-input-'+esc(x.id)+'" value="'+(x.examTime?String(x.examTime).slice(0,16):'')+'" style="padding:4px;border:1px solid #ccc;border-radius:6px;font-size:13px"> '
            +'<button data-exam-act="schedule-save" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#f59e0b;color:#fff">Lưu giờ</button>'
            +'<button data-exam-act="form-close" data-exam-id="'+esc(x.id)+'" data-form="sched" style="'+btn+'background:#e2e8f0;color:#334155">Hủy</button>'
            +'<div style="font-size:11px;color:#666;margin-top:2px">Đến giờ đã đặt, HS vào tab Bài Tập & Đề Thi sẽ thấy đề trong khung đỏ và làm bài.</div></div>'
            +'<div id="sb-edit-form-'+esc(x.id)+'" style="display:none;margin-top:6px;padding:8px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px">'
            +'<div style="margin-bottom:4px"><label style="font-size:12px;font-weight:bold">Tên đề: </label><input type="text" id="sb-edit-title-'+esc(x.id)+'" value="'+esc(x.title||'')+'" style="width:70%;padding:4px;border:1px solid #ccc;border-radius:6px;font-size:13px"></div>'
            +'<div style="margin-bottom:4px"><label style="font-size:12px;font-weight:bold">Lớp: </label><select id="sb-edit-class-'+esc(x.id)+'" style="padding:4px;border:1px solid #ccc;border-radius:6px;font-size:13px">'
            + classes.map(function(cl){ return '<option value="'+esc(cl.name)+'"'+(cl.name===x.className?' selected':'')+'>'+esc(cl.name)+'</option>'; }).join('')
            + (classes.some(function(cl){return cl.name===x.className;})?'':'<option value="'+esc(x.className||'')+'" selected>'+esc(x.className||'')+'</option>')
            +'</select> <label style="font-size:12px;font-weight:bold">Thời lượng (phút): </label><input type="number" id="sb-edit-dur-'+esc(x.id)+'" value="'+esc(x.durationMin||45)+'" style="width:70px;padding:4px;border:1px solid #ccc;border-radius:6px;font-size:13px"></div>'
            +'<button data-exam-act="edit-save" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#2563eb;color:#fff">Lưu thay đổi</button>'
            +'<button data-exam-act="form-close" data-exam-id="'+esc(x.id)+'" data-form="edit" style="'+btn+'background:#e2e8f0;color:#334155">Hủy</button></div>'
            +'</li>';
        });
        h+='</ul>';
        if(!visible.length) h+='<p style="color:#888;font-size:13px">Chưa có đề nào '+(viewer.isAdmin&&adminFilter?'của giáo viên này':'của bạn')+'.</p>';
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
    var bp=document.createElement('div'); bp.id='sb-bank2-inline'; cc.appendChild(bp); bk2Render(bp);
    var rb=document.getElementById('saobay-exams-reload');
    if(rb) rb.onclick=function(){ dataCache=null; renderExams(); };
    cc.querySelectorAll('[data-sb-teacher-filter]').forEach(function(b){
      b.addEventListener('click', function(){ window.__sbExamTeacherFilter=b.getAttribute('data-sb-teacher-filter')||''; renderExams(); });
    });
    cc.querySelectorAll('[data-exam-act]').forEach(function(b){
      b.addEventListener('click', function(){ sbExamAction(b.getAttribute('data-exam-act'), b.getAttribute('data-exam-id'), b); });
    });
  }).catch(function(e){
    var cc=document.getElementById('manage-lessons-table-container');
    if(cc) cc.innerHTML='<div id="saobay-exams-box"><p style="color:red">Không tải được danh sách đề ('+e.message+'). Kiểm tra mạng rồi bấm lại tab 2.</p></div>';
  });
}

function sbExamAction(act, id, btn){
  function fail(e){ alert('Lỗi: ' + e.message); if(btn){ btn.disabled=false; } }
  function busy(){ if(btn){ btn.disabled=true; btn.textContent='⏳ Đang xử lý...'; } }
  if(act==='form-close'){
    var f=document.getElementById('sb-'+btn.getAttribute('data-form')+'-form-'+id);
    if(f) f.style.display='none';
    return;
  }
  if(act==='schedule'){
    var sf=document.getElementById('sb-sched-form-'+id); if(sf) sf.style.display='block';
    return;
  }
  if(act==='assign'){
    var af=document.getElementById('sb-assign-form-'+id); if(af) af.style.display='block';
    var box=document.getElementById('sb-assign-classes-'+id);
    if(box && !box.getAttribute('data-loaded')){
      box.setAttribute('data-loaded','1');
      bk2Load().then(function(d){
        fetchAll().then(function(dd){
          var cur=(dd.scheduled||[]).filter(function(x){ return x.id===id; })[0]||{};
          if(!d.classes.length){ box.innerHTML='<span style="font-size:12px;color:#b91c1c">Bạn chưa có lớp nào.</span>'; return; }
          box.innerHTML=d.classes.map(function(c){
            var isCur=(c.id && cur.classId && c.id===cur.classId) || (!c.id && cur.className && c.name===cur.className);
            return '<label style="display:inline-block;margin:2px 8px 2px 0;font-size:13px"><input type="checkbox" data-sb-assign-class="'+esc(id)+'" value="'+esc(c.id)+'" data-name="'+esc(c.name)+'"'+(isCur?' checked':'')+'> '+(c.kind==='school'?'🏫 ':'👥 ')+esc(c.name)+'</label>';
          }).join('');
        });
      }).catch(function(e){ box.innerHTML='<span style="font-size:12px;color:#b91c1c">Lỗi tải lớp: '+esc(e.message)+'</span>'; });
    }
    return;
  }
  if(act==='assign-save'){
    var boxes=document.querySelectorAll('[data-sb-assign-class="'+id+'"]:checked');
    if(!boxes.length){ alert('Hãy chọn ít nhất 1 lớp.'); return; }
    var mode='now';
    document.querySelectorAll('input[name="sb-amode-'+id+'"]').forEach(function(r){ if(r.checked) mode=r.value; });
    var iso='';
    if(mode==='time'){
      var tin=document.getElementById('sb-assign-time-'+id);
      if(!tin || !tin.value){ alert('Hãy chọn ngày giờ tự giao.'); return; }
      iso=new Date(tin.value).toISOString();
    }
    busy();
    sbExamMutate(function(exams){
      var e=exams.filter(function(x){ return x.id===id; })[0];
      if(!e) return false;
      var targets=[];
      boxes.forEach(function(b){ targets.push({ classId: b.value, className: b.getAttribute('data-name')||'' }); });
      var ownUsed=false;
      targets.forEach(function(t, ti){
        var isOwn=(t.classId && e.classId && t.classId===e.classId) || (!t.classId && t.className===e.className) || (!e.classId && t.className===e.className);
        if(isOwn && !ownUsed){
          ownUsed=true;
          e.className=t.className;
          if(mode==='time'){ e.status='scheduled'; e.examTime=iso; } else { e.status='published'; e.examTime=new Date().toISOString(); }
        } else {
          var ne={};
          Object.keys(e).forEach(function(k){ ne[k]=e[k]; });
          ne.id='ex'+Date.now().toString(36)+'g'+ti;
          ne.classId=t.classId; ne.className=t.className;
          ne.createdAt=new Date().toISOString();
          if(mode==='time'){ ne.status='scheduled'; ne.examTime=iso; } else { ne.status='published'; ne.examTime=new Date().toISOString(); }
          exams.push(ne);
        }
      });
      return true;
    }, 'Giao de '+id+' cho lop').then(function(){ alert(mode==='time' ? '⏰ Đã đặt lịch giao đề cho các lớp đã chọn!' : '🚀 Đã giao đề! HS các lớp đã chọn mở tab Bài Tập & Đề Thi sẽ thấy đề trong khung đỏ.'); }).catch(fail);
    return;
  }
  if(act==='edit'){
    var ef=document.getElementById('sb-edit-form-'+id); if(ef) ef.style.display='block';
    return;
  }
  if(act==='publish'){
    if(!confirm('Giao đề này cho HS ngay bây giờ? HS sẽ thấy và làm được ngay.')) return;
    busy();
    sbExamPatch(id, { status: 'published' }, 'Public de '+id).then(function(){ alert('🌐 Đã Public đề! HS của lớp này mở tab Bài Tập & Đề Thi sẽ thấy đề trong khung đỏ và làm được ngay.'); }).catch(fail);
    return;
  }
  if(act==='unpublish'){
    if(!confirm('Thu hồi đề về bản nháp? HS sẽ không làm được đề này nữa.')) return;
    busy();
    sbExamPatch(id, { status: 'draft' }, 'Thu hoi de '+id).then(function(){ alert('Đã thu hồi đề về bản nháp.'); }).catch(fail);
    return;
  }
  if(act==='schedule-save'){
    var inp=document.getElementById('sb-sched-input-'+id);
    if(!inp || !inp.value){ alert('Hãy chọn ngày giờ giao đề.'); return; }
    var iso=new Date(inp.value).toISOString();
    busy();
    sbExamPatch(id, { status: 'scheduled', examTime: iso }, 'Dat gio giao de '+id).then(function(){ alert('⏰ Đã đặt lịch: đề sẽ tự giao cho HS lúc ' + new Date(iso).toLocaleString('vi-VN') + '.'); }).catch(fail);
    return;
  }
  if(act==='edit-save'){
    var t=document.getElementById('sb-edit-title-'+id);
    var cl=document.getElementById('sb-edit-class-'+id);
    var du=document.getElementById('sb-edit-dur-'+id);
    var patch={};
    if(t && t.value.trim()) patch.title=t.value.trim();
    if(cl && cl.value) patch.className=cl.value;
    if(du && du.value) patch.durationMin=parseInt(du.value,10)||45;
    if(!Object.keys(patch).length){ alert('Chưa có thay đổi nào.'); return; }
    busy();
    sbExamPatch(id, patch, 'Sua de '+id).then(function(){ alert('✅ Đã lưu thay đổi.'); }).catch(fail);
    return;
  }
  if(act==='delete'){
    if(!confirm('XÓA hẳn đề này? Đề sẽ biến mất khỏi danh sách của GV và HS không làm được nữa. (File đề cũng bị xóa khỏi kho.)')) return;
    busy();
    fetchAll().then(function(d){
      var e=(d.scheduled||[]).filter(function(x){ return x.id===id; })[0];
      return sbExamMutate(function(exams){
        var i=exams.findIndex(function(x){ return x.id===id; });
        if(i<0) return false;
        exams.splice(i,1);
        return true;
      }, 'Xoa de '+id).then(function(){
        var dels=[];
        if(e && e.file) dels.push(sbGasDelete(e.file, 'Xoa file de '+id));
        if(e && e.grade && e.subject && e.teacherId) dels.push(sbGasDelete('data/bank-de/Khối lớp '+e.grade+'/'+_sbNameOf(e.subject)+' '+e.grade+'/'+e.teacherId+'/'+id+'.json', 'Xoa bank-de '+id));
        return Promise.all(dels);
      });
    }).then(function(){ alert('🗑 Đã xóa đề.'); }).catch(fail);
    return;
  }
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
var _sbNameMap = {'TOAN':'Toán','VAN':'Văn','ANH':'Tiếng Anh','LY':'Vật lý','HOA':'Hóa học','SINH':'Sinh','SU':'Lịch sử','DIA':'Địa lý','TIN':'Tin học','GDCD':'GDCD','CONGNGHE':'Công nghệ','KHTN':'KHTN','GDKTPL':'GDKTPL'};
function _sbNameOf(code){ return _sbNameMap[String(code || '').toUpperCase()] || String(code || ''); }

function _sbBuildTree(paths){
  var root = {};
  paths.forEach(function(p){
    var seg = p.split('/');
    if (seg[0] !== 'data') return;
    if (seg[1] !== 'THCS' && seg[1] !== 'THPT') return; // 0725: chi cay bai hoc — tranh mon ma kieu 'TOAN 6' ro ri tu data/bank-de
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
  window.SB_BANK2 = { grade: g, subject: code, subjectName: sf };
  _sbSyncMeta(code, g, '');
  if (prev) prev.textContent = 'Đề sẽ lưu vào Bank 2: data/bank-de/Khối lớp ' + g + '/' + sf + '/<ID đăng nhập của bạn>/';
}

function _sbApplyModeVisibility(mode){
  _sbCurMode = mode || _sbCurMode;
  _sbHideTreeAside();
  var b1 = document.getElementById('sb-bank1-box');
  var b2 = document.getElementById('sb-bank2-box');
  if (!b1 || !b2) return;
  if (_sbCurMode === 'bank') { b1.style.display = 'none'; b2.style.display = 'none'; window.SB_BANK2 = null; }
  else if (_sbCurMode === 'direct' || _sbCurMode === 'ai') { // SB_AI_MODE_20261012: ai giong direct (de thi -> Bank 2 khi tick DE KIEM TRA)
    // SB_BANK_EXCLUSIVE 20261012_0820: mode Word/AI chi hien DUNG 1 bank theo loai noi dung:
    // tick "Day la DE KIEM TRA" -> chi Bank 2; bo tick (ly thuyet/bai tap) -> chi Bank 1.
    var _cb = document.getElementById('sched-is-exam');
    if (_cb && _cb.checked) { b1.style.display = 'none'; b2.style.display = ''; }
    else { b1.style.display = ''; b2.style.display = 'none'; window.SB_BANK2 = null; }
  }
  else { b1.style.display = ''; b2.style.display = 'none'; window.SB_BANK2 = null; }
}

function _sbInitPickers(){
  _sbHideTreeAside();
  if (!window._sbExamCbHook){
    window._sbExamCbHook = true;
    document.addEventListener('change', function(e){
      if (e.target && e.target.id === 'sched-is-exam' && (_sbCurMode === 'direct' || _sbCurMode === 'ai')) _sbApplyModeVisibility(_sbCurMode);
    });
  }
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
  var modeBtn = document.getElementById('push-mode-theory');
  var modeBox = modeBtn ? modeBtn.parentElement : null;
  if (modeBox && modeBox.parentNode) modeBox.parentNode.insertBefore(panel, modeBox.nextSibling);
  else grid.parentNode.insertBefore(panel, grid);

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


// === 0545: an luon nut "An/Hien Cau Truc Thu Muc" + vo hieu hoa toggleSidebar (cay da bo han theo yeu cau) ===
(function(){
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var btns = document.querySelectorAll('button[onclick="toggleSidebar()"]');
    btns.forEach(function(b){ b.style.display = 'none'; });
    if (typeof window.toggleSidebar === 'function' && !window.toggleSidebar.__sbOff) {
      var off = function(){ try { _sbHideTreeAside(); } catch(e) {} };
      off.__sbOff = true;
      window.toggleSidebar = off;
    }
    if (btns.length && window.toggleSidebar && window.toggleSidebar.__sbOff) clearInterval(iv);
    if (tries > 60) clearInterval(iv);
  }, 250);
})();


// === 0700: Panel "Giao nhiệm vụ cho lớp" v2 trong tab 2 (Quản lý) —
// Lớp chọn từ DANH SÁCH CỐ ĐỊNH: lớp trường GV được PHÂN CÔNG (used/used.is -> assignments)
// + lớp học thêm GV TỰ TẠO (data/private/classes.json). KHÔNG có ô gõ tay (gõ sai = HS không thấy).
// Bài chọn theo cây: Môn (đúng khối của lớp) -> Chương/Mục -> Bài. GV tạo lớp phải chọn khối
// (trường grade trong classes.json) nên vào đây khối đã đúng sẵn.
// Hoàn thành: lý thuyết -> data/class-task-done.json (HS học đủ 5 phút + cuộn cuối + bấm báo cáo);
// bài tập -> đếm bài đã nộp trong data/scores/ theo tên đề.
(function(){
  var GAS = 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
  var S = { built: false, loading: false, data: null, selClassKey: '', selType: 'exercise', selSubject: '', selChapter: '' };

  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim(); }
  function keyOf(s){ return norm(s).replace(/[^a-z0-9]/g, ''); }
  function myId(){ try { var g = (typeof teacherId !== 'undefined' && teacherId) ? String(teacherId) : ''; if (g) return g; var u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); return u ? String(u.id || '') : ''; } catch(e){ return ''; } }
  function myName(){ try { var u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); return u ? String(u.name || '') : ''; } catch(e){ return ''; } }
  function ghHeaders(){ var h = { 'Accept': 'application/vnd.github.raw' }; try { var t = (typeof getGithubToken === 'function') ? getGithubToken() : ''; if (t) h['Authorization'] = 'Bearer ' + t; } catch(e){} return h; }
  function apiRaw(path){ return fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/' + path.split('/').map(encodeURIComponent).join('/'), { headers: ghHeaders(), cache: 'no-store' }).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }); }
  function gasPush(filePath, content, msg){
    return fetch(GAS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: filePath, content: content, commitMessage: msg }) })
      .then(function(r){ return r.json(); }).then(function(j){ if (!j || (j.status !== 'success' && j.status !== 'ok')) throw new Error((j && j.message) || 'GAS lỗi'); return j; });
  }
  function parseGrade(name){
    var toks = String(name || '').match(/\d+/g) || [];
    for (var i = 0; i < toks.length; i++){ if (toks[i].length <= 2){ var n = parseInt(toks[i], 10); if (n >= 6 && n <= 12) return n; } }
    return null;
  }
  function cleanTitle(filename){
    var base = String(filename || '').replace(/\.html$/i, '');
    var m = base.match(/^([A-Z]+)_(\d+)_(.+)$/);
    if (m) base = m[3];
    base = base.replace(/_(Ly_thuyet|Bai_tap|Bai_kiem_tra)$/i, '').replace(/_(Ly_thuyet|Bai_tap)_.+$/i, '').replace(/_(LT|BT|KT)_.+$/i, '');
    return base.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function fetchAll(){
    var pTree = fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(j){ return (j.tree || []).map(function(t){ return t.path; }); }).catch(function(){ return []; });
    var pClasses = apiRaw('data/private/classes.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return []; });
    var pTasks = apiRaw('data/class-tasks.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return { tasks: [] }; });
    var pSched = apiRaw('data/exam-schedule.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return { exams: [] }; });
    var pAssign = fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/used/used.is?t=' + Date.now(), { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(j){ return Array.isArray(j.assignments) ? j.assignments : []; }).catch(function(){ return []; });
    var pDone = apiRaw('data/class-task-done.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return { done: [] }; });
    return Promise.all([pTree, pClasses, pTasks, pSched, pAssign, pDone]).then(function(rs){
      var paths = rs[0], classes = Array.isArray(rs[1]) ? rs[1] : (rs[1].classes || []);
      var tasks = (rs[2] && rs[2].tasks) || [], exams = (rs[3] && rs[3].exams) || [];
      var assignments = rs[4] || [], doneRecs = (rs[5] && rs[5].done) || [];
      var lessons = [], subjSet = {};
      paths.forEach(function(p){
        if (!/\.html$/i.test(p) || p.indexOf('data/private/') === 0 || p.indexOf('data/bank-de/') === 0) return;
        var isT = /_Ly_thuyet_/i.test(p), isE = /_Bai_tap_/i.test(p);
        if (!isT && !isE) return;
        var seg = p.split('/'); // data/<THCS|THPT>/Khối lớp G/<Môn>/<Chương>/<file> hoặc .../<Môn>/<file>
        if (seg.length < 5) return;
        var gradeFolder = seg[2], subj = seg[3];
        var gm = gradeFolder.match(/(\d{1,2})/); var grade = gm ? parseInt(gm[1], 10) : null;
        var chapter = seg.length >= 6 ? seg[4] : '';
        lessons.push({ path: p, type: isT ? 'theory' : 'exercise', title: cleanTitle(seg[seg.length - 1]), subj: subj, grade: grade, chapter: chapter });
      });
      var scoreMap = {}; // (0715: không còn đếm theo thư mục điểm — hoàn thành tính qua data/class-task-done.json)
      // Danh sách lớp của GV này
      var me = myId(), uname = norm(myName());
      var school = {};
      assignments.forEach(function(a){
        var t = String(a.teachers || '');
        var hit = (uname && norm(t.replace(/\(.*?\)/g, '')).indexOf(uname) >= 0) || (me && t.indexOf(me) >= 0);
        if (!hit || !a.class) return;
        if (!school[a.class]) school[a.class] = { kind: 'school', key: 'school:' + a.class, id: '', name: String(a.class), grade: parseGrade(a.class), subjects: [] };
        if (a.subject && school[a.class].subjects.indexOf(a.subject) < 0) school[a.class].subjects.push(a.subject);
      });
      var myClasses = Object.keys(school).sort().map(function(k){ return school[k]; });
      classes.forEach(function(c){
        if (me && String(c.teacher_id || '') !== String(me)) return;
        myClasses.push({ kind: 'pv', key: 'pv:' + c.id, id: c.id, name: c.name, grade: (c.grade ? parseInt(c.grade, 10) : parseGrade(c.name)), subjects: [], nStudents: (c.students || []).length });
      });
      return { lessons: lessons, tasks: tasks, exams: exams, doneRecs: doneRecs, scoreMap: scoreMap, myClasses: myClasses };
    });
  }

  var SUBJ_ALIAS = [ ['ngoai ngu', 'tieng anh'], ['tieng anh', 'tieng anh'], ['toan', 'toan'], ['ngu van', 'van'], ['van', 'van'], ['hoa', 'hoa'], ['vat ly', 'ly'], ['ly', 'ly'], ['lich su', 'su'], ['su', 'su'], ['dia', 'dia'], ['sinh', 'sinh'], ['tin', 'tin'], ['gdcd', 'gdcd'], ['gdk', 'gdk'], ['cong nghe', 'cong nghe'], ['khtn', 'khtn'], ['the chat', 'the'], ['gdqp', 'gdqp'], ['am nhac', 'nhac'], ['my thuat', 'thuat'] ];
  function matchSubject(subjFolder, assignedSubjects){
    var f = norm(subjFolder);
    for (var i = 0; i < assignedSubjects.length; i++){
      var a = norm(assignedSubjects[i]);
      for (var j = 0; j < SUBJ_ALIAS.length; j++){
        if (a.indexOf(SUBJ_ALIAS[j][0]) >= 0 && f.indexOf(SUBJ_ALIAS[j][1]) >= 0) return true;
      }
      if (f.indexOf(a) >= 0 || a.indexOf(f.replace(/\s*\d+\s*$/, '')) >= 0) return true;
    }
    return false;
  }

  function selClass(){
    if (!S.data) return null;
    for (var i = 0; i < S.data.myClasses.length; i++) if (S.data.myClasses[i].key === S.selClassKey) return S.data.myClasses[i];
    return S.data.myClasses[0] || null;
  }
  function subjectsFor(cls){
    var set = {}, out = [];
    S.data.lessons.forEach(function(L){ if (!cls.grade || L.grade === cls.grade){ if (!set[L.subj]) { set[L.subj] = 1; out.push(L.subj); } } });
    return out.sort();
  }
  function chaptersFor(cls, subj){
    var set = {}, out = [];
    S.data.lessons.forEach(function(L){ if (L.subj === subj && (!cls.grade || L.grade === cls.grade)){ var c = L.chapter || '(Bài ở gốc môn)'; if (!set[c]) { set[c] = 1; out.push(c); } } });
    return out.sort();
  }
  function itemsFor(cls, subj, chap, type){
    return S.data.lessons.filter(function(L){
      return L.subj === subj && (!cls.grade || L.grade === cls.grade) && (L.chapter || '(Bài ở gốc môn)') === chap && L.type === type;
    }).sort(function(a, b){ return a.title.localeCompare(b.title); });
  }

  function buildPanel(){
    var view = el('module-manage-view');
    if (!view || el('sb-task-panel')) { if (view && el('sb-task-panel')) S.built = true; return; }
    var panel = document.createElement('div');
    panel.id = 'sb-task-panel';
    panel.className = 'bg-white border-2 border-violet-200 rounded-2xl p-4 mb-4 shadow-sm';
    panel.innerHTML =
      '<h3 class="font-black text-violet-900 text-sm mb-1">📌 Giao nhiệm vụ cho lớp</h3>' +
      '<p class="text-[11px] text-slate-500 mb-3">Chỉ hiện các lớp BẠN được phân công dạy (lớp trường) và lớp học thêm BẠN tạo — chọn đúng lớp, đúng khối, rồi chọn Môn → Chương → Bài để giao. Học sinh chỉ thấy nhiệm vụ của lớp mình. Đề kiểm tra vẫn giao bằng luồng soạn đề + lên lịch (danh sách đề của lớp ở cuối panel).</p>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">' +
        '<div><label class="text-[11px] font-bold text-slate-600">Lớp nhận nhiệm vụ</label><select id="sb7-class" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"></select></div>' +
        '<div id="sb7-typewrap"><label class="text-[11px] font-bold text-slate-600">Loại nhiệm vụ</label><select id="sb7-type" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"><option value="exercise">✏️ Bài tập cần làm (nộp bài = hoàn thành)</option><option value="theory">📚 Lý thuyết cần học (học đủ số phút GV đặt bên dưới + kéo xuống cuối + báo cáo)</option></select></div>' +
      '</div>' +
      '<div id="sb7-minrow" class="mb-2" style="display:none"><label class="text-[11px] font-bold text-slate-600">⏱ Thời gian học lý thuyết tối thiểu (phút) — HS học đủ mới bấm được nút báo cáo học xong</label><input type="number" id="sb7-mins" min="1" max="180" step="1" value="5" class="w-24 text-sm border border-slate-300 rounded-lg px-2 py-2 ml-2"></div>' +
      '<div id="sb7-pickrow" class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">' +
        '<div><label class="text-[11px] font-bold text-slate-600">Môn</label><select id="sb7-subject" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"></select></div>' +
        '<div><label class="text-[11px] font-bold text-slate-600">Chương / Mục</label><select id="sb7-chapter" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"></select></div>' +
        '<div><label class="text-[11px] font-bold text-slate-600">Chọn bài</label><select id="sb7-item" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"></select></div>' +
      '</div>' +
      '<div class="flex flex-wrap gap-2 items-center">' +
        '<button id="sb7-assign" class="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-lg">🚀 Giao nhiệm vụ</button>' +
        '<button id="sb7-reload" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2 rounded-lg">↻ Tải lại dữ liệu</button>' +
        '<span id="sb7-msg" class="text-xs text-slate-500"></span>' +
      '</div>' +
      '<div class="mt-4 border-t border-slate-100 pt-3"><h4 id="sb7-tasklist-title" class="text-xs font-black text-slate-700 mb-2">Nhiệm vụ đã giao cho lớp này</h4><div id="sb7-tasklist"></div></div>' +
      '';
    view.insertBefore(panel, view.firstChild);
    S.built = true;
    el('sb7-class').addEventListener('change', function(){ S.selClassKey = this.value; S.selSubject = ''; S.selChapter = ''; fillSubjects(); fillTasks(); });
    el('sb7-type').addEventListener('change', function(){ S.selType = this.value; var mr = el('sb7-minrow'); if (mr) mr.style.display = (this.value === 'theory') ? '' : 'none'; fillItems(); });
    try { var lm = parseInt(localStorage.getItem('sb_theory_mins') || '5', 10); var mi0 = el('sb7-mins'); if (mi0 && lm >= 1 && lm <= 180) mi0.value = lm; } catch(e){}
    el('sb7-subject').addEventListener('change', function(){ S.selSubject = this.value; S.selChapter = ''; fillChapters(); });
    el('sb7-chapter').addEventListener('change', function(){ S.selChapter = this.value; fillItems(); });
    el('sb7-reload').addEventListener('click', function(){ loadAll(true); });
    el('sb7-assign').addEventListener('click', assignTask);
    loadAll(false);
  }

  function loadAll(manual){
    if (S.loading) return; S.loading = true;
    var msg = el('sb7-msg'); if (msg) msg.textContent = 'Đang tải...';
    fetchAll().then(function(data){
      S.data = data; S.loading = false;
      var cs = el('sb7-class');
      if (cs){
        if (!data.myClasses.length){ cs.innerHTML = '<option value="__all__">📋 Tất cả nhiệm vụ</option>'; }
        else {
          cs.innerHTML = '<option value="__all__">📋 Tất cả nhiệm vụ (xem tổng hợp)</option>' + data.myClasses.map(function(c){
            var lbl = (c.kind === 'school' ? '🏫 ' : '👥 ') + c.name + (c.grade ? ' — Khối ' + c.grade : '') + (c.kind === 'school' ? ' (lớp trường' + (c.subjects.length ? ' · ' + esc(c.subjects.join(', ')) : '') + ')' : ' (lớp học thêm' + (typeof c.nStudents === 'number' ? ' · ' + c.nStudents + ' HS' : '') + ')');
            return '<option value="' + esc(c.key) + '">' + esc(lbl) + '</option>';
          }).join('');
          if (!S.selClassKey) S.selClassKey = '__all__';
          if (S.selClassKey !== '__all__' && !selClass()) S.selClassKey = '__all__';
          cs.value = S.selClassKey;
        }
      }
      fillSubjects(); fillTasks();
      if (msg) msg.textContent = 'Đã tải: ' + data.myClasses.length + ' lớp của bạn · ' + data.lessons.length + ' bài.';
    }).catch(function(e){ S.loading = false; if (msg) msg.textContent = 'Lỗi tải dữ liệu: ' + e.message; });
  }

  function fillSubjects(){
    var cls = selClass(), ss = el('sb7-subject'); if (!ss || !cls) return;
    var subs = subjectsFor(cls);
    if (cls.kind === 'school' && cls.subjects.length){
      var mine = subs.filter(function(s){ return matchSubject(s, cls.subjects); });
      if (mine.length) subs = mine;
    }
    ss.innerHTML = subs.length ? subs.map(function(s){ return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('') : '<option value="">— Chưa có dữ liệu môn cho khối này —</option>';
    if (!S.selSubject || subs.indexOf(S.selSubject) < 0) S.selSubject = subs[0] || '';
    ss.value = S.selSubject;
    fillChapters();
  }
  function fillChapters(){
    var cls = selClass(), cs = el('sb7-chapter'); if (!cs || !cls) return;
    var chaps = chaptersFor(cls, S.selSubject);
    cs.innerHTML = chaps.length ? chaps.map(function(c){ return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') : '<option value="">—</option>';
    if (!S.selChapter || chaps.indexOf(S.selChapter) < 0) S.selChapter = chaps[0] || '';
    cs.value = S.selChapter;
    fillItems();
  }
  function fillItems(){
    var cls = selClass(), is = el('sb7-item'); if (!is || !cls) return;
    var items = itemsFor(cls, S.selSubject, S.selChapter, S.selType);
    is.innerHTML = items.length ? items.map(function(L){ return '<option value="' + esc(L.path) + '">' + esc(L.title) + '</option>'; }).join('') : '<option value="">— Chưa có ' + (S.selType === 'theory' ? 'lý thuyết' : 'bài tập') + ' trong mục này —</option>';
  }

  function assignTask(){
    var cls = selClass(); if (!cls){ alert('Chưa có lớp để giao.'); return; }
    var sel = el('sb7-item'); var path = sel ? sel.value : '';
    if (!path){ alert('Chưa chọn được bài để giao.'); return; }
    var lesson = null;
    S.data.lessons.forEach(function(L){ if (L.path === path) lesson = L; });
    if (!lesson) return;
    var msg = el('sb7-msg');
    apiRaw('data/class-tasks.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return { tasks: [] }; }).then(function(j){
      if (!Array.isArray(j.tasks)) j.tasks = [];
      var newTask = { id: 'task_' + Date.now().toString(36), classId: cls.id || '', className: cls.name,
        grade: cls.grade || lesson.grade || null, type: S.selType, title: lesson.title, path: lesson.path,
        teacherId: myId(), teacherName: myName(), createdAt: new Date().toISOString() };
      if (S.selType === 'theory'){
        var mi = el('sb7-mins'); var sm = mi ? (parseInt(mi.value, 10) || 5) : 5;
        if (sm < 1) sm = 1; if (sm > 180) sm = 180;
        newTask.studyMinutes = sm;
        try { localStorage.setItem('sb_theory_mins', String(sm)); } catch(e){}
      }
      j.tasks.push(newTask);
      return gasPush('data/class-tasks.json', JSON.stringify(j, null, 1), 'Giao nhiem vu ' + lesson.title + ' cho lop ' + cls.name);
    }).then(function(){
      if (msg) msg.textContent = '✅ Đã giao "' + lesson.title + '" cho lớp ' + cls.name;
      loadAll(true);
    }).catch(function(e){ alert('Lỗi giao nhiệm vụ: ' + e.message); });
  }

  function doneCount(task){
    var set = {};
    (S.data.doneRecs || []).forEach(function(r){ if (r.taskId === task.id && r.studentId) set[String(r.studentId)] = 1; });
    return Object.keys(set).length;
  }
  function submitInfo(task){
    var n = doneCount(task); // bản ghi hoàn thành (HS nộp bài -> hệ thống ghi nhận vào class-task-done)
    return n ? { n: n, count: n } : null;
  }

  function sb7ApplyMode(){
    var all = S.selClassKey === '__all__';
    var pr = el('sb7-pickrow'); if (pr) pr.style.display = all ? 'none' : '';
    var tw = el('sb7-typewrap'); if (tw) tw.style.display = all ? 'none' : '';
    var ab = el('sb7-assign'); if (ab) ab.style.display = all ? 'none' : '';
    var tt = el('sb7-tasklist-title'); if (tt) tt.textContent = all ? 'Tất cả nhiệm vụ đã giao' : 'Nhiệm vụ đã giao cho lớp này';
  }
  function sb7RowHtml(t, showClass){
    var stat = '';
    if (t.type === 'theory'){ var d = doneCount(t); stat = '<span class="text-[11px] font-bold ' + (d ? 'text-emerald-600' : 'text-slate-400') + '">✅ ' + d + ' HS đã báo học xong</span>'; }
    else { var si = submitInfo(t); stat = si ? '<span class="text-[11px] font-bold text-emerald-600">🧾 ' + si.n + ' HS đã nộp bài</span>' : '<span class="text-[11px] font-bold text-slate-400">🧾 Chưa có bài nộp</span>'; }
    var others = (S.data.myClasses || []).filter(function(c){ return !(c.id && t.classId && c.id === t.classId) && norm(c.name) !== norm(t.className || ''); });
    var more = '<div id="sb7-more-' + esc(t.id) + '" class="hidden mt-2 ml-9 flex flex-wrap gap-2 items-center">'
      + (others.length ? '<select id="sb7-moresel-' + esc(t.id) + '" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5">' + others.map(function(c){ return '<option value="' + esc(c.key) + '">' + (c.kind === 'school' ? '🏫 ' : '👥 ') + esc(c.name) + '</option>'; }).join('') + '</select>'
        + '<button data-sb7morego="' + esc(t.id) + '" class="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-2.5 py-1.5 rounded-lg">Giao cho lớp này</button>'
        : '<span class="text-[11px] text-slate-400 italic">Không còn lớp khác để giao thêm.</span>')
      + '</div>';
    return '<div class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-1.5"><div class="flex items-center gap-2">' +
      '<span class="text-base">' + (t.type === 'theory' ? '📚' : '✏️') + '</span>' +
      '<div class="flex-1 min-w-0"><div class="text-sm font-bold text-slate-800 truncate">' + esc(t.title) + '</div>' +
      '<div class="text-[11px] text-slate-400">' + (showClass ? 'Lớp: <b class="text-slate-600">' + esc(t.className || '') + '</b> · ' : '') + (t.type === 'theory' ? 'Lý thuyết cần học' : 'Bài tập cần làm') + ' · giao ' + esc(String(t.createdAt || '').slice(0, 10)) + '</div></div>' +
      stat +
      '<button data-sb7more="' + esc(t.id) + '" class="text-[11px] font-bold text-violet-700 border border-violet-300 hover:bg-violet-50 px-2 py-1.5 rounded-lg" title="Giao nhiệm vụ này thêm cho lớp khác">➕ Giao thêm</button>' +
      '<button data-sb7del="' + esc(t.id) + '" class="text-rose-500 hover:text-rose-700 font-black px-2" title="Xóa nhiệm vụ">✕</button></div>' + more + '</div>';
  }
  function sb7WireRows(box){
    if (!box) return;
    box.querySelectorAll('[data-sb7del]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-sb7del');
        if (!confirm('Xóa nhiệm vụ này?')) return;
        apiRaw('data/class-tasks.json').then(function(t){ return JSON.parse(t); }).then(function(j){
          j.tasks = (j.tasks || []).filter(function(x){ return x.id !== id; });
          return gasPush('data/class-tasks.json', JSON.stringify(j, null, 1), 'Xoa nhiem vu ' + id);
        }).then(function(){ loadAll(true); }).catch(function(e){ alert('Lỗi xóa: ' + e.message); });
      });
    });
    box.querySelectorAll('[data-sb7more]').forEach(function(b){
      b.addEventListener('click', function(){
        var d = el('sb7-more-' + b.getAttribute('data-sb7more'));
        if (d) d.classList.toggle('hidden');
      });
    });
    box.querySelectorAll('[data-sb7morego]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-sb7morego');
        var sel = el('sb7-moresel-' + id);
        if (!sel || !sel.value) return;
        var target = null;
        (S.data.myClasses || []).forEach(function(c){ if (c.key === sel.value) target = c; });
        var src = null;
        (S.data.tasks || []).forEach(function(x){ if (x.id === id) src = x; });
        if (!target || !src) return;
        apiRaw('data/class-tasks.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return { tasks: [] }; }).then(function(j){
          if (!Array.isArray(j.tasks)) j.tasks = [];
          var dup = j.tasks.some(function(x){ return x.path === src.path && x.type === src.type && norm(x.className || '') === norm(target.name) && ((target.id && x.classId === target.id) || !target.id); });
          if (dup){ alert('Lớp ' + target.name + ' đã có nhiệm vụ này rồi.'); return null; }
          j.tasks.push({ id: 'task_' + Date.now().toString(36), classId: target.id || '', className: target.name,
            grade: target.grade || src.grade || null, type: src.type, title: src.title, path: src.path,
            teacherId: myId(), teacherName: myName(), createdAt: new Date().toISOString() });
          return gasPush('data/class-tasks.json', JSON.stringify(j, null, 1), 'Giao them nhiem vu ' + src.title + ' cho lop ' + target.name);
        }).then(function(r){
          if (r) { alert('✅ Đã giao thêm "' + src.title + '" cho lớp ' + target.name); loadAll(true); }
        }).catch(function(e){ alert('Lỗi giao thêm: ' + e.message); });
      });
    });
  }
  function fillTasks(){
    var box = el('sb7-tasklist'); if (!box) return;
    sb7ApplyMode();
    var me = myId();
    var isAdmin = false;
    try { var u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); isAdmin = !!(u && u.role === 'admin'); } catch(e){}
    if (S.selClassKey === '__all__'){
      var all = (S.data.tasks || []).filter(function(t){ return isAdmin || !me || String(t.teacherId || '') === String(me); });
      box.innerHTML = all.length ? all.map(function(t){ return sb7RowHtml(t, true); }).join('') : '<p class="text-xs text-slate-400 italic">Bạn chưa giao nhiệm vụ nào.</p>';
      sb7WireRows(box);
      return;
    }
    var cls = selClass();
    if (!cls){ box.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa có lớp.</p>'; return; }
    var list = (S.data.tasks || []).filter(function(t){
      return (cls.id && t.classId === cls.id) || (!cls.id && norm(t.className) === norm(cls.name)) || (cls.id && !t.classId && norm(t.className) === norm(cls.name));
    });
    box.innerHTML = list.length ? list.map(function(t){ return sb7RowHtml(t, false); }).join('') : '<p class="text-xs text-slate-400 italic">Chưa giao nhiệm vụ nào cho lớp này.</p>';
    sb7WireRows(box);
  }

  window.sbTaskReload = loadAll;
  document.addEventListener('DOMContentLoaded', function(){
    var n = 0;
    var iv = setInterval(function(){
      n++;
      buildPanel();
      if (S.built || n > 80) clearInterval(iv);
    }, 300);
    document.addEventListener('click', function(){ setTimeout(buildPanel, 60); });
  });
})();


// === 0630: an thanh xanh "Vi tri luu tru bai day len" (moi mode da co bo chon noi luu rieng) ===
(function(){
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var d = document.getElementById('main-working-folder-display');
    if (d) {
      var bar = d.closest('div.bg-blue-900');
      if (bar) { bar.style.display = 'none'; clearInterval(iv); }
    }
    if (tries > 60) clearInterval(iv);
  }, 250);
})();

// ===== SAOBAY BANK2 PANEL v1 (2026-10-12): quan ly de trong Bank 2 + CHIA SE giua GV =====
// Moi de trong data/bank-de co che do chia se (truong share.mode trong file de):
//  - 'auto' (MAC DINH): rieng tu; tu dong chia se sau khi lop duoc giao kiem tra xong + 10 ngay.
//  - 'now': chia se ngay cho GV khac.
//  - 'locked': khoa — khong bao gio chia se.
// GV khac thay de da chia se: Xem + Day cho lop (chon nhieu lop). Chu de: Xem/Sua/Xoa/Day + doi che do.
var bk2Cache = null;
function bk2ApiRaw(path){
  var hh = ghHeaders(); hh['Accept'] = 'application/vnd.github.raw';
  return fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/' + path.split('/').map(encodeURIComponent).join('/'), { headers: hh, cache: 'no-store' })
    .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
}
function bk2Key(it){ return it.examId + '_' + String(it.ownerId).replace(/[^a-zA-Z0-9]/g, ''); }
function bk2ShareInfo(it){
  var mode = (it.share && it.share.mode) || 'auto';
  var base = it.examTime || '';
  if (!base && it.schedEntry && it.schedEntry.examTime) base = it.schedEntry.examTime;
  var shareAt = null;
  if (base){
    var done = new Date(base).getTime() + (parseInt(it.durationMin, 10) || 45) * 60000;
    if (!isNaN(done)) shareAt = done + 10 * 24 * 3600 * 1000;
  }
  if (mode === 'locked') return { mode: mode, shared: false, shareAt: shareAt, label: '🚫 Đã khóa — không chia sẻ' };
  if (mode === 'now') return { mode: mode, shared: true, shareAt: shareAt, label: '🌐 Đang chia sẻ' };
  if (shareAt && Date.now() > shareAt) return { mode: mode, shared: true, shareAt: shareAt, label: '🌐 Đang chia sẻ (tự động sau kiểm tra 10 ngày)' };
  if (shareAt) return { mode: mode, shared: false, shareAt: shareAt, label: '⏳ Riêng tư — tự chia sẻ từ ' + new Date(shareAt).toLocaleDateString('vi-VN') };
  return { mode: mode, shared: false, shareAt: null, label: '🔒 Riêng tư — sẽ chia sẻ sau khi giao kiểm tra + 10 ngày' };
}
function bk2Load(){
  if (bk2Cache) return Promise.resolve(bk2Cache);
  var pTree = fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1', { cache: 'no-store' })
    .then(function(r){ return r.json(); })
    .then(function(j){ return (j.tree || []).filter(function(t){ return t.type === 'blob'; }).map(function(t){ return t.path; }); })
    .catch(function(){ return []; });
  var pSched = bk2ApiRaw('data/exam-schedule.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return { exams: [] }; });
  var pClasses = bk2ApiRaw('data/private/classes.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return { classes: [] }; });
  var pAssign = fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/used/used.is?t=' + Date.now(), { cache: 'no-store' })
    .then(function(r){ return r.json(); })
    .then(function(j){ return Array.isArray(j.assignments) ? j.assignments : []; })
    .catch(function(){ return []; });
  return Promise.all([pTree, pSched, pClasses, pAssign]).then(function(rs){
    var paths = rs[0], sched = (rs[1] && rs[1].exams) || [], classesJson = (rs[2] && rs[2].classes) || [], assignments = rs[3] || [];
    var me = sbExamViewer();
    var byId = {}; sched.forEach(function(e){ byId[e.id] = e; });
    var files = paths.filter(function(p){ return /^data\/bank-de\/Khối lớp \d+\/[^\/]+\/[^\/]+\/[^\/]+\.json$/.test(p); }).slice(0, 200);
    var fetches = files.map(function(p){
      var seg = p.split('/');
      return bk2ApiRaw(p).then(function(t){
        var j = JSON.parse(t);
        var nQ = 0; (j.sets || []).forEach(function(s){ nQ += (s.questions || []).length; });
        return { path: p, gradeFolder: seg[2], subjFolder: seg[3], ownerId: seg[4],
          examId: j.exam_id || seg[5].replace(/\.json$/, ''), title: j.title || seg[5],
          subject: j.subject || '', grade: j.grade || '', examTime: j.exam_time || '',
          durationMin: j.duration_min || 45, share: j.share || null,
          ownerName: (j.share && j.share.ownerName) || '', nQ: nQ, raw: j,
          schedEntry: byId[j.exam_id] || null };
      }).catch(function(){ return null; });
    });
    function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim(); }
    var uname = norm(me.name), myClasses = [], seenSch = {};
    assignments.forEach(function(a){
      var t = String(a.teachers || '');
      var hit = (uname && norm(t.replace(/\(.*?\)/g, '')).indexOf(uname) >= 0) || (me.id && t.indexOf(me.id) >= 0);
      if (!hit || !a.class || seenSch[a.class]) return;
      seenSch[a.class] = 1;
      myClasses.push({ id: 'school:' + a.class, name: String(a.class), kind: 'school' });
    });
    classesJson.forEach(function(c){
      if (!me.id || String(c.teacher_id || '') !== String(me.id)) return;
      myClasses.push({ id: c.id, name: c.name, kind: 'pv' });
    });
    return Promise.all(fetches).then(function(items){
      bk2Cache = { items: items.filter(Boolean), sched: sched, classes: myClasses };
      return bk2Cache;
    });
  });
}
function bk2AssignForm(it, d){
  var key = bk2Key(it);
  var defTime = new Date(Date.now() + 3600000 - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  var h = '<div id="bk2-assign-' + key + '" style="display:none;margin-top:6px;padding:8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">'
    + '<p style="margin:0 0 4px;font-size:12px;font-weight:bold">Chọn lớp để đẩy đề này (đánh dấu nhiều lớp):</p>';
  if (!d.classes.length) h += '<p style="font-size:12px;color:#b91c1c;margin:0 0 4px">Bạn chưa có lớp nào (chưa được phân công / chưa tạo lớp học thêm).</p>';
  d.classes.forEach(function(c){
    h += '<label style="display:inline-block;margin:2px 8px 2px 0;font-size:13px"><input type="checkbox" data-bk2-class="' + key + '" value="' + esc(c.id) + '" data-name="' + esc(c.name) + '"> ' + (c.kind === 'school' ? '🏫 ' : '👥 ') + esc(c.name) + '</label>';
  });
  h += '<div style="margin-top:6px;font-size:12px"><label style="font-weight:bold">Giờ kiểm tra: </label><input type="datetime-local" id="bk2-time-' + key + '" value="' + defTime + '" style="padding:4px;border:1px solid #ccc;border-radius:6px"> '
    + '<label style="font-weight:bold">Thời lượng (phút): </label><input type="number" id="bk2-dur-' + key + '" value="' + (parseInt(it.durationMin, 10) || 45) + '" style="width:70px;padding:4px;border:1px solid #ccc;border-radius:6px"></div>'
    + '<div style="margin-top:6px"><button data-bk2-act="assign-save" data-bk2-path="' + esc(it.path) + '" style="padding:5px 12px;background:#16a34a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold">🚀 Đẩy cho các lớp đã chọn</button> '
    + '<button data-bk2-act="assign-close" data-bk2-path="' + esc(it.path) + '" style="padding:5px 12px;background:#e2e8f0;color:#334155;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold">Hủy</button></div>'
    + '<div style="font-size:11px;color:#666;margin-top:2px">HS của lớp được chọn sẽ thấy đề trong khung đỏ ở trang chủ, mở làm đúng giờ đã đặt.</div></div>';
  return h;
}
function bk2Row(it, isMine, d){
  var si = bk2ShareInfo(it);
  var key = bk2Key(it);
  var btn = 'padding:4px 10px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;margin:2px 2px 2px 0;';
  var h = '<li style="padding:8px;border-bottom:1px solid #e0e7ff">🗂️ <b>' + esc(it.title) + '</b>'
    + '<br><small style="color:#555">' + esc(it.subjFolder) + ' • ' + it.nQ + ' câu • ' + (it.durationMin || 45) + ' phút'
    + (isMine ? '' : ' • GV: ' + esc(it.ownerName || it.ownerId))
    + ' • ' + si.label + '</small>'
    + '<div style="margin-top:4px">'
    + '<button data-bk2-act="view" data-bk2-path="' + esc(it.path) + '" style="' + btn + 'background:#0ea5e9;color:#fff">👁 Xem</button>'
    + '<button data-bk2-act="assign" data-bk2-path="' + esc(it.path) + '" style="' + btn + 'background:#16a34a;color:#fff">🚀 Đẩy cho lớp</button>'
    + (isMine ? '<button data-bk2-act="edit" data-bk2-path="' + esc(it.path) + '" style="' + btn + 'background:#2563eb;color:#fff">✏️ Sửa</button>'
      + '<button data-bk2-act="delete" data-bk2-path="' + esc(it.path) + '" style="' + btn + 'background:#dc2626;color:#fff">🗑 Xóa</button>' : '')
    + '</div>';
  if (isMine){
    h += '<div style="margin-top:2px;font-size:12px">Chế độ chia sẻ: <select data-bk2-share="' + esc(it.path) + '" style="padding:4px;border:1px solid #c7d2fe;border-radius:6px;font-size:12px">'
      + '<option value="auto"' + (si.mode === 'auto' ? ' selected' : '') + '>Tự động — chia sẻ sau khi lớp kiểm tra xong + 10 ngày (mặc định)</option>'
      + '<option value="now"' + (si.mode === 'now' ? ' selected' : '') + '>Chia sẻ ngay cho GV khác</option>'
      + '<option value="locked"' + (si.mode === 'locked' ? ' selected' : '') + '>🔒 Khóa — không chia sẻ</option></select></div>'
      + '<div id="bk2-edit-' + key + '" style="display:none;margin-top:6px;padding:8px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px">'
      + '<div style="margin-bottom:4px"><label style="font-size:12px;font-weight:bold">Tên đề: </label><input type="text" id="bk2-title-' + key + '" value="' + esc(it.title) + '" style="width:70%;padding:4px;border:1px solid #ccc;border-radius:6px;font-size:13px"></div>'
      + '<div style="margin-bottom:4px"><label style="font-size:12px;font-weight:bold">Thời lượng (phút): </label><input type="number" id="bk2-dur2-' + key + '" value="' + (parseInt(it.durationMin, 10) || 45) + '" style="width:70px;padding:4px;border:1px solid #ccc;border-radius:6px;font-size:13px"></div>'
      + '<button data-bk2-act="edit-save" data-bk2-path="' + esc(it.path) + '" style="' + btn + 'background:#2563eb;color:#fff">Lưu thay đổi</button>'
      + '<button data-bk2-act="edit-close" data-bk2-path="' + esc(it.path) + '" style="' + btn + 'background:#e2e8f0;color:#334155">Hủy</button></div>';
  }
  h += bk2AssignForm(it, d);
  return h + '</li>';
}
function bk2ShareSelectHtml(it){
  var si = bk2ShareInfo(it);
  return '<span style="font-size:12px">Chế độ chia sẻ: </span><select data-bk2-share-slot="' + esc(it.path) + '" style="padding:4px;border:1px solid #c7d2fe;border-radius:6px;font-size:12px">'
    + '<option value="auto"' + (si.mode === 'auto' ? ' selected' : '') + '>Tự động — chia sẻ sau khi lớp kiểm tra xong + 10 ngày (mặc định)</option>'
    + '<option value="now"' + (si.mode === 'now' ? ' selected' : '') + '>Chia sẻ ngay cho GV khác</option>'
    + '<option value="locked"' + (si.mode === 'locked' ? ' selected' : '') + '>🔒 Khóa — không chia sẻ</option></select>'
    + ' <span style="font-size:11px;color:#64748b">' + esc(si.label) + '</span>';
}
function bk2FillShareSlots(d){
  var me = sbExamViewer();
  (d.items || []).forEach(function(it){
    if (!it.schedEntry) return;
    if (String(it.ownerId) !== String(me.id) && !me.isAdmin) return;
    var slot = document.getElementById('sb-share-slot-' + it.schedEntry.id);
    if (!slot || slot.getAttribute('data-filled')) return;
    slot.setAttribute('data-filled', '1');
    slot.innerHTML = bk2ShareSelectHtml(it);
    var sel = slot.querySelector('[data-bk2-share-slot]');
    if (sel) sel.addEventListener('change', function(){
      var raw = Object.assign({}, it.raw);
      raw.share = { mode: sel.value, ownerId: String(it.ownerId), ownerName: it.ownerName || me.name || '', createdAt: (it.share && it.share.createdAt) || new Date().toISOString() };
      sel.disabled = true;
      sbGasPush(it.path, JSON.stringify(raw, null, 1), 'Doi che do chia se de ' + it.examId)
        .then(function(){ bk2Cache = null; alert('✅ Đã đổi chế độ chia sẻ.'); })
        .catch(function(e){ sel.disabled = false; alert('Lỗi: ' + e.message); });
    });
  });
}
function bk2Render(host){
  if (!host) host = document.getElementById('sb-bank2-inline');
  if (!host) return;
  host.innerHTML = '<div style="margin-top:18px;padding:14px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px">'
    + '<p style="font-weight:bold;margin:0">🤝 Đề kiểm tra đồng nghiệp chia sẻ <button id="bk2-reload" style="margin-left:8px;padding:4px 10px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">🔄 Tải lại</button></p>'
    + '<p style="color:#64748b;margin:6px 0 0;font-size:13px">⏳ Đang tải kho đề...</p></div>';
  var rb = host.querySelector('#bk2-reload');
  bk2Load().then(function(d){
    var me = sbExamViewer();
    var others = d.items.filter(function(it){ return String(it.ownerId) !== String(me.id) && bk2ShareInfo(it).shared; });
    var h = '<div style="margin-top:18px;padding:14px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px">'
      + '<p style="font-weight:bold;margin:0">🤝 Đề kiểm tra đồng nghiệp chia sẻ <button id="bk2-reload" style="margin-left:8px;padding:4px 10px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">🔄 Tải lại</button></p>'
      + '<p style="color:#475569;font-size:12px;margin:6px 0 0">Mặc định đề ở chế độ riêng tư và <b>tự chia sẻ cho GV khác sau khi lớp được giao kiểm tra xong + 10 ngày</b> (trừ khi bạn khóa). GV khác chỉ Xem + Đẩy cho lớp của họ, không sửa/xóa được đề của bạn.</p>';
    h += '<p style="color:#64748b;font-size:12px;margin:8px 0 0">Mọi đề của bạn — dù tạo từ Word, AI hay ma trận, đã giao hay chưa — đều nằm ở <b>danh sách phía trên</b>, mỗi đề chỉ hiện một lần; đổi chế độ chia sẻ ngay trong từng thẻ đề.</p>';
    h += '<p style="font-weight:bold;color:#334155;margin:14px 0 4px">🌐 Đề GV khác đã chia sẻ (' + others.length + ')</p>';
    h += others.length ? '<ul style="list-style:none;padding:0;margin:0;background:#fff;border-radius:8px">' + others.map(function(it){ return bk2Row(it, false, d); }).join('') + '</ul>'
      : '<p style="color:#888;font-size:13px">Chưa có đề chia sẻ nào.</p>';
    h += '</div>';
    host.innerHTML = h;
    bk2Wire(host, d);
    bk2FillShareSlots(d);
  }).catch(function(e){
    host.innerHTML = '<div style="margin-top:18px;padding:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px"><p style="color:#b91c1c;margin:0">Không tải được Bank Đề (' + esc(e.message) + ').</p></div>';
  });
}
function bk2Find(d, path){ return (d.items || []).filter(function(it){ return it.path === path; })[0]; }
function bk2Wire(host, d){
  var rb = host.querySelector('#bk2-reload');
  if (rb) rb.onclick = function(){ bk2Cache = null; bk2Render(host); };
  host.querySelectorAll('[data-bk2-act]').forEach(function(b){
    b.addEventListener('click', function(){ bk2Action(b.getAttribute('data-bk2-act'), b.getAttribute('data-bk2-path'), d, b); });
  });
  host.querySelectorAll('[data-bk2-share]').forEach(function(sel){
    sel.addEventListener('change', function(){
      var it = bk2Find(d, sel.getAttribute('data-bk2-share'));
      if (!it) return;
      var me = sbExamViewer();
      var raw = Object.assign({}, it.raw);
      raw.share = { mode: sel.value, ownerId: String(it.ownerId), ownerName: it.ownerName || me.name || '', createdAt: (it.share && it.share.createdAt) || new Date().toISOString() };
      sel.disabled = true;
      sbGasPush(it.path, JSON.stringify(raw, null, 1), 'Doi che do chia se de ' + it.examId)
        .then(function(){ bk2Cache = null; alert('✅ Đã đổi chế độ chia sẻ.'); bk2Render(host); })
        .catch(function(e){ sel.disabled = false; alert('Lỗi: ' + e.message); });
    });
  });
}
function bk2View(it){
  var old = document.getElementById('bk2-modal'); if (old) old.remove();
  var h = '<div id="bk2-modal" style="position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.6);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:20px">'
    + '<div style="background:#fff;border-radius:12px;max-width:820px;width:100%;padding:20px;margin:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;font-size:16px">👁 ' + esc(it.title) + '</h3>'
    + '<button id="bk2-modal-close" style="border:none;background:#e2e8f0;border-radius:6px;padding:4px 12px;cursor:pointer;font-weight:bold">Đóng</button></div>'
    + '<p style="color:#64748b;font-size:12px">' + esc(it.subjFolder) + ' • ' + it.nQ + ' câu • ' + (it.durationMin || 45) + ' phút • GV: ' + esc(it.ownerName || it.ownerId) + '</p>';
  (it.raw.sets || []).forEach(function(set, si){
    h += '<h4 style="margin:14px 0 6px;color:#1e40af">' + esc(set.name || ('Bộ ' + (si + 1))) + '</h4>';
    (set.questions || []).forEach(function(q, qi){
      h += '<div style="padding:8px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px">'
        + '<div style="font-size:13px"><b>Câu ' + (qi + 1) + ':</b> ' + (q.q || '') + '</div>';
      if (q.type === 'mcq' && q.options && q.options.length){
        h += '<ul style="margin:4px 0 0;padding-left:18px;font-size:13px">' + q.options.map(function(o, oi){
          var letter = String.fromCharCode(65 + oi);
          var good = String(q.answer || '').toUpperCase() === letter;
          return '<li' + (good ? ' style="color:#16a34a;font-weight:bold"' : '') + '>' + o + (good ? ' ✓' : '') + '</li>';
        }).join('') + '</ul>';
      } else if (q.type === 'truefalse' && q.statements && q.statements.length){
        h += '<ul style="margin:4px 0 0;padding-left:18px;font-size:13px">' + q.statements.map(function(s){ return '<li>' + s + '</li>'; }).join('') + '</ul>'
          + '<div style="font-size:12px;color:#16a34a;font-weight:bold;margin-top:2px">Đáp án: ' + esc(q.answer || '') + '</div>';
      } else {
        h += '<div style="font-size:12px;color:#16a34a;font-weight:bold;margin-top:2px">Đáp án: ' + esc(q.answer || '') + '</div>';
      }
      if (q.explain) h += '<div style="font-size:12px;color:#64748b;margin-top:2px"><i>Giải thích: ' + esc(q.explain) + '</i></div>';
      h += '</div>';
    });
  });
  h += '</div></div>';
  var div = document.createElement('div'); div.innerHTML = h;
  document.body.appendChild(div.firstChild);
  document.getElementById('bk2-modal-close').onclick = function(){ var m = document.getElementById('bk2-modal'); if (m) m.remove(); };
  document.getElementById('bk2-modal').addEventListener('click', function(e){ if (e.target.id === 'bk2-modal') e.target.remove(); });
}
function bk2Action(act, path, d, btn){
  var it = bk2Find(d, path);
  if (!it) return;
  var key = bk2Key(it);
  function fail(e){ alert('Lỗi: ' + e.message); if (btn) btn.disabled = false; }
  if (act === 'view'){ bk2View(it); return; }
  if (act === 'assign'){ var f = document.getElementById('bk2-assign-' + key); if (f) f.style.display = 'block'; return; }
  if (act === 'assign-close'){ var f2 = document.getElementById('bk2-assign-' + key); if (f2) f2.style.display = 'none'; return; }
  if (act === 'edit'){ var e3 = document.getElementById('bk2-edit-' + key); if (e3) e3.style.display = 'block'; return; }
  if (act === 'edit-close'){ var e4 = document.getElementById('bk2-edit-' + key); if (e4) e4.style.display = 'none'; return; }
  if (act === 'assign-save'){
    var boxes = document.querySelectorAll('[data-bk2-class="' + key + '"]:checked');
    var timeInp = document.getElementById('bk2-time-' + key);
    var durInp = document.getElementById('bk2-dur-' + key);
    if (!boxes.length){ alert('Hãy chọn ít nhất 1 lớp.'); return; }
    if (!timeInp || !timeInp.value){ alert('Hãy chọn ngày giờ kiểm tra.'); return; }
    var iso = new Date(timeInp.value).toISOString();
    var dur = parseInt(durInp && durInp.value, 10) || parseInt(it.durationMin, 10) || 45;
    var me = sbExamViewer();
    var entries = [];
    boxes.forEach(function(b, i){
      entries.push({ id: 'ex' + Date.now().toString(36) + 'b' + i, title: it.title, subject: it.subject, grade: it.grade,
        classId: b.value, className: b.getAttribute('data-name') || '', examTime: iso, durationMin: dur,
        file: it.path, status: 'scheduled', teacherId: me.id, teacherName: me.name,
        createdAt: new Date().toISOString(), fromBank: it.examId, fromOwner: it.ownerId });
    });
    if (btn) btn.disabled = true;
    sbExamMutate(function(exams){ entries.forEach(function(e){ exams.push(e); }); return true; }, 'Day de bank ' + it.examId + ' cho ' + entries.length + ' lop')
      .then(function(){ bk2Cache = null; alert('🚀 Đã đẩy đề "' + it.title + '" cho ' + entries.length + ' lớp! HS sẽ thấy đề trong khung đỏ ở trang chủ.'); var p = document.getElementById('sb-bank2-inline'); if (p) bk2Render(p); })
      .catch(fail);
    return;
  }
  if (act === 'edit-save'){
    var tInp = document.getElementById('bk2-title-' + key);
    var dInp = document.getElementById('bk2-dur2-' + key);
    var newTitle = tInp && tInp.value.trim() ? tInp.value.trim() : it.title;
    var newDur = parseInt(dInp && dInp.value, 10) || parseInt(it.durationMin, 10) || 45;
    if (btn) btn.disabled = true;
    var raw = Object.assign({}, it.raw); raw.title = newTitle; raw.duration_min = newDur;
    sbGasPush(it.path, JSON.stringify(raw, null, 1), 'Sua de bank ' + it.examId)
      .then(function(){
        return sbExamMutate(function(exams){
          exams.forEach(function(e){ if (e.file === it.path || e.id === it.examId){ e.title = newTitle; e.durationMin = newDur; } });
          return true;
        }, 'Dong bo sua de bank ' + it.examId);
      })
      .then(function(){ bk2Cache = null; alert('✅ Đã lưu thay đổi.'); var p = document.getElementById('sb-bank2-inline'); if (p) bk2Render(p); })
      .catch(fail);
    return;
  }
  if (act === 'delete'){
    var used = (d.sched || []).filter(function(e){ return e.file === it.path; });
    var msg = 'XÓA hẳn đề "' + it.title + '" khỏi Bank 2?';
    if (used.length) msg += '\n⚠ Đề này đang được giao cho ' + used.length + ' lớp — các lịch giao đó cũng sẽ bị xóa, HS không làm được nữa.';
    if (!confirm(msg)) return;
    if (btn) btn.disabled = true;
    bk2Cache = null;
    sbExamMutate(function(exams){
      for (var i = exams.length - 1; i >= 0; i--){ if (exams[i].file === it.path) exams.splice(i, 1); }
      return true;
    }, 'Xoa lich giao de bank ' + it.examId)
      .then(function(){ return sbGasDelete(it.path, 'Xoa de khoi Bank 2: ' + it.examId); })
      .then(function(){ alert('🗑 Đã xóa đề khỏi Bank 2.'); var p = document.getElementById('sb-bank2-inline'); if (p) bk2Render(p); })
      .catch(fail);
    return;
  }
}

console.log('SAOBAY wrap 0630 loaded');

})();


// ===== SB PUSH POPUP v1 (2026-10-12): popup trang thai DAY DE — cho + ket qua, KHONG tu bien mat =====
// GV bam day de -> hien popup "Dang day..." (co the thu nho di lam viec khac); xong -> popup tu mo lai bao
// THANH CONG / THAT BAI ro rang, giu nguyen den khi GV bam Dong. Dung cho luong len lich kiem tra (Word/AI).
(function(){
  function ensure(){
    var m = document.getElementById('sb-push-modal');
    if (m) return m;
    var d = document.createElement('div');
    d.id = 'sb-push-modal';
    d.setAttribute('style', 'position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:16px');
    d.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:440px;width:100%;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.3)">'
      + '<div id="sb-push-icon" style="font-size:40px;text-align:center;line-height:1"></div>'
      + '<h3 id="sb-push-title" style="margin:10px 0 4px;text-align:center;font-size:17px;color:#0f172a"></h3>'
      + '<div id="sb-push-body" style="font-size:13px;color:#475569;text-align:center;white-space:pre-line"></div>'
      + '<div id="sb-push-time" style="font-size:11px;color:#94a3b8;text-align:center;margin-top:6px"></div>'
      + '<button id="sb-push-min" style="display:none;margin:14px auto 0;padding:8px 18px;background:#e2e8f0;color:#334155;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:13px">Thu nhỏ — tôi làm việc khác, xong báo tôi</button>'
      + '<button id="sb-push-close" style="display:none;margin:14px auto 0;padding:9px 22px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px">Đã rõ — Đóng</button>'
      + '</div>';
    document.body.appendChild(d);
    d.querySelector('#sb-push-close').addEventListener('click', function(){ d.style.display = 'none'; });
    d.querySelector('#sb-push-min').addEventListener('click', function(){ d.style.display = 'none'; });
    return d;
  }
  window.sbPushPending = function(title){
    var m = ensure();
    m.querySelector('#sb-push-icon').innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:#2563eb"></i>';
    m.querySelector('#sb-push-title').textContent = '⏳ Đang đẩy đề lên hệ thống...';
    m.querySelector('#sb-push-body').textContent = '\"' + (title || 'Đề kiểm tra') + '\" đang được đẩy (thường mất 10–60 giây).\nBạn cứ chuyển sang làm việc khác — đẩy xong, kết quả sẽ tự hiện lại ngay tại đây.';
    m.querySelector('#sb-push-time').textContent = 'Bắt đầu: ' + new Date().toLocaleTimeString('vi-VN');
    m.querySelector('#sb-push-close').style.display = 'none';
    m.querySelector('#sb-push-min').style.display = 'block';
    m.style.display = 'flex';
  };
  window.sbPushResult = function(ok, title, lines){
    var m = ensure();
    m.querySelector('#sb-push-icon').textContent = ok ? '✅' : '❌';
    m.querySelector('#sb-push-title').textContent = title || (ok ? 'Đẩy đề thành công!' : 'Đẩy đề thất bại');
    m.querySelector('#sb-push-body').textContent = lines || '';
    m.querySelector('#sb-push-time').textContent = 'Hoàn tất lúc: ' + new Date().toLocaleTimeString('vi-VN');
    m.querySelector('#sb-push-min').style.display = 'none';
    m.querySelector('#sb-push-close').style.display = 'block';
    m.style.display = 'flex';
  };
  /* ===== SB_SEMSTATS_20261012_V1 + SB_SEMSTATS_FIX_20261012_V2 + SB_BANK2DEDUP_20261012_V1: Thong ke cuoi ki / cuoi nam trong module stats =====
     GV chon lop (phan cong truong + lop rieng) -> xem thong ke HK1 (tu dau nam hoc den moc
     HK2 hoac den hien tai), HK2 (tu moc den hien tai), ca nam. Moc HK2 do GV chot bang
     nut "Bat dau HK2" (luu data/stats/hk2-start.json theo id GV + localStorage). */
  var semState = { init: false, loading: false, subs: null, classes: [], pvStudents: {}, period: 'hk1', hk2At: null, clsKey: '' };
  function semYearStart(){ var n = new Date(); var start = new Date(n.getFullYear(), 7, 1); if (n < start) start = new Date(n.getFullYear() - 1, 7, 1); return start; }
  function semFmtDT(iso){ try { return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); } catch(e){ return iso || ''; } }
  /* SB_SEMFIX_20261012_V3: khoi semstats dung ban sao tu tri cua cac ham dung chung —
     ban goc nam o scope khac, chay that bao "apiRaw is not defined" -> dropdown lop rong. */
  function semEsc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function semNorm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim(); }
  function semParseGrade(name){ if (typeof parseGrade === 'function') { try { return parseGrade(name); } catch(e){} } var m = String(name || '').match(/(\d{1,2})/); return m ? parseInt(m[1], 10) : null; }
  function semMyId(){ if (typeof myId === 'function') { try { return myId(); } catch(e){} } try { var g = (typeof teacherId !== 'undefined' && teacherId) ? String(teacherId) : ''; if (g) return g; var u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); return u ? String(u.id || '') : ''; } catch(e){ return ''; } }
  function semMyName(){ if (typeof myName === 'function') { try { return myName(); } catch(e){} } try { var u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); return u ? String(u.name || '') : ''; } catch(e){ return ''; } }
  function semGhHeaders(){ if (typeof ghHeaders === 'function') { try { return ghHeaders(); } catch(e){} } var h = { 'Accept': 'application/vnd.github.raw' }; try { var t = (typeof getGithubToken === 'function') ? getGithubToken() : ''; if (t) h['Authorization'] = 'Bearer ' + t; } catch(e){} return h; }
  function semApiRaw(path){ if (typeof apiRaw === 'function') return apiRaw(path); return fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/' + path.split('/').map(encodeURIComponent).join('/'), { headers: semGhHeaders(), cache: 'no-store' }).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }); }
  function semFetchAll(){ if (typeof fetchAll === 'function') return fetchAll(); return Promise.resolve({}); }
  function semGasPush(filePath, content, msg){ if (typeof gasPush === 'function') return gasPush(filePath, content, msg); if (typeof GAS !== 'undefined') return fetch(GAS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: filePath, content: content, commitMessage: msg }) }).then(function(r){ return r.json(); }).then(function(j){ if (!j || (j.status !== 'success' && j.status !== 'ok')) throw new Error((j && j.message) || 'GAS loi'); return j; }); return Promise.reject(new Error('gasPush khong kha dung')); }
  function semIsPriv(){ try { var u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); return !!(u && (u.role === 'admin' || u.role === 'bgh')); } catch(e){ return false; } }
  function semLoadMarks(){
    try { var ls = localStorage.getItem('sb_hk2_start_' + semMyId()); if (ls) semState.hk2At = ls; } catch(e){}
    return fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/stats/hk2-start.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; })
      .then(function(j){ var rec = (j || {})[semMyId()]; if (rec && rec.at) semState.hk2At = rec.at; });
  }
  function semSaveMark(iso){
    return fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/stats/hk2-start.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; })
      .then(function(j){
        j = j || {}; j[semMyId()] = { at: iso, by: semMyName() };
        return semGasPush('data/stats/hk2-start.json', JSON.stringify(j, null, 1), 'GV chot moc bat dau HK2: ' + semMyName());
      })
      .then(function(){
        semState.hk2At = iso;
        try { localStorage.setItem('sb_hk2_start_' + semMyId(), iso); } catch(e){}
      });
  }
  function semLoadClasses(){ // SB_SEMSTATS_FIX_20261012_V2: chiu loi tung nguon + moi GV thay lop phan cong va lop rieng cua minh
    var pAll = Promise.resolve().then(function(){ return semFetchAll(); }).catch(function(){ return {}; });
    var pPv = semApiRaw('data/private/classes.json').then(function(t){ return JSON.parse(t); }).catch(function(){ return {}; });
    var pUsed = fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/used/used.is?t=' + Date.now(), { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; });
    return Promise.all([pAll, pPv, pUsed]).then(function(rs){
      var data = rs[0] || {}, pvj = rs[1] || {}, used = rs[2] || {};
      var pvClasses = Array.isArray(pvj) ? pvj : (pvj.classes || []);
      semState.pvStudents = {};
      pvClasses.forEach(function(c){ semState.pvStudents[String(c.id)] = (c.students || []).map(function(st){ return semNorm(st && st.name); }); });
      var seen = {}, list = [];
      function add(c){ if (c && c.key && !seen[c.key]){ seen[c.key] = 1; list.push(c); } }
      (data.myClasses || []).forEach(add);
      var me = '', uname = '';
      try { me = semMyId(); } catch(e){}
      try { uname = semNorm(semMyName()); } catch(e){}
      if (me) pvClasses.forEach(function(c){
        if (String(c.teacher_id || c.teacherId || '') !== String(me)) return;
        add({ kind: 'pv', key: 'pv:' + c.id, id: c.id, name: c.name, grade: (c.grade ? parseInt(c.grade, 10) : semParseGrade(c.name)), subjects: [], nStudents: (c.students || []).length });
      });
      var priv = false; try { priv = semIsPriv(); } catch(e){}
      (used.assignments || []).forEach(function(a){
        if (!a.class) return;
        var t = String(a.teachers || '');
        var hit = (uname && semNorm(t.replace(/\(.*?\)/g, '')).indexOf(uname) >= 0) || (me && t.indexOf(me) >= 0);
        if (!hit && !priv) return;
        add({ kind: 'school', key: 'school:' + a.class, id: '', name: String(a.class), grade: semParseGrade(a.class), subjects: [] });
      });
      if (priv) pvClasses.forEach(function(c){
        add({ kind: 'pv', key: 'pv:' + c.id, id: c.id, name: c.name, grade: (c.grade ? parseInt(c.grade, 10) : semParseGrade(c.name)), subjects: [], nStudents: (c.students || []).length });
      });
      semState.classes = list;
      if (!semState.clsKey || !seen[semState.clsKey]) semState.clsKey = list.length ? list[0].key : '';
    });
  }
  function semLoadScores(statusEl){
    return fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1', { headers: semGhHeaders(), cache: 'no-store' })
      .then(function(r){ return r.json(); })
      .then(function(j){
        var paths = (j.tree || []).map(function(t){ return t.path; }).filter(function(p){ return p.indexOf('data/scores/') === 0 && /\.json$/i.test(p) && p.split('/').length === 4; });
        if (paths.length > 800) paths = paths.slice(0, 800);
        var subs = [], idx = 0;
        function next(){
          if (idx >= paths.length) return Promise.resolve();
          var batch = paths.slice(idx, idx + 12); idx += batch.length;
          if (statusEl) statusEl.textContent = '⏳ Đang tải bài nộp: ' + Math.min(idx, paths.length) + '/' + paths.length + ' file...';
          return Promise.all(batch.map(function(p){
            return fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/' + p.split('/').map(encodeURIComponent).join('/') + '?t=' + Date.now(), { cache: 'no-store' })
              .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
              .then(function(rec){ if (rec && rec.student_name && rec.submitted_at) subs.push(rec); });
          })).then(next);
        }
        return next().then(function(){ semState.subs = subs; });
      });
  }
  function semMatch(sub, cls){
    if (!cls) return false;
    if (cls.kind === 'school'){
      var n1 = semNorm(sub.student_class), n2 = semNorm(cls.name);
      return !!(n1 && n2 && (n1 === n2 || n1.indexOf(n2) >= 0 || n2.indexOf(n1) >= 0));
    }
    var names = semState.pvStudents[String(cls.id)] || [];
    if (names.indexOf(semNorm(sub.student_name)) >= 0) return true;
    return semNorm(sub.student_class) === semNorm(cls.name);
  }
  function semRange(){
    var start = semYearStart(), now = new Date();
    var hk2 = semState.hk2At ? new Date(semState.hk2At) : null;
    if (semState.period === 'hk1') return { from: start, to: hk2 || now, label: 'Học kì 1' };
    if (semState.period === 'hk2') return hk2 ? { from: hk2, to: now, label: 'Học kì 2' } : null;
    return { from: start, to: now, label: 'Cả năm' };
  }
  function semAggregate(cls, range){
    var byStu = {}, count = 0, sumPct = 0, pass = 0, bands = { gioi: 0, kha: 0, tb: 0, yeu: 0 }, exams = {};
    (semState.subs || []).forEach(function(r){
      var t = new Date(r.submitted_at).getTime();
      if (!(t >= range.from.getTime() && t <= range.to.getTime())) return;
      if (!semMatch(r, cls)) return;
      var pct = (parseFloat(r.max_score) > 0) ? (parseFloat(r.score) / parseFloat(r.max_score) * 100) : 0;
      count++; sumPct += pct; if (pct >= 50) pass++;
      if (pct >= 80) bands.gioi++; else if (pct >= 65) bands.kha++; else if (pct >= 50) bands.tb++; else bands.yeu++;
      if (r.exam_title) exams[r.exam_title] = 1;
      var k = semNorm(r.student_name);
      if (!byStu[k]) byStu[k] = { name: r.student_name, count: 0, sum: 0, last: 0 };
      byStu[k].count++; byStu[k].sum += pct; if (t > byStu[k].last) byStu[k].last = t;
    });
    var students = Object.keys(byStu).map(function(k){ var s = byStu[k]; return { name: s.name, count: s.count, avg: s.count ? s.sum / s.count : 0, last: s.last }; });
    students.sort(function(a, b){ return b.avg - a.avg; });
    return { count: count, nStu: students.length, avg: count ? sumPct / count : 0, passRate: count ? pass / count * 100 : 0, bands: bands, nExam: Object.keys(exams).length, students: students };
  }
  function semRender(){
    var sel = document.getElementById('sb-sem-class');
    var body = document.getElementById('sb-sem-body');
    var info = document.getElementById('sb-sem-hk2info');
    if (!body) return;
    if (sel){
      var sig = semState.classes.map(function(c){ return c.key; }).join('|');
      if (sel.getAttribute('data-sig') !== sig){
        sel.innerHTML = semState.classes.map(function(c){ return '<option value="' + semEsc(c.key) + '">' + semEsc(c.name) + (c.kind === 'pv' ? ' (lớp riêng)' : '') + '</option>'; }).join('');
        sel.setAttribute('data-sig', sig);
        sel.value = semState.clsKey;
      }
    }
    document.querySelectorAll('[data-sem-period]').forEach(function(b){ b.classList.toggle('sb-sem-on', b.getAttribute('data-sem-period') === semState.period); });
    if (info) info.innerHTML = semState.hk2At
      ? 'Mốc bắt đầu HK2: <b>' + semEsc(semFmtDT(semState.hk2At)) + '</b> — số liệu HK1 tính đến mốc này, HK2 từ mốc này đến nay.'
      : 'Chưa chốt mốc HK2 — HK1 đang tính từ đầu năm học đến <b>hiện tại</b>. Khi học kì 2 bắt đầu, bấm nút <b>Bắt đầu HK2</b> để chốt mốc.';
    var cls = null;
    semState.classes.forEach(function(c){ if (c.key === semState.clsKey) cls = c; });
    if (!semState.subs){ body.innerHTML = '<p class="text-xs text-slate-400 italic">Đang tải dữ liệu...</p>'; return; }
    if (!cls){ body.innerHTML = '<p class="text-xs text-slate-400 italic">Bạn chưa có lớp nào (chưa được phân công và chưa tạo lớp riêng).</p>'; return; }
    var range = semRange();
    if (!range){ body.innerHTML = '<p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Chưa chốt mốc bắt đầu HK2 nên chưa xem được HK2. Bấm nút <b>Bắt đầu HK2</b> ở trên để chốt mốc.</p>'; return; }
    var a = semAggregate(cls, range);
    var h = '<p class="text-xs text-slate-500">Lớp <b>' + semEsc(cls.name) + '</b> · ' + range.label + ' · từ ' + semEsc(semFmtDT(range.from.toISOString())) + ' đến ' + semEsc(semFmtDT(range.to.toISOString())) + ' (số liệu tính đến thời điểm hiện tại)</p>';
    if (!a.count){ body.innerHTML = h + '<p class="text-xs text-slate-400 italic mt-2">Chưa có bài nộp nào của lớp này trong khoảng thời gian trên.</p>'; return; }
    function card(label, val, sub){ return '<div class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center"><p class="text-[11px] text-slate-500 font-bold">' + label + '</p><p class="text-xl font-black text-slate-800">' + val + '</p><p class="text-[10px] text-slate-400">' + sub + '</p></div>'; }
    h += '<div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">'
      + card('Bài đã nộp', a.count, a.nExam + ' đề/bài khác nhau')
      + card('Học sinh đã làm', a.nStu, 'học sinh')
      + card('Điểm trung bình', (a.avg / 10).toFixed(2), 'thang 10')
      + card('Tỉ lệ đạt', a.passRate.toFixed(0) + '%', 'đạt = từ 50% điểm tối đa')
      + '</div>';
    h += '<p class="text-xs mt-2">Phân bố: <span class="font-bold text-emerald-700">Giỏi ' + a.bands.gioi + '</span> · <span class="font-bold text-blue-700">Khá ' + a.bands.kha + '</span> · <span class="font-bold text-amber-700">Trung bình ' + a.bands.tb + '</span> · <span class="font-bold text-rose-700">Yếu ' + a.bands.yeu + '</span></p>';
    h += '<div class="overflow-x-auto mt-2"><table class="w-full text-xs"><thead><tr class="bg-slate-100 text-slate-600"><th class="px-2 py-1.5 text-left">STT</th><th class="px-2 py-1.5 text-left">Học sinh</th><th class="px-2 py-1.5 text-right">Số bài</th><th class="px-2 py-1.5 text-right">Điểm TB (thang 10)</th><th class="px-2 py-1.5 text-left">Bài gần nhất</th></tr></thead><tbody>';
    a.students.forEach(function(s, i){
      h += '<tr class="border-t"><td class="px-2 py-1.5 text-slate-400">' + (i + 1) + '</td><td class="px-2 py-1.5 font-semibold">' + semEsc(s.name) + '</td><td class="px-2 py-1.5 text-right">' + s.count + '</td><td class="px-2 py-1.5 text-right font-black">' + (s.avg / 10).toFixed(2) + '</td><td class="px-2 py-1.5 text-slate-500">' + semEsc(semFmtDT(new Date(s.last).toISOString())) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    body.innerHTML = h;
  }
  function semInit(){
    var view = document.getElementById('module-stats-view');
    if (!view || semState.init) return;
    semState.init = true;
    var sel = document.getElementById('sb-sem-class');
    if (sel) sel.addEventListener('change', function(){ semState.clsKey = sel.value; semRender(); });
    view.querySelectorAll('[data-sem-period]').forEach(function(b){ b.addEventListener('click', function(){ semState.period = b.getAttribute('data-sem-period'); semRender(); }); });
    var refresh = document.getElementById('sb-sem-refresh');
    if (refresh) refresh.addEventListener('click', function(){ semState.subs = null; semLoadClasses().then(function(){ semRender(); }); semLoadScores(document.getElementById('sb-sem-status')).then(function(){ var st = document.getElementById('sb-sem-status'); if (st) st.textContent = ''; semRender(); }); });
    var hk2btn = document.getElementById('sb-sem-hk2btn');
    if (hk2btn) hk2btn.addEventListener('click', function(){
      var inp = document.getElementById('sb-sem-hk2input');
      var iso = (inp && inp.value) ? new Date(inp.value).toISOString() : new Date().toISOString();
      if (!confirm('Chốt mốc bắt đầu học kì 2 = ' + semFmtDT(iso) + '?\nSố liệu HK1 sẽ tính đến mốc này, HK2 tính từ mốc này.')) return;
      hk2btn.disabled = true; hk2btn.textContent = '⏳ Đang chốt...';
      semSaveMark(iso).then(function(){
        hk2btn.disabled = false; hk2btn.textContent = '🚀 Bắt đầu HK2';
        alert('✅ Đã chốt mốc bắt đầu HK2: ' + semFmtDT(iso));
        semRender();
      }).catch(function(e){
        hk2btn.disabled = false; hk2btn.textContent = '🚀 Bắt đầu HK2';
        alert('Lỗi chốt mốc: ' + (e && e.message || e));
      });
    });
    var statusEl = document.getElementById('sb-sem-status');
    semRender();
    semLoadMarks().catch(function(){}).then(function(){ return semLoadClasses(); }).then(function(){
      if (!semState.classes.length) return semLoadClasses();
    }).then(function(){
      semRender();
      return semLoadScores(statusEl);
    }).then(function(){
      if (statusEl) statusEl.textContent = '';
      semRender();
    }).catch(function(e){
      if (statusEl) statusEl.textContent = 'Lỗi tải thống kê: ' + (e && e.message || e);
    });
  }
  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target.closest('#mod-tab-stats') : null;
    if (t) setTimeout(semInit, 60);
  });
  /* ===== HẾT SB_SEMSTATS_20261012_V1 ===== */

})();
