// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_1935
// Rebuilt - fixed structure
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
            /* Mở rộng nội dung chính + thêm lề */
            main, .main-content { margin-left: 0 !important; width: 100% !important; }
            /* Thêm padding cho container chính */
            body > div.flex > div:last-child,
            body > div > main,
            #main-content {
                padding-left: 24px !important;
                padding-right: 24px !important;
                max-width: 1280px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            /* Đồng bộ lề chuẩn cho tất cả khung - chống tràn */
            #main-content > *,
            .teacher-hub-container > * {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            /* Banner header giữ full width nhưng nội dung trong có lề */
            header .max-w-7xl, header .container,
            nav .max-w-7xl, nav .container {
                max-width: 1280px !important;
                margin-left: auto !important;
                margin-right: auto !important;
                padding-left: 16px !important;
                padding-right: 16px !important;
            }
            /* Các module view không tràn */
            [id^="module-"][id$="-view"] {
                max-width: 100% !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
            }
            /* Bảng không tràn */
            table {
                max-width: 100% !important;
            }
            .table-scroll, .overflow-x-auto {
                max-width: 100% !important;
            }
            @media (max-width: 768px) {
                body > div.flex > div:last-child,
                body > div > main,
                #main-content {
                    padding-left: 12px !important;
                    padding-right: 12px !important;
                }
            }
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

