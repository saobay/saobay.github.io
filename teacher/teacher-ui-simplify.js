// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_1832
// SAOBAY Teacher Hub UI Simplify - 2026-10-11
// Ẩn cây thư mục bên trái, chọn thư mục qua popup tại "Vị trí lưu trữ"
(function(){
    'use strict';
    
    function init(){
        // 1. Ẩn sidebar bằng CSS trực tiếp
        var style = document.createElement('style');
        style.id = 'saobay-hide-sidebar';
        style.textContent = `
            /* Ẩn sidebar cây thư mục */
            aside { display: none !important; }
            /* Ẩn nút hamburger */
            button[onclick*="toggleSidebar"] { display: none !important; }
            /* Mở rộng nội dung chính */
            main, .main-content { margin-left: 0 !important; width: 100% !important; }
        `;
        if (!document.getElementById('saobay-hide-sidebar')) {
            document.head.appendChild(style);
        }
        
        // 2. Tìm và ẩn sidebar theo nhiều cách
        setTimeout(function(){
            // Cách 1: tìm phần tử chứa "THƯ MỤC CHỌN Ở CÂY"
            var els = document.querySelectorAll('*');
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (el.textContent && el.textContent.includes('THƯ MỤC CHỌN Ở CÂY') && el.children.length > 0) {
                    // Tìm container cha là sidebar
                    var p = el.parentElement;
                    var depth = 0;
                    while (p && depth < 5) {
                        if (p.tagName === 'ASIDE' || (p.className && p.className.includes('w-'))) {
                            p.style.display = 'none';
                            break;
                        }
                        p = p.parentElement;
                        depth++;
                    }
                    break;
                }
            }
        }, 500);
        
        // 3. Biến "Vị trí lưu trữ" thành nút bấm mở popup chọn thư mục
        var storageBar = document.getElementById('main-working-folder-display');
        if (storageBar && !document.getElementById('folder-select-modal')) {
            var container = storageBar.closest('div.flex.items-center.space-x-3');
            if (container) {
                container.style.cursor = 'pointer';
                container.title = 'Bấm để chọn thư mục lưu';
                container.onclick = openFolderModal;
            }
            createModal();
        }
    }
    
    function createModal(){
        var modal = document.createElement('div');
        modal.id = 'folder-select-modal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = '<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">'
            + '<div class="flex items-center justify-between p-4 border-b">'
            + '<h3 class="font-bold text-slate-800"><i class="fa-solid fa-folder-tree mr-2 text-blue-600"></i>Chọn thư mục lưu bài</h3>'
            + '<button onclick="document.getElementById(\'folder-select-modal\').classList.add(\'hidden\')" class="text-slate-400 hover:text-slate-600 text-xl">&times;</button>'
            + '</div>'
            + '<div class="p-4 overflow-y-auto flex-1">'
            + '<input type="text" id="folder-search" placeholder="🔍 Tìm thư mục..." class="w-full border rounded-lg px-3 py-2 text-sm mb-3">'
            + '<div id="folder-modal-tree"></div>'
            + '</div>'
            + '</div>';
        document.body.appendChild(modal);
        
        // Đóng khi bấm ngoài
        modal.addEventListener('click', function(e){
            if (e.target === modal) modal.classList.add('hidden');
        });
        
        // Tìm kiếm
        document.getElementById('folder-search').addEventListener('input', function(e){
            var q = e.target.value.toLowerCase();
            var items = document.querySelectorAll('#folder-modal-tree .folder-item');
            items.forEach(function(it){
                it.style.display = it.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    }
    
    function openFolderModal(){
        var modal = document.getElementById('folder-select-modal');
        if (!modal) return;
        
        // Copy cây thư mục hiện tại vào modal
        var tree = document.getElementById('folder-tree');
        var modalTree = document.getElementById('folder-modal-tree');
        if (tree && modalTree) {
            modalTree.innerHTML = tree.innerHTML;
            // Thêm class để dễ tìm kiếm
            modalTree.querySelectorAll('div').forEach(function(d){
                if (d.onclick || d.textContent.includes('THCS') || d.textContent.includes('THPT')) {
                    d.classList.add('folder-item');
                }
            });
            // Khi chọn xong thì đóng modal
            modalTree.addEventListener('click', function(e){
                setTimeout(function(){
                    var display = document.getElementById('main-working-folder-display');
                    if (display && !display.textContent.includes('Chưa chọn')) {
                        modal.classList.add('hidden');
                    }
                }, 300);
            }, { once: true });
        }
        
        modal.classList.remove('hidden');
    }
    
    // Chạy khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 2000); });
    } else {
        setTimeout(init, 2000);
    }
    
    // Expose để gọi lại nếu cần
    window.saobaySimplifyUI = init;
})();
