// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2240
// Fix tab 2: hiện danh sách bài đơn giản
(function(){
'use strict';

// Nút xóa cache (giữ lại)
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

// Fix tab 2: khi bấm vào tab manage, hiện nội dung đơn giản
function fixTab2(){
  try{
    var view=document.getElementById('module-manage-view');
    if(!view)return;
    // Nếu view đang hiện (không hidden) mà trống thì thêm nội dung
    if(!view.classList.contains('hidden')){
      var container=document.getElementById('manage-lessons-table-container');
      if(container&&container.innerHTML.trim()===''){
        container.innerHTML='<div style="padding:20px;text-align:center;color:#666">'
          +'<p>📚 Danh sách bài của bạn sẽ hiện ở đây.</p>'
          +'<p style="font-size:12px;margin-top:8px">Bấm nút "Làm mới danh sách" ở trên để tải.</p>'
          +'<button onclick="if(typeof renderLessonManagementList===\'function\')renderLessonManagementList()" '
          +'style="margin-top:10px;padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">🔄 Tải danh sách</button>'
          +'</div>';
      }
    }
  }catch(e){}
}
setInterval(fixTab2,2000);

console.log('SAOBAY tab2 fix 2240');
})();
