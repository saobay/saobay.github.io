// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2255
(function(){
setInterval(function(){
  var old=document.getElementById('module-manage-view');
  if(old&&!document.getElementById('test-msg')){
    var d=document.createElement('div');
    d.id='test-msg';
    d.style.cssText='padding:20px;background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;margin:12px;font-size:16px';
    d.textContent='✅ CODE CHẠY ĐƯỢC! Mục 2 đang hoạt động. (Chưa có bài nào)';
    old.parentElement.appendChild(d);
  }
},1000);
console.log('TEST 2255 loaded');
})();
