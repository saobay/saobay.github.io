// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2332
// Fix tab2: bat click truc tiep + ep hien
(function(){
'use strict';

function addClearBtn(){
  if(document.getElementById('btn-clear-cache'))return;
  var b=document.createElement('button');
  b.id='btn-clear-cache';b.textContent='🧹 Xóa cache';
  b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9999;padding:8px 12px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;';
  b.onclick=function(){
    if(!confirm('Xoa cache? (giu dang nhap)'))return;
    var bk={};
    ['saobay_user','github_token','saobay_admin_token','saobay_github_token'].forEach(function(k){var v=localStorage.getItem(k);if(v)bk[k]=v;});
    if('caches'in window)caches.keys().then(function(n){n.forEach(function(x){caches.delete(x);});});
    localStorage.clear();
    Object.keys(bk).forEach(function(k){localStorage.setItem(k,bk[k]);});
    location.href=location.href.split('?')[0]+'?_cb='+Date.now();
  };
  if(document.body)document.body.appendChild(b);
}
setInterval(addClearBtn,2000);

function buildUI(){
  var v=document.getElementById('module-manage-view');
  if(!v||document.getElementById('exams-ui'))return;
  v.innerHTML='';
  var d=document.createElement('div');
  d.id='exams-ui';
  d.style.cssText='padding:16px';
  d.innerHTML='<h2 style="font-size:18px;font-weight:bold;margin-bottom:12px">📝 Đề thi đã tải lên</h2>'
    +'<button id="btn-load-exams" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">🔄 Tải danh sách đề</button>'
    +'<div id="exams-list" style="margin-top:12px"><p style="color:#666">Bấm nút để tải danh sách đề thi (Word / AI / Bank).</p></div>';
  v.appendChild(d);
  document.getElementById('btn-load-exams').onclick=loadExams;
}
async function loadExams(){
  var l=document.getElementById('exams-list');
  if(!l)return;
  l.innerHTML='<p>⏳ Đang tải...</p>';
  try{
    var headers={'Accept':'application/vnd.github+json'};
    var tk=localStorage.getItem('saobay_github_token')||localStorage.getItem('github_token');
    if(tk)headers['Authorization']='Bearer '+tk;
    var r=await fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1',{headers:headers});
    if(!r.ok){l.innerHTML='<p style="color:red">Lỗi tải: '+r.status+'</p>';return;}
    var data=await r.json();
    var f=data.tree.filter(function(i){
      if(i.type!=='blob'||!i.path.endsWith('.html'))return false;
      if(i.path.indexOf('data/')!==0)return false;
      var n=i.path.toLowerCase();
      if(n.indexOf('data/bank')===0||n.indexOf('data/scores')===0)return false;
      if(n.indexOf('_bai_tap_')>=0||n.indexOf('_ly_thuyet_')>=0)return false;
      if(n.indexOf('bai_tap_none')>=0||n.indexOf('ly_thuyet_none')>=0)return false;
      return true;
    });
    if(!f.length){l.innerHTML='<p>Chưa có đề thi nào.</p>';return;}
    var h='<p><b>'+f.length+'</b> đề:</p><ul style="list-style:none;padding:0">';
    f.forEach(function(x){
      var name=x.path.split('/').pop().replace('.html','');
      h+='<li style="padding:8px;border-bottom:1px solid #eee">📝 <b>'+name+'</b><br><small style="color:#888">'+x.path+'</small> <a href="https://saobay.github.io/'+x.path+'" target="_blank" style="color:#2563eb">Mở</a></li>';
    });
    l.innerHTML=h+'</ul>';
  }catch(e){l.innerHTML='<p style="color:red">Lỗi: '+e.message+'</p>';}
}

function forceShow(){
  var v=document.getElementById('module-manage-view');
  if(!v)return;
  buildUI();
  v.classList.remove('hidden');
  v.style.setProperty('display','block','important');
}
// Bat click vao tab manage (ca nut va phan tu con)
document.addEventListener('click',function(e){
  var t=e.target;
  var tab=null;
  while(t&&t!==document){if(t.id==='mod-tab-manage'){tab=t;break;}t=t.parentElement;}
  if(tab){
    window._manageActive=true;
    setTimeout(forceShow,80);
    setTimeout(forceShow,300);
    setTimeout(forceShow,800);
  } else {
    // Bam tab khac thi danh dau khong active nua (neu bam vao cac mod-tab khac)
    var u=e.target;
    while(u&&u!==document){if(u.id&&u.id.indexOf('mod-tab-')===0){window._manageActive=false;break;}u=u.parentElement;}
  }
},true);
// Giu ep hien khi dang active (chong code goc an lai)
setInterval(function(){
  if(window._manageActive){
    var v=document.getElementById('module-manage-view');
    if(v&&(v.classList.contains('hidden')||!document.getElementById('exams-ui'))){
      forceShow();
    }
  }
},600);
console.log('SAOBAY fix 2332 loaded');
})();
