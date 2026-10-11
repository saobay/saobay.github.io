// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261012_0630
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
  if (x.status === 'draft') return '📝 Chuẩn bị (bản nháp)';
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
            +(x.status==='draft'?'<button data-exam-act="publish" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#16a34a;color:#fff">🚀 Giao ngay</button>':'')
            +(x.status!=='published'&&x.status!=='active'?'<button data-exam-act="schedule" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#f59e0b;color:#fff">🕐 Đặt giờ tự giao</button>':'')
            +(x.status==='published'||x.status==='active'||x.status==='scheduled'?'<button data-exam-act="unpublish" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#64748b;color:#fff">↩️ Thu hồi về nháp</button>':'')
            +'<button data-exam-act="edit" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#2563eb;color:#fff">✏️ Sửa</button>'
            +'<button data-exam-act="delete" data-exam-id="'+esc(x.id)+'" style="'+btn+'background:#dc2626;color:#fff">🗑 Xóa</button>'
            +'</div>'
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
  if(act==='edit'){
    var ef=document.getElementById('sb-edit-form-'+id); if(ef) ef.style.display='block';
    return;
  }
  if(act==='publish'){
    if(!confirm('Giao đề này cho HS ngay bây giờ? HS sẽ thấy và làm được ngay.')) return;
    busy();
    sbExamPatch(id, { status: 'published' }, 'Giao ngay de '+id).then(function(){ alert('✅ Đã giao đề! HS mở tab Bài Tập & Đề Thi sẽ thấy đề trong khung đỏ.'); }).catch(fail);
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
        if(e && e.grade && e.subject && e.teacherId) dels.push(sbGasDelete('data/bank-de/Khối lớp '+e.grade+'/'+e.subject+' '+e.grade+'/'+e.teacherId+'/'+id+'.json', 'Xoa bank-de '+id));
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
      // Đếm bài nộp theo thư mục điểm: data/scores/<folder>/<ts>_<slugHS>.json
      var scoreMap = {}; // keyOf(folder) -> {students: {slug:true}, count}
      paths.forEach(function(p){
        var m = p.match(/^data\/scores\/([^\/]+)\/(\d{8,})_(.+)\.json$/);
        if (!m) return;
        var k = keyOf(m[1]);
        if (!scoreMap[k]) scoreMap[k] = { students: {}, count: 0 };
        scoreMap[k].students[m[3]] = true; scoreMap[k].count++;
      });
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
        '<div><label class="text-[11px] font-bold text-slate-600">Loại nhiệm vụ</label><select id="sb7-type" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"><option value="exercise">✏️ Bài tập cần làm (nộp bài = hoàn thành)</option><option value="theory">📚 Lý thuyết cần học (học đủ 5 phút + kéo xuống cuối + báo cáo)</option></select></div>' +
      '</div>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">' +
        '<div><label class="text-[11px] font-bold text-slate-600">Môn</label><select id="sb7-subject" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"></select></div>' +
        '<div><label class="text-[11px] font-bold text-slate-600">Chương / Mục</label><select id="sb7-chapter" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"></select></div>' +
        '<div><label class="text-[11px] font-bold text-slate-600">Chọn bài</label><select id="sb7-item" class="w-full text-sm border border-slate-300 rounded-lg px-2 py-2"></select></div>' +
      '</div>' +
      '<div class="flex flex-wrap gap-2 items-center">' +
        '<button id="sb7-assign" class="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-lg">🚀 Giao nhiệm vụ</button>' +
        '<button id="sb7-reload" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2 rounded-lg">↻ Tải lại dữ liệu</button>' +
        '<span id="sb7-msg" class="text-xs text-slate-500"></span>' +
      '</div>' +
      '<div class="mt-4 border-t border-slate-100 pt-3"><h4 class="text-xs font-black text-slate-700 mb-2">Nhiệm vụ đã giao cho lớp này</h4><div id="sb7-tasklist"></div></div>' +
      '<div class="mt-4 border-t border-slate-100 pt-3"><h4 class="text-xs font-black text-slate-700 mb-2">📝 Đề kiểm tra của lớp này (giao qua luồng lên lịch)</h4><div id="sb7-examlist"></div></div>';
    view.insertBefore(panel, view.firstChild);
    S.built = true;
    el('sb7-class').addEventListener('change', function(){ S.selClassKey = this.value; S.selSubject = ''; S.selChapter = ''; fillSubjects(); fillTasks(); });
    el('sb7-type').addEventListener('change', function(){ S.selType = this.value; fillItems(); });
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
        if (!data.myClasses.length){ cs.innerHTML = '<option value="">— Bạn chưa có lớp được phân công / chưa tạo lớp học thêm —</option>'; }
        else {
          cs.innerHTML = data.myClasses.map(function(c){
            var lbl = (c.kind === 'school' ? '🏫 ' : '👥 ') + c.name + (c.grade ? ' — Khối ' + c.grade : '') + (c.kind === 'school' ? ' (lớp trường' + (c.subjects.length ? ' · ' + esc(c.subjects.join(', ')) : '') + ')' : ' (lớp học thêm' + (typeof c.nStudents === 'number' ? ' · ' + c.nStudents + ' HS' : '') + ')');
            return '<option value="' + esc(c.key) + '">' + esc(lbl) + '</option>';
          }).join('');
          if (!S.selClassKey || !selClass()) S.selClassKey = data.myClasses[0].key;
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
      j.tasks.push({ id: 'task_' + Date.now().toString(36), classId: cls.id || '', className: cls.name,
        grade: cls.grade || lesson.grade || null, type: S.selType, title: lesson.title, path: lesson.path,
        teacherId: myId(), teacherName: myName(), createdAt: new Date().toISOString() });
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
    var info = S.data.scoreMap[keyOf(task.title)];
    if (!info) return null;
    return { n: Object.keys(info.students).length, count: info.count };
  }

  function fillTasks(){
    var cls = selClass(), box = el('sb7-tasklist'); if (!box) return;
    if (!cls){ box.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa có lớp.</p>'; return; }
    var list = (S.data.tasks || []).filter(function(t){
      return (cls.id && t.classId === cls.id) || (!cls.id && norm(t.className) === norm(cls.name)) || (cls.id && !t.classId && norm(t.className) === norm(cls.name));
    });
    if (!list.length) box.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa giao nhiệm vụ nào cho lớp này.</p>';
    else box.innerHTML = list.map(function(t){
      var stat = '';
      if (t.type === 'theory'){ var d = doneCount(t); stat = '<span class="text-[11px] font-bold ' + (d ? 'text-emerald-600' : 'text-slate-400') + '">✅ ' + d + ' HS đã báo học xong</span>'; }
      else { var si = submitInfo(t); stat = si ? '<span class="text-[11px] font-bold text-emerald-600">🧾 ' + si.n + ' HS đã nộp bài</span>' : '<span class="text-[11px] font-bold text-slate-400">🧾 Chưa có bài nộp</span>'; }
      return '<div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-1.5">' +
        '<span class="text-base">' + (t.type === 'theory' ? '📚' : '✏️') + '</span>' +
        '<div class="flex-1 min-w-0"><div class="text-sm font-bold text-slate-800 truncate">' + esc(t.title) + '</div>' +
        '<div class="text-[11px] text-slate-400">' + (t.type === 'theory' ? 'Lý thuyết cần học' : 'Bài tập cần làm') + ' · giao ' + esc(String(t.createdAt || '').slice(0, 10)) + '</div></div>' +
        stat +
        '<button data-sb7del="' + esc(t.id) + '" class="text-rose-500 hover:text-rose-700 font-black px-2" title="Xóa nhiệm vụ">✕</button></div>';
    }).join('');
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
    var eb = el('sb7-examlist');
    if (eb){
      var ex = (S.data.exams || []).filter(function(e){ return norm(e.className) === norm(cls.name) || (cls.id && e.classId === cls.id); });
      eb.innerHTML = ex.length ? ex.map(function(e){
        return '<div class="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-1.5"><div class="text-sm font-bold text-slate-800">📝 ' + esc(e.title) + '</div><div class="text-[11px] text-rose-500 font-bold">' + (e.status === 'draft' ? 'Nháp — chưa giao' : e.status === 'scheduled' ? 'Đã đặt lịch giao' : 'Đã giao — HS làm được') + '</div></div>';
      }).join('') : '<p class="text-xs text-slate-400 italic">Lớp này chưa có đề kiểm tra nào.</p>';
    }
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

console.log('SAOBAY wrap 0630 loaded');

})();
