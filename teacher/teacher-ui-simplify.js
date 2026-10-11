// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2245
// Tab 2 mới hoàn toàn - không dùng code cũ
(function(){
'use strict';

// Nút xóa cache
function addClearBtn(){
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
}
setInterval(addClearBtn,3000);

// Tạo giao diện mới cho tab 2
function createNewTab2(){
  var view=document.getElementById('module-manage-view');
  if(!view||document.getElementById('new-tab2-ui'))return;
  
  // Xóa hết nội dung cũ
  view.innerHTML='';
  
  // Tạo giao diện mới
  var div=document.createElement('div');
  div.id='new-tab2-ui';
  div.style.cssText='padding:16px;';
  div.innerHTML=
    '<h2 style="font-size:18px;font-weight:bold;margin-bottom:12px">📚 Bài đã đăng của bạn</h2>'+
    '<button id="btn-load-lessons" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-bottom:12px">🔄 Tải danh sách</button>'+
    '<div id="lessons-list" style="margin-top:12px"><p style="color:#666">Bấm nút trên để tải danh sách bài.</p></div>';
  view.appendChild(div);
  
  document.getElementById('btn-load-lessons').onclick=loadLessons;
}

async function loadLessons(){
  var list=document.getElementById('lessons-list');
  if(!list)return;
  list.innerHTML='<p>⏳ Đang tải...</p>';
  
  try{
    var url='https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1';
    var headers={'Accept':'application/vnd.github+json'};
    var tk=localStorage.getItem('saobay_github_token')||localStorage.getItem('github_token');
    if(tk)headers['Authorization']='Bearer '+tk;
    
    var res=await fetch(url,{headers:headers});
    if(!res.ok){
      list.innerHTML='<p style="color:red">❌ Lỗi tải: '+res.status+'</p>';
      return;
    }
    var data=await res.json();
    var files=data.tree.filter(function(item){
      return item.type==='blob'&&item.path.endsWith('.html')&&
             item.path.startsWith('data/')&&
             !item.path.startsWith('data/bank/')&&
             !item.path.startsWith('data/scores/');
    });
    
    if(files.length===0){
      list.innerHTML='<p>Chưa có bài nào.</p>';
      return;
    }
    
    var html='<p>Tìm thấy <b>'+files.length+'</b> bài:</p><ul style="list-style:none;padding:0">';
    files.slice(0,50).forEach(function(f){
      var name=f.path.split('/').pop().replace('.html','');
      html+='<li style="padding:8px;border-bottom:1px solid #eee">📄 '+name+
            '<br><small style="color:#888">'+f.path+'</small></li>';
    });
    if(files.length>50)html+='<li>... và '+(files.length-50)+' bài nữa</li>';
    html+='</ul>';
    list.innerHTML=html;
  }catch(e){
    list.innerHTML='<p style="color:red">❌ Lỗi: '+e.message+'</p>';
  }
}

// Chạy khi tab 2 được hiện
setInterval(function(){
  var view=document.getElementById('module-manage-view');
  if(view&&!view.classList.contains('hidden')){
    createNewTab2();
  }
},1000);

console.log('SAOBAY new tab2 2245');
})();
