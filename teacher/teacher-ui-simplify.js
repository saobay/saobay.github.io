// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2230
// Clean rebuild - 3 fixes only
(function(){
'use strict';

// CSS ẩn ngay khi JS chạy (chống nháy)
var css=document.createElement('style');
css.textContent='#folder-tree{display:none!important}.sidebar-folder-tree{display:none!important}';
if(document.head)document.head.appendChild(css);

// Ẩn sidebar cây thư mục (chạy liên tục)
function hideSidebar(){
  try{
    var t=document.getElementById('folder-tree');
    if(t)t.style.display='none';
    // Ẩn container trái chứa cây
    var left=document.querySelector('[class*="sidebar"]');
    if(left&&left.textContent.indexOf('Cấu Trúc Thư Mục')>=0)left.style.display='none';
  }catch(e){}
}
setInterval(hideSidebar,1000);

// Đổi tên modules
function renameModules(){
  try{
    document.querySelectorAll('*').forEach(function(el){
      if(el.children.length>0)return;
      var t=(el.textContent||'').trim();
      if(t==='2. QUẢN LÝ & SỬA BÀI')el.textContent='2. QUẢN LÝ HỌC LIỆU CỦA BẠN';
      else if(t==='4. THỐNG KÊ & HỌC LIỆU')el.textContent='4. THỐNG KÊ';
      else if(t==='5. LỚP HỌC THÊM')el.textContent='5. QUẢN LÝ LỚP HỌC CỦA TÔI';
      else if(t==='Đề kiểm tra theo ma trận')el.textContent='Tạo đề thi từ Bank';
    });
  }catch(e){}
}
setInterval(renameModules,2000);

// Thêm tab AI
function addAITab(){
  try{
    if(document.getElementById('push-mode-ai'))return;
    var bank=document.getElementById('push-mode-bank');
    if(!bank||!bank.parentElement)return;
    var b=document.createElement('button');
    b.id='push-mode-ai';b.type='button';
    b.className=bank.className;
    b.innerHTML='🤖 Tạo Đề từ AI';
    b.onclick=function(){if(typeof switchPushMode==='function')switchPushMode('ai');};
    bank.parentElement.appendChild(b);
  }catch(e){}
}
setInterval(addAITab,2000);

// Nút xóa cache
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

// Tab 2: đảm bảo hiện khi bấm
if(typeof window.switchTeacherModule==='function'&&!window._ct2){
  window._ct2=true;
  var o=window.switchTeacherModule;
  window.switchTeacherModule=function(m){
    o(m);
    if(m==='manage')setTimeout(function(){
      var v=document.getElementById('module-manage-view');
      if(v){v.classList.remove('hidden');if(typeof renderLessonManagementList==='function')try{renderLessonManagementList();}catch(e){}}
    },300);
  };
}

console.log('SAOBAY clean JS 2230 loaded');
})();