// 2026-10-11: Thêm tab "Tạo Đề từ AI" và đổi tên "Đề kiểm tra theo ma trận" -> "Tạo đề thi từ Bank"
(function(){
    function initAITab(){
        // 1. Đổi tên nút bank
        var bankBtn = document.getElementById('push-mode-bank');
        if (bankBtn) {
            var span = bankBtn.querySelector('span[data-ui-label="bank"]');
            if (span) span.textContent = 'Tạo đề thi từ Bank';
        }
        
        // 2. Thêm nút AI sau nút direct
        var directBtn = document.getElementById('push-mode-direct');
        if (directBtn && !document.getElementById('push-mode-ai')) {
            var aiBtn = document.createElement('button');
            aiBtn.type = 'button';
            aiBtn.id = 'push-mode-ai';
            aiBtn.onclick = function(){ switchPushMode('ai'); };
            aiBtn.className = 'flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200';
            aiBtn.innerHTML = '<i class="fa-solid fa-robot mr-2"></i> <span>Tạo Đề từ AI</span>';
            directBtn.parentNode.insertBefore(aiBtn, directBtn.nextSibling);
        }
        
        // 3. Tạo nội dung tab AI (ẩn mặc định)
        if (!document.getElementById('push-ai-panel')) {
            var panel = document.createElement('div');
            panel.id = 'push-ai-panel';
            panel.className = 'hidden space-y-4';
            panel.innerHTML = `
                <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h3 class="font-bold text-purple-800 mb-3"><i class="fa-solid fa-robot mr-2"></i>Tạo đề từ AI (tự nhập thông tin)</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div><label class="text-xs font-bold text-slate-600">Khối</label>
                            <input id="ai-grade" type="text" placeholder="vd: 10" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        <div><label class="text-xs font-bold text-slate-600">Môn</label>
                            <input id="ai-subject" type="text" placeholder="vd: Toán" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        <div><label class="text-xs font-bold text-slate-600">Bài / Phạm vi</label>
                            <input id="ai-lessons" type="text" placeholder="vd: Bài 1-5" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        <div><label class="text-xs font-bold text-slate-600">Thời gian (phút)</label>
                            <input id="ai-time" type="number" value="45" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                    </div>
                    <div class="mb-3"><label class="text-xs font-bold text-slate-600">Nội dung kiến thức</label>
                        <textarea id="ai-knowledge" rows="3" placeholder="Mô tả kiến thức cần kiểm tra..." class="w-full border rounded-lg px-3 py-2 text-sm"></textarea></div>
                    
                    <h4 class="font-bold text-sm text-slate-700 mb-2">Ma trận đề</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div class="bg-blue-50 rounded-lg p-2"><label class="text-xs font-bold text-blue-700">Trắc nghiệm</label>
                            <div class="flex gap-1 mt-1"><input id="ai-n-mcq" type="number" value="8" class="w-1/2 border rounded px-2 py-1 text-sm text-center"><input id="ai-p-mcq" type="number" value="0.25" step="0.25" class="w-1/2 border rounded px-2 py-1 text-sm text-center"></div>
                            <p class="text-[10px] text-slate-500 mt-0.5">số câu • điểm/câu</p></div>
                        <div class="bg-amber-50 rounded-lg p-2"><label class="text-xs font-bold text-amber-700">Đúng/Sai</label>
                            <div class="flex gap-1 mt-1"><input id="ai-n-tf" type="number" value="2" class="w-1/2 border rounded px-2 py-1 text-sm text-center"><input id="ai-p-tf" type="number" value="1" class="w-1/2 border rounded px-2 py-1 text-sm text-center"></div>
                            <p class="text-[10px] text-slate-500 mt-0.5">số câu • điểm/câu</p></div>
                        <div class="bg-emerald-50 rounded-lg p-2"><label class="text-xs font-bold text-emerald-700">Trả lời ngắn</label>
                            <div class="flex gap-1 mt-1"><input id="ai-n-short" type="number" value="0" class="w-1/2 border rounded px-2 py-1 text-sm text-center"><input id="ai-p-short" type="number" value="0.5" step="0.25" class="w-1/2 border rounded px-2 py-1 text-sm text-center"></div>
                            <p class="text-[10px] text-slate-500 mt-0.5">số câu • điểm/câu</p></div>
                        <div class="bg-violet-50 rounded-lg p-2"><label class="text-xs font-bold text-violet-700">Tự luận</label>
                            <div class="flex gap-1 mt-1"><input id="ai-n-essay" type="number" value="0" class="w-full border rounded px-2 py-1 text-sm text-center"></div>
                            <p class="text-[10px] text-slate-500 mt-0.5">số câu (GV chấm tay)</p></div>
                    </div>
                    <div class="mb-3"><label class="text-xs font-bold text-slate-600">Tỉ lệ mức độ % (NB / TH / VD / VDC)</label>
                        <div class="flex gap-2"><input id="ai-lv-nb" type="number" value="40" class="w-1/4 border rounded px-2 py-1 text-sm text-center"><input id="ai-lv-th" type="number" value="30" class="w-1/4 border rounded px-2 py-1 text-sm text-center"><input id="ai-lv-vd" type="number" value="20" class="w-1/4 border rounded px-2 py-1 text-sm text-center"><input id="ai-lv-vdc" type="number" value="10" class="w-1/4 border rounded px-2 py-1 text-sm text-center"></div></div>
                    
                    <div class="flex gap-2">
                        <button onclick="aiGenPromptWeb()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-copy mr-2"></i>Prompt tạo đề đẩy Web</button>
                        <button onclick="aiGenPromptMatrix()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-table mr-2"></i>Prompt ma trận đặc tả (gửi NotebookLM)</button>
                    </div>
                    <div id="ai-prompt-output" class="hidden mt-3"><label class="text-xs font-bold text-slate-600">Prompt (bấm để copy):</label>
                        <textarea id="ai-prompt-text" rows="8" readonly class="w-full border rounded-lg px-3 py-2 text-xs font-mono mt-1"></textarea>
                        <button onclick="navigator.clipboard.writeText(document.getElementById('ai-prompt-text').value);alert('Đã copy!')" class="mt-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">📋 Copy</button></div>
                </div>`;
            
            // Chèn sau panel bank
            var bankPanel = document.querySelector('[id*="bank"]');
            var refNode = document.getElementById('push-mode-bank');
            if (refNode) {
                var container = refNode.closest('div').parentNode;
                container.appendChild(panel);
            }
        }
        
        // 4. Hook switchPushMode để xử lý tab AI
        var origSwitch = window.switchPushMode;
        if (typeof origSwitch === 'function' && !window._aiTabHooked) {
            window._aiTabHooked = true;
            window.switchPushMode = function(mode){
                // Cập nhật style nút
                ['theory','exercise','bank','direct','ai'].forEach(function(m){
                    var b = document.getElementById('push-mode-' + m);
                    if (!b) return;
                    if (m === mode) {
                        b.className = 'flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center bg-blue-700 text-white shadow';
                    } else {
                        b.className = 'flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200';
                    }
                });
                
                var aiPanel = document.getElementById('push-ai-panel');
                
                if (mode === 'ai') {
                    // Ẩn TẤT CẢ panel gốc trước
                    document.querySelectorAll('[id*="push-"][id*="panel"], [id*="push-"][id*="content"], .push-panel').forEach(function(p){
                        if (p.id !== 'push-ai-panel') p.classList.add('hidden');
                    });
                    // Gọi orig với mode không tồn tại để nó ẩn hết
                    try { origSwitch('__hide_all__'); } catch(e){}
                    // Hiện panel AI
                    if (aiPanel) {
                        aiPanel.classList.remove('hidden');
                        // Di chuyển panel AI vào vị trí đúng (sau thanh nút)
                        var btnRow = document.getElementById('push-mode-ai');
                        if (btnRow) {
                            var container = btnRow.closest('div').parentNode;
                            // Tìm vị trí chèn: sau div chứa các nút
                            var btnContainer = btnRow.closest('div.flex');
                            if (btnContainer && btnContainer.nextSibling !== aiPanel) {
                                btnContainer.parentNode.insertBefore(aiPanel, btnContainer.nextSibling);
                            }
                        }
                    }
                } else {
                    if (aiPanel) aiPanel.classList.add('hidden');
                    origSwitch(mode);
                }
            };
        }
    }
    
    // Tạo prompt đẩy web từ ma trận AI
    window.aiGenPromptWeb = function(){
        var g = document.getElementById('ai-grade').value || '[Khối]';
        var s = document.getElementById('ai-subject').value || '[Môn]';
        var l = document.getElementById('ai-lessons').value || '[Phạm vi bài]';
        var k = document.getElementById('ai-knowledge').value || '[Nội dung kiến thức]';
        var t = document.getElementById('ai-time').value || '45';
        var nmcq = document.getElementById('ai-n-mcq').value || '0';
        var pmcq = document.getElementById('ai-p-mcq').value || '0.25';
        var ntf = document.getElementById('ai-n-tf').value || '0';
        var ptf = document.getElementById('ai-p-tf').value || '1';
        var nshort = document.getElementById('ai-n-short').value || '0';
        var pshort = document.getElementById('ai-p-short').value || '0.5';
        var nessay = document.getElementById('ai-n-essay').value || '0';
        var nb = document.getElementById('ai-lv-nb').value || '40';
        var th = document.getElementById('ai-lv-th').value || '30';
        var vd = document.getElementById('ai-lv-vd').value || '20';
        var vdc = document.getElementById('ai-lv-vdc').value || '10';
        
        var prompt = `Tạo đề kiểm tra ${s} khối ${g}, phạm vi ${l}, thời gian ${t} phút.

Nội dung kiến thức:
${k}

Ma trận đề:
- Trắc nghiệm: ${nmcq} câu x ${pmcq} điểm
- Đúng/Sai: ${ntf} câu x ${ptf} điểm
- Trả lời ngắn: ${nshort} câu x ${pshort} điểm
- Tự luận: ${nessay} câu (GV chấm tay)
- Tỉ lệ mức độ: NB ${nb}% / TH ${th}% / VD ${vd}% / VDC ${vdc}%

Yêu cầu: Tạo đề dưới dạng HTML theo cấu trúc SAOBAY exam10 (mỗi câu có type, q, options, answer, explain).`;
        
        document.getElementById('ai-prompt-text').value = prompt;
        document.getElementById('ai-prompt-output').classList.remove('hidden');
    };
    
    // Tạo prompt ma trận đặc tả gửi NotebookLM
    window.aiGenPromptMatrix = function(){
        var g = document.getElementById('ai-grade').value || '[Khối]';
        var s = document.getElementById('ai-subject').value || '[Môn]';
        var l = document.getElementById('ai-lessons').value || '[Phạm vi bài]';
        var k = document.getElementById('ai-knowledge').value || '[Nội dung kiến thức]';
        var nmcq = document.getElementById('ai-n-mcq').value || '0';
        var ntf = document.getElementById('ai-n-tf').value || '0';
        var nshort = document.getElementById('ai-n-short').value || '0';
        var nessay = document.getElementById('ai-n-essay').value || '0';
        var nb = document.getElementById('ai-lv-nb').value || '40';
        var th = document.getElementById('ai-lv-th').value || '30';
        var vd = document.getElementById('ai-lv-vd').value || '20';
        var vdc = document.getElementById('ai-lv-vdc').value || '10';
        
        var prompt = `Lập ma trận đặc tả đề kiểm tra ${s} khối ${g}.

Phạm vi: ${l}
Nội dung kiến thức:
${k}

Cấu trúc đề:
| Dạng câu | Số câu | Mức độ NB | Mức độ TH | Mức độ VD | Mức độ VDC |
|----------|--------|-----------|-----------|-----------|------------|
| Trắc nghiệm | ${nmcq} | | | | |
| Đúng/Sai | ${ntf} | | | | |
| Trả lời ngắn | ${nshort} | | | | |
| Tự luận | ${nessay} | | | | |

Tỉ lệ mức độ chung: NB ${nb}% / TH ${th}% / VD ${vd}% / VDC ${vdc}%

Hãy điền chi tiết từng ô trong bảng (chủ đề kiến thức cụ thể cho từng dạng câu và mức độ).`;
        
        document.getElementById('ai-prompt-text').value = prompt;
        document.getElementById('ai-prompt-output').classList.remove('hidden');
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(initAITab, 2500); });
    } else {
        setTimeout(initAITab, 2500);
    }
})();

})();


