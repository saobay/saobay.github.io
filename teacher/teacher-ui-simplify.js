// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261012_0015
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

console.log('SAOBAY wrap 0015 loaded');
})();
