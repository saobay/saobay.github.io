// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2358
// Tab 2: hien danh sach DE THI dung cho (trong module-manage-view).
// Nguyen tac on dinh: KHONG popup, KHONG interval vo han, fetch cay Git 1 lan/phien (cache), chi tai lai khi bam nut.
(function(){
'use strict';
var examsCache = null;      // ket qua da loc (array) hoac null = chua tai
var examsPromise = null;    // promise dang tai (chong goi trung)

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
// Thu toi da 15 lan x 1s roi DUNG HAN (khong interval vo han)
(function(){
  var n=0, t=setInterval(function(){
    n++;
    if(addClearBtn() || n>=15) clearInterval(t);
  },1000);
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
        if(n.indexOf('_ly_thuyet')>=0||n.indexOf('ly_thuyet_')>=0) return false;
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
  c.setAttribute('data-saobay-exams','1');
  if(!examsCache){
    c.innerHTML='<div id="saobay-exams-box"><p style="color:#666">⏳ Đang tải danh sách đề thi...</p></div>';
  }
  fetchExamFiles().then(function(f){
    var cc=document.getElementById('manage-lessons-table-container');
    if(!cc) return;
    cc.setAttribute('data-saobay-exams','1');
    if(!f.length){
      cc.innerHTML='<div id="saobay-exams-box" style="padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px">'
        +'<p style="font-weight:bold;margin:0 0 6px">📝 Đề thi đã tải lên</p>'
        +'<p style="color:#64748b;margin:0">Chưa có đề thi nào. Đề tải lên qua Word / AI / tạo từ Bank sẽ hiện ở đây.</p></div>';
      return;
    }
    var h='<div id="saobay-exams-box" style="padding:6px 2px"><p style="font-weight:bold;margin:0 0 8px">📝 Đề thi đã tải lên: '+f.length+' đề</p>'
      +'<ul style="list-style:none;padding:0;margin:0">';
    f.forEach(function(x){
      var name=x.path.split('/').pop().replace(/\.html$/,'');
      h+='<li style="padding:8px;border-bottom:1px solid #eee">📝 <b>'+name+'</b><br>'
        +'<small style="color:#888">'+x.path+'</small> '
        +'<a href="https://saobay.github.io/'+x.path+'" target="_blank" style="color:#2563eb">Mở</a></li>';
    });
    cc.innerHTML=h+'</ul></div>';
  }).catch(function(e){
    var cc=document.getElementById('manage-lessons-table-container');
    if(cc) cc.innerHTML='<div id="saobay-exams-box"><p style="color:red">Không tải được danh sách đề ('+e.message+'). Kiểm tra mạng rồi bấm lại tab 2.</p></div>';
  });
}

// Khi bam tab 2: doi code goc chay xong roi chen danh sach de vao dung container cua tab.
// Code goc (renderLessonManagementList) co the ghi de bang ds 3058 bai sau khi fetch xong,
// nen kiem tra lai 3 lan co gioi han (1s, 2.5s, 5s) — het 3 lan la dung, khong lap vo han.
document.addEventListener('click',function(e){
  var t=e.target, found=false;
  while(t && t!==document){ if(t.id==='mod-tab-manage'){ found=true; break; } t=t.parentElement; }
  if(!found) return;
  setTimeout(renderExams, 250);
  [1000, 2500, 5000].forEach(function(ms){
    setTimeout(function(){
      var c=document.getElementById('manage-lessons-table-container');
      if(c && !c.querySelector('#saobay-exams-box')) renderExams();
    }, ms);
  });
}, true);

console.log('SAOBAY inplace 2358 loaded');
})();