(function(){
    function hideMonitorTab(){
        try {
            var u = JSON.parse(localStorage.getItem('saobay_user') || 'null');
            var tab = document.getElementById('mod-tab-monitor');
            if (!tab) return;
            if (!u || u.role !== 'admin') {
                tab.style.display = 'none';
            } else {
                tab.style.display = '';
            }
        } catch(e){}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(hideMonitorTab, 1500); });
    } else {
        setTimeout(hideMonitorTab, 1500);
    }
    setInterval(hideMonitorTab, 5000);
})();


(function(){
    function addRefreshBtn(){
        var title = document.querySelector('#module-monitor-view h3');
        if (!title || document.getElementById('mon-refresh-btn')) return;
        
        var btn = document.createElement('button');
        btn.id = 'mon-refresh-btn';
        btn.className = 'ml-3 text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg font-bold';
        btn.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i>Tải lại';
        btn.onclick = function(){
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Đang tải...';
            btn.disabled = true;
            try {
                if (typeof renderMonitor === 'function') {
                    renderMonitor();
                }
            } catch(e){}
            setTimeout(function(){
                btn.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i>Tải lại';
                btn.disabled = false;
            }, 2000);
        };
        title.appendChild(btn);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(addRefreshBtn, 2000); });
    } else {
        setTimeout(addRefreshBtn, 2000);
    }
    setInterval(addRefreshBtn, 10000);
})();


