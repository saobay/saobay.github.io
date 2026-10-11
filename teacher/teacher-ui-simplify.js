// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2340
// Tab2: panel noi co dinh hien de thi (khong phu thuoc view cu)
(function(){
'use strict';

function addClearBtn(){
  if(document.getElementById('btn-clear-cache'))return;
  var b=document.createElement('button');
  b.id='btn-clear-cache';b.textContent='🧹 Xóa cache';
  b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9998;padding:8px 12px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;';
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

// Tao panel noi
function getPanel(){
  var p=document.getElementById('exams-overlay');
  if(p)return p;
  p=document.createElement('div');
  p.id='exams-overlay';
  p.style.cssText='display:none;position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(860px,94vw);max-height:82vh;overflow-y:auto;background:#fff;z-index:9990;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.3);padding:18px;border:1px solid #e5e7eb';
  p.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
    +'<h2 style="font-size:17px;font-weight:bold;margin:0">📝 Đề thi đã tải lên</h2>'
    +'<button id="exams-close" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer">✕ Đóng</button></div>'
    +'<button id="exams-load" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">🔄 Tải danh sách đề</button>'
    +'<div id="exams-list" style="margin-top:12px"><p style="color:#666">Danh sách đề thi tải lên qua Word / AI / Bank.</p></div>';
  document.body.appendChild(p);
  document.getElementById('exams-close').onclick=function(){p.style.display='none';};
  document.getElementById('exams-load').onclick=loadExams;
  return p;
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
    if(!f.length){l.innerHTML='<p>Chưa có đề thi nào (đề Word/AI/Bank sẽ hiện ở đây).</p>';return;}
    var h='<p><b>'+f.length+'</b> đề:</p><ul style="list-style:none;padding:0">';
    f.forEach(function(x){
      var name=x.path.split('/').pop().replace('.html','');
      h+='<li style="padding:8px;border-bottom:1px solid #eee">📝 <b>'+name+'</b><br><small style="color:#888">'+x.path+'</small> <a href="https://saobay.github.io/'+x.path+'" target="_blank" style="color:#2563eb">Mở</a></li>';
    });
    l.innerHTML=h+'</ul>';
  }catch(e){l.innerHTML='<p style="color:red">Lỗi: '+e.message+'</p>';}
}
// Bam tab manage thi mo panel
document.addEventListener('click',function(e){
  var t=e.target,found=false;
  while(t&&t!==document){if(t.id==='mod-tab-manage'){found=true;break;}t=t.parentElement;}
  if(found){
    var p=getPanel();
    setTimeout(function(){p.style.display='block';loadExams();},150);
  }
},true);
console.log('SAOBAY overlay 2340 loaded');
})();
