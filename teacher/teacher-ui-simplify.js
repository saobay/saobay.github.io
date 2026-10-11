// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2335
// Chi nut xoa cache - KHONG dung vao tab2, de code goc tu chay
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
console.log('SAOBAY minimal 2335 - tab2 goc');
})();
