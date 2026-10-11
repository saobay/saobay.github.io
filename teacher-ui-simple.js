// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2252
(function(){
'use strict';

// Xóa view cũ, tạo mới đơn giản
setInterval(function(){
  var old=document.getElementById('module-manage-view');
  if(old&&!document.getElementById('simple-manage')){
    old.style.display='none';
    var d=document.createElement('div');
    d.id='simple-manage';
    d.style.cssText='display:none;padding:16px;background:#fff;border-radius:8px;margin-top:12px';
    d.innerHTML='<h3>📚 Bài đã đăng</h3><button id="btn-load" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">Tải danh sách</button><div id="list" style="margin-top:12px"></div>';
    old.parentElement.appendChild(d);
    document.getElementById('btn-load').onclick=function(){
      var l=document.getElementById('list');
      l.innerHTML='Đang tải...';
      fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1')
        .then(function(r){return r.json();})
        .then(function(data){
          var f=data.tree.filter(function(i){return i.type==='blob'&&i.path.endsWith('.html')&&i.path.indexOf('data/')===0;});
          var h='<p>'+f.length+' bài:</p><ul>';
          f.slice(0,30).forEach(function(x){h+='<li>'+x.path+'</li>';});
          h+='</ul>';
          l.innerHTML=h;
        })
        .catch(function(e){l.innerHTML='Lỗi: '+e.message;});
    };
  }
  // Hiện panel mới khi tab 2 active
  var btn=document.querySelector('[onclick*="manage"]')||Array.from(document.querySelectorAll('button')).find(function(b){return b.textContent.indexOf('QUẢN LÝ')>=0;});
  var panel=document.getElementById('simple-manage');
  if(btn&&panel){
    // Kiểm tra tab 2 có đang active không (có class active hoặc border xanh)
    var isActive=btn.classList.contains('active')||btn.style.borderColor==='#2563eb'||btn.getAttribute('aria-selected')==='true';
    // Đơn giản: nếu btn có viền xanh thì hiện
    var computed=window.getComputedStyle(btn);
    if(computed.borderColor==='rgb(37, 99, 235)'||btn.className.indexOf('blue')>=0){
      panel.style.display='block';
    }
  }
},1500);
})();
