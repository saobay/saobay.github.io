// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261012_0615
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


// === 0600: Panel "Giao nhiệm vụ cho lớp" trong tab 2 (Quản lý) —
// GV giao lý thuyết/bài tập cho 1 lớp (lớp học thêm của GV hoặc lớp trường); HS thấy trong "Lớp của tôi".
// Dữ liệu: data/class-tasks.json qua GAS proxy. Đề kiểm tra vẫn giao bằng luồng lên lịch sẵn có (liệt kê kèm ở đây).
(function(){
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
  var RAW = 'https://raw.githubusercontent.com/saobay/saobay.github.io/main/';
  var S = { classes: [], exams: [], tasks: null, tree: null, built: false };
  function esc(t){ return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function norm(s){ return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function fmtDT(iso){ var d = new Date(iso); if (isNaN(d.getTime())) return ''; function p(n){ return (n < 10 ? '0' : '') + n; } return p(d.getHours()) + ':' + p(d.getMinutes()) + ' ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function myId(){
    try { if (typeof teacherId !== 'undefined' && teacherId) return String(teacherId); } catch(e){}
    try { var u = JSON.parse(localStorage.getItem('saobay_user') || 'null'); if (u && u.id) return String(u.id); } catch(e){}
    return '';
  }
  function fetchJson(url){ return fetch(url).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function apiJson(path){ return fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/' + path, { headers: { 'Accept': 'application/vnd.github.raw' } }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function gasPush(filePath, contentStr, msg){
    return fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: filePath, content: contentStr, commitMessage: msg }) })
      .then(function(r){ return r.json(); })
      .then(function(j){ if (!j || j.status !== 'success') throw new Error((j && j.message) || 'GAS lỗi'); return j; });
  }
  function cleanTitle(path){
    var base = path.split('/').pop().replace(/\.html$/i, '');
    var t = base.replace(/_/g, ' ');
    t = t.replace(/\b(Ly thuyet|Bai tap|none)\b/gi, ' ');
    t = t.replace(/^[A-Z]{2,6} \d{1,2} /, '');
    return t.replace(/\s+/g, ' ').trim() || base;
  }

  function buildPanel(){
    var view = document.getElementById('module-manage-view');
    if (!view || document.getElementById('sb-task-panel')) return;
    var panel = document.createElement('div');
    panel.id = 'sb-task-panel';
    panel.className = 'bg-white border border-violet-300 rounded-2xl p-4 shadow-sm mb-4';
    panel.innerHTML =
      '<h3 class="font-black text-violet-900 text-base mb-1"><i class="fa-solid fa-thumbtack mr-2"></i>Giao nhiệm vụ cho lớp</h3>'
      + '<p class="text-xs text-slate-500 mb-3">Chọn lớp + bài học/bài tập để giao. Học sinh thấy nhiệm vụ trong mục <b>Lớp của tôi</b> ở trang chủ (chỉ HS thuộc lớp đó mới thấy). Đề kiểm tra giao bằng luồng soạn đề + lên lịch như hiện tại — danh sách đề của lớp hiện ở cuối panel này.</p>'
      + '<div class="grid md:grid-cols-2 gap-3 mb-3">'
      +   '<div><label class="block text-xs font-bold text-slate-600 mb-1">Lớp nhận nhiệm vụ</label>'
      +   '<select id="sbt-class" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white"></select>'
      +   '<input id="sbt-class-custom" placeholder="Hoặc gõ tên lớp trường khác (VD: 10A2)" class="w-full mt-2 px-3 py-2 border border-slate-300 rounded-xl text-sm"/></div>'
      +   '<div><label class="block text-xs font-bold text-slate-600 mb-1">Loại nhiệm vụ</label>'
      +   '<select id="sbt-type" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white"><option value="theory">📚 Lý thuyết cần học</option><option value="exercise">✏️ Bài tập cần làm</option></select></div>'
      + '</div>'
      + '<label class="block text-xs font-bold text-slate-600 mb-1">Tìm bài (gõ để lọc)</label>'
      + '<input id="sbt-search" placeholder="VD: Unit 7, Mệnh đề, Chương 1..." class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm mb-2"/>'
      + '<label class="block text-xs font-bold text-slate-600 mb-1">Chọn bài</label>'
      + '<select id="sbt-content" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"></select>'
      + '<div class="flex gap-2 mt-3">'
      +   '<button id="sbt-assign" class="bg-violet-700 hover:bg-violet-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow transition">📌 Giao nhiệm vụ</button>'
      +   '<button id="sbt-reload" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition">Tải lại dữ liệu</button>'
      + '</div>'
      + '<p id="sbt-msg" class="text-xs mt-2 min-h-[1rem]"></p>'
      + '<div class="border-t border-slate-200 mt-3 pt-3"><h4 class="font-bold text-slate-700 text-sm mb-2">Nhiệm vụ đã giao cho lớp này</h4><div id="sbt-list" class="space-y-1.5 text-sm text-slate-500">—</div></div>'
      + '<div class="border-t border-slate-200 mt-3 pt-3"><h4 class="font-bold text-slate-700 text-sm mb-2">📝 Đề kiểm tra của lớp này (giao qua luồng lên lịch)</h4><div id="sbt-exams" class="space-y-1.5 text-sm text-slate-500">—</div></div>';
    view.insertBefore(panel, view.firstChild);
    S.built = true;
    document.getElementById('sbt-assign').addEventListener('click', assignTask);
    document.getElementById('sbt-reload').addEventListener('click', function(){ S.tasks = null; S.tree = null; loadAll(); });
    document.getElementById('sbt-class').addEventListener('change', renderLists);
    document.getElementById('sbt-type').addEventListener('change', renderContentOptions);
    document.getElementById('sbt-search').addEventListener('input', renderContentOptions);
    loadAll();
  }

  function selectedClass(){
    var custom = (document.getElementById('sbt-class-custom').value || '').trim();
    if (custom) return { id: '', name: custom };
    var sel = document.getElementById('sbt-class');
    var v = sel.value || '';
    if (v.indexOf('pv:') === 0) {
      var c = S.classes.filter(function(x){ return x.id === v.slice(3); })[0];
      return c ? { id: c.id, name: c.name } : { id: '', name: '' };
    }
    if (v.indexOf('school:') === 0) return { id: '', name: v.slice(7) };
    return { id: '', name: '' };
  }

  function loadAll(){
    var msg = document.getElementById('sbt-msg'); if (msg) msg.textContent = 'Đang tải dữ liệu...';
    var jobs = [
      fetchJson(RAW + 'data/private/classes.json?t=' + Date.now()),
      apiJson('data/exam-schedule.json'),
      apiJson('data/class-tasks.json')
    ];
    if (!S.tree) jobs.push(fetchJson('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1'));
    Promise.all(jobs).then(function(res){
      S.classes = (res[0] && res[0].classes) || [];
      S.exams = (res[1] && res[1].exams) || [];
      S.tasks = (res[2] && Array.isArray(res[2].tasks)) ? res[2] : { tasks: [] };
      if (res[3]) S.tree = (res[3].tree || []).map(function(t){ return t.path; }).filter(function(p){ return p.indexOf('data/') === 0 && /\.html$/i.test(p); });
      renderClassOptions(); renderContentOptions(); renderLists();
      if (msg) msg.textContent = '';
    }).catch(function(){ if (msg) msg.textContent = 'Lỗi tải dữ liệu, bấm "Tải lại dữ liệu".'; });
  }

  function renderClassOptions(){
    var sel = document.getElementById('sbt-class'); if (!sel) return;
    var me = myId();
    var mine = S.classes.filter(function(c){ return !me || String(c.teacher_id) === me; });
    var list = mine.length ? mine : S.classes;
    var html = list.map(function(c){ return '<option value="pv:' + esc(c.id) + '">' + esc(c.name) + ' — lớp học thêm (GV: ' + esc(c.teacher_name || c.teacher_id) + ')</option>'; }).join('');
    var schoolNames = {};
    S.exams.forEach(function(e){ if (e.className) schoolNames[e.className] = 1; });
    Object.keys(schoolNames).forEach(function(n){ html += '<option value="school:' + esc(n) + '">' + esc(n) + ' — lớp trường</option>'; });
    sel.innerHTML = html || '<option value="">(Chưa có lớp nào)</option>';
  }

  function renderContentOptions(){
    var sel = document.getElementById('sbt-content'); if (!sel) return;
    var type = document.getElementById('sbt-type').value;
    var q = norm(document.getElementById('sbt-search').value || '');
    var paths = (S.tree || []).filter(function(p){
      if (p.indexOf('data/private/') === 0 || p.indexOf('data/bank-de/') === 0) return false;
      return type === 'theory' ? /ly_thuyet/i.test(p) : /bai_tap/i.test(p);
    }).filter(function(p){ return !q || norm(cleanTitle(p) + ' ' + p).indexOf(q) >= 0; });
    sel.innerHTML = paths.slice(0, 400).map(function(p){
      var folder = p.split('/').slice(1, -1).join('/');
      return '<option value="' + esc(p) + '" data-title="' + esc(cleanTitle(p)) + '">' + esc(cleanTitle(p)) + ' — ' + esc(folder) + '</option>';
    }).join('') || '<option value="">(Không tìm thấy bài phù hợp)</option>';
  }

  function renderLists(){
    var listEl = document.getElementById('sbt-list'), exEl = document.getElementById('sbt-exams');
    if (!listEl || !S.tasks) return;
    var sc = selectedClass();
    var mine = (S.tasks.tasks || []).filter(function(t){ return (sc.id && t.classId === sc.id) || (sc.name && norm(t.className) === norm(sc.name)); });
    listEl.innerHTML = mine.length ? mine.map(function(t){
      return '<div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">'
        + '<div class="min-w-0"><p class="font-bold text-slate-700 text-xs truncate">' + (t.type === 'theory' ? '📚 ' : '✏️ ') + esc(t.title) + '</p>'
        + '<p class="text-[10px] text-slate-400">Giao: ' + fmtDT(t.createdAt) + '</p></div>'
        + '<button class="text-rose-600 hover:text-rose-800 font-black text-sm px-2" data-sbt-del="' + esc(t.id) + '" title="Xóa nhiệm vụ">✕</button></div>';
    }).join('') : '<p class="text-xs text-slate-400 italic">Chưa giao nhiệm vụ nào cho lớp này.</p>';
    listEl.querySelectorAll('[data-sbt-del]').forEach(function(b){
      b.addEventListener('click', function(){ deleteTask(b.getAttribute('data-sbt-del')); });
    });
    var exs = S.exams.filter(function(e){ return (sc.id && e.classId === sc.id) || (sc.name && norm(e.className) === norm(sc.name)); });
    var stMap = { draft: 'Nháp — chưa giao', scheduled: 'Đã lên lịch', published: 'Đã giao — HS làm ngay', active: 'Đang mở' };
    exEl.innerHTML = exs.length ? exs.map(function(e){
      return '<div class="bg-red-50 border border-red-200 rounded-xl px-3 py-2"><p class="font-bold text-slate-700 text-xs truncate">📝 ' + esc(e.title) + '</p>'
        + '<p class="text-[10px] text-red-500">' + esc(stMap[e.status] || e.status) + (e.examTime ? ' • ' + fmtDT(e.examTime) : '') + '</p></div>';
    }).join('') : '<p class="text-xs text-slate-400 italic">Lớp này chưa có đề kiểm tra nào.</p>';
  }

  function assignTask(){
    var msg = document.getElementById('sbt-msg');
    var sc = selectedClass();
    var sel = document.getElementById('sbt-content');
    var path = sel.value;
    var title = sel.selectedOptions && sel.selectedOptions[0] ? (sel.selectedOptions[0].getAttribute('data-title') || '') : '';
    if (!sc.name) { msg.textContent = 'Hãy chọn lớp trước.'; msg.className = 'text-xs mt-2 min-h-[1rem] text-rose-600'; return; }
    if (!path) { msg.textContent = 'Hãy chọn bài trước.'; msg.className = 'text-xs mt-2 min-h-[1rem] text-rose-600'; return; }
    var type = document.getElementById('sbt-type').value;
    var task = { id: 'task_' + Date.now().toString(36), classId: sc.id, className: sc.name, teacherId: myId(), type: type, title: title || cleanTitle(path), path: path, createdAt: new Date().toISOString() };
    msg.textContent = 'Đang giao nhiệm vụ...'; msg.className = 'text-xs mt-2 min-h-[1rem] text-slate-500';
    var data = S.tasks && Array.isArray(S.tasks.tasks) ? S.tasks : { tasks: [] };
    data.tasks.unshift(task);
    gasPush('data/class-tasks.json', JSON.stringify(data, null, 1), 'Giao nhiem vu: ' + task.title + ' -> ' + sc.name)
      .then(function(){ S.tasks = data; msg.textContent = '✅ Đã giao "' + task.title + '" cho lớp ' + sc.name + '. HS mở trang chủ sẽ thấy trong mục Lớp của tôi.'; msg.className = 'text-xs mt-2 min-h-[1rem] text-emerald-600 font-bold'; renderLists(); })
      .catch(function(e){ msg.textContent = 'Lỗi khi giao nhiệm vụ: ' + e.message; msg.className = 'text-xs mt-2 min-h-[1rem] text-rose-600'; });
  }

  function deleteTask(id){
    if (!confirm('Xóa nhiệm vụ này?')) return;
    var msg = document.getElementById('sbt-msg');
    var data = S.tasks || { tasks: [] };
    data.tasks = (data.tasks || []).filter(function(t){ return t.id !== id; });
    gasPush('data/class-tasks.json', JSON.stringify(data, null, 1), 'Xoa nhiem vu ' + id)
      .then(function(){ S.tasks = data; msg.textContent = 'Đã xóa nhiệm vụ.'; msg.className = 'text-xs mt-2 min-h-[1rem] text-emerald-600'; renderLists(); })
      .catch(function(e){ msg.textContent = 'Lỗi khi xóa: ' + e.message; msg.className = 'text-xs mt-2 min-h-[1rem] text-rose-600'; });
  }

  (function(){
    var n = 0; var iv = setInterval(function(){
      n++;
      buildPanel();
      if (S.built || n > 80) clearInterval(iv);
    }, 300);
    document.addEventListener('click', function(){ setTimeout(buildPanel, 60); });
  })();
})();

console.log('SAOBAY wrap 0615 loaded');

})();
