// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261012_0002
// Tab 2: THAY THE ham renderLessonManagementList goc bang danh sach DE THI.
// -> Mot nguon render duy nhat, khong con dua ghi de voi ds 3053 bai.
// On dinh: khong interval vo han (poll toi da 20s roi dung), fetch cay Git 1 lan/phien (cache).
(function(){
'use strict';
var examsCache = null;
var examsPromise = null;

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

function fetchExamFiles(){
  if(examsCache) return Promise.resolve(examsCache);
  if(examsPromise) return examsPromise;
  var headers={'Accept':'application/vnd.github+json'};
  var tk=localStorage.getItem('saobay_github_token')||localStorage.getItem('github_token');
  if(tk) headers['Authorization']='Bearer '+tk;
  examsPromise=fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1',{headers:headers})
    .then(function(r){ if(!r.ok) throw new Error('GitHub API: '+r.status); return r.json(); })
    .then(function(data){
      var f=(data.tree||[]).filter(function(i){
        if(i.type!=='blob'||!i.path.endsWith('.html')) return false;
        if(i.path.indexOf('data/')!==0) return false;
        var n=i.path.toLowerCase();
        if(n.indexOf('data/bank')===0||n.indexOf('data/scores')===0) return false;
        if(n.indexOf('_bai_tap_')>=0||n.indexOf('_ly_thuyet_')>=0) return false;
        if(n.indexOf('bai_tap_none')>=0||n.indexOf('ly_thuyet_none')>=0) return false;
        return true;
      });
      examsCache=f; examsPromise=null;
      return f;
    })
    .catch(function(e){ examsPromise=null; throw e; });
  return examsPromise;
}

function renderExams(){
  var c=document.getElementById('manage-lessons-table-container');
  if(!c) return;
  if(!examsCache) c.innerHTML='<div id="saobay-exams-box"><p style="color:#666">⏳ Đang tải danh sách đề thi...</p></div>';
  fetchExamFiles().then(function(f){
    var cc=document.getElementById('manage-lessons-table-container');
    if(!cc) return;
    if(!f.length){
      cc.innerHTML='<div id="saobay-exams-box" style="padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px">'
        +'<p style="font-weight:bold;margin:0 0 6px">📝 Đề thi đã tải lên</p>'
        +'<p style="color:#64748b;margin:0 0 8px">Chưa có đề thi nào. Đề tải lên qua Word / AI / tạo từ Bank sẽ hiện ở đây.</p>'
        +'<button id="saobay-exams-reload" style="padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🔄 Tải lại</button></div>';
    } else {
      var h='<div id="saobay-exams-box" style="padding:6px 2px"><p style="font-weight:bold;margin:0 0 8px">📝 Đề thi đã tải lên: '+f.length+' đề '
        +'<button id="saobay-exams-reload" style="margin-left:8px;padding:4px 10px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">🔄 Tải lại</button></p>'
        +'<ul style="list-style:none;padding:0;margin:0">';
      f.forEach(function(x){
        var name=x.path.split('/').pop().replace(/\.html$/,'');
        h+='<li style="padding:8px;border-bottom:1px solid #eee">📝 <b>'+name+'</b><br>'
          +'<small style="color:#888">'+x.path+'</small> '
          +'<a href="https://saobay.github.io/'+x.path+'" target="_blank" style="color:#2563eb">Mở</a></li>';
      });
      cc.innerHTML=h+'</ul></div>';
    }
    var rb=document.getElementById('saobay-exams-reload');
    if(rb) rb.onclick=function(){ examsCache=null; renderExams(); };
  }).catch(function(e){
    var cc=document.getElementById('manage-lessons-table-container');
    if(cc) cc.innerHTML='<div id="saobay-exams-box"><p style="color:red">Không tải được danh sách đề ('+e.message+'). Kiểm tra mạng rồi bấm lại tab 2.</p></div>';
  });
}

// Thay the ham goc: cho toi khi hub-manage.js dinh nghia xong (poll gioi han 80 x 250ms = 20s)
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

// Du phong: bam tab 2 ma khung chua co ds de thi thi render (chi 1 lan kiem tra sau 600ms)
document.addEventListener('click',function(e){
  var t=e.target, found=false;
  while(t && t!==document){ if(t.id==='mod-tab-manage'){ found=true; break; } t=t.parentElement; }
  if(!found) return;
  setTimeout(function(){
    var c=document.getElementById('manage-lessons-table-container');
    if(c && !c.querySelector('#saobay-exams-box')) renderExams();
  },600);
}, true);

console.log('SAOBAY wrap 0002 loaded');
})();
