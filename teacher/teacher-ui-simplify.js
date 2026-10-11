// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2235
// Minimal - chỉ nút xóa cache, không can thiệp gì khác
(function(){
'use strict';
function addClearBtn(){
  try{
    if(document.getElementById('btn-clear-cache'))return;
    var b=document.createElement('button');
    b.id='btn-clear-cache';b.textContent='🧹 Xóa cache';
    b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9999;padding:8px 12px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;';
    b.onclick=function(){
      if(!confirm('Xóa cache? (giữ đăng nhập)'))return;
      var bk={};
      ['saobay_user','github_token','saobay_admin_token','saobay_github_token'].forEach(function(k){var v=localStorage.getItem(k);if(v)bk[k]=v;});
      if('caches'in window)caches.keys().then(function(n){n.forEach(function(x){caches.delete(x);});});
      localStorage.clear();
      Object.keys(bk).forEach(function(k){localStorage.setItem(k,bk[k]);});
      location.href=location.href.split('?')[0]+'?_cb='+Date.now();
    };
    document.body.appendChild(b);
  }catch(e){}
}
setInterval(addClearBtn,3000);
console.log('SAOBAY minimal JS 2235');
})();
