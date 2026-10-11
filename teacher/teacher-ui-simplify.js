// SAOBAY_TEACHER_UI_SIMPLIFY_VERSION:20261011_2151
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
        var k = '';
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
        
        // Tự copy luôn
        try {
            navigator.clipboard.writeText(prompt).then(function(){
                alert('Đã copy prompt!');
            });
        } catch(e){
            // Fallback: hiện textarea nếu không copy được
            document.getElementById('ai-prompt-text').value = prompt;
            document.getElementById('ai-prompt-output').classList.remove('hidden');
        }
    };
    
    // Tạo prompt ma trận đặc tả gửi NotebookLM
    window.aiGenPromptMatrix = function(){
        var g = document.getElementById('ai-grade').value || '[Khối]';
        var s = document.getElementById('ai-subject').value || '[Môn]';
        var l = document.getElementById('ai-lessons').value || '[Phạm vi bài]';
        var k = '';
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
        
        try {
            navigator.clipboard.writeText(prompt).then(function(){
                alert('Đã copy prompt ma trận!');
            });
        } catch(e){
            document.getElementById('ai-prompt-text').value = prompt;
            document.getElementById('ai-prompt-output').classList.remove('hidden');
        }
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

// 2026-10-11: Gộp tab Thống kê vào Quản lý -> "Quản lý học liệu của bạn"
(function(){
    function mergeTabs(){
        try {
            // 1. Ẩn tab Thống kê
            var statsTab = document.getElementById('mod-tab-stats');
            if (statsTab) statsTab.style.display = 'none';
            
            // 2. Đổi tên tab Quản lý
            var manageTab = document.getElementById('mod-tab-manage');
            if (manageTab) {
                var title = manageTab.querySelector('[data-ui-label="mod_manage"]');
                var sub = manageTab.querySelector('[data-ui-label="mod_manage_sub"]');
                if (title) title.textContent = '2. Quản lý học liệu của bạn';
                if (sub) sub.textContent = 'Bài giảng, đề thi & thống kê';
            }
            
            // 3. Hook để hiện cả 2 nội dung khi bấm tab Quản lý
            if (!window._mergeTabsHooked && typeof window.switchTeacherModule === 'function') {
                window._mergeTabsHooked = true;
                var orig = window.switchTeacherModule;
                window.switchTeacherModule = function(modId){
                    orig(modId);
                    if (modId === 'manage') {
                        // TẠM TẮT gộp stats để tránh trắng trang
                        // Hiện nút làm mới để user tự tải danh sách
                        setTimeout(function(){
                            var manageView = document.getElementById('module-manage-view');
                            if (manageView && typeof renderLessonManagementList === 'function') {
                                try { renderLessonManagementList(); } catch(e){}
                            }
                        }, 300);
                    }
                };
            }
        } catch(e){ console.warn('mergeTabs:', e); }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(mergeTabs, 2000); });
    } else {
        setTimeout(mergeTabs, 2000);
    }
    setInterval(mergeTabs, 10000);
})();

// 2026-10-11: Đổi tên tab + thêm lớp trường vào dropdown kiểm tra
(function(){
    function initClassMerge(){
        // 1. Đổi tên tab "5. LỚP HỌC THÊM" -> "5. Quản lý lớp học của tôi"
        var tab = document.getElementById('mod-tab-private');
        if (tab) {
            var title = tab.querySelector('[data-ui-label="mod_private"]');
            var sub = tab.querySelector('[data-ui-label="mod_private_sub"]');
            if (title) title.textContent = '5. Quản lý lớp học của tôi';
            if (sub) sub.textContent = 'Lớp trường & lớp thêm';
        }
        
        // 2. Hook populateSchedClasses để thêm lớp trường
        if (!window._schedHooked && typeof window.populateSchedClasses === 'function') {
            window._schedHooked = true;
            var orig = window.populateSchedClasses;
            window.populateSchedClasses = async function(){
                await orig();
                try {
                    var sel = document.getElementById('sched-class');
                    if (!sel) return;
                    // Lấy lớp trường từ pvTeachAssigns
                    var teachClasses = [];
                    if (typeof pvTeachAssigns !== 'undefined' && pvTeachAssigns.length) {
                        teachClasses = pvTeachAssigns;
                    }
                    if (teachClasses.length) {
                        var html = sel.innerHTML;
                        // Thêm optgroup cho lớp trường
                        var optHtml = '<optgroup label="Lớp trường (phân công)">';
                        teachClasses.forEach(function(a){
                            var label = (a.class || '') + ' - ' + (a.subject || '');
                            optHtml += '<option value="school:' + label.replace(/"/g, '&quot;') + '">' + label + '</option>';
                        });
                        optHtml += '</optgroup>';
                        // Chèn trước </select> (cuối options)
                        sel.innerHTML = html + optHtml;
                    }
                } catch(e){ console.warn('Thêm lớp trường:', e); }
            };
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(initClassMerge, 2500); });
    } else {
        setTimeout(initClassMerge, 2500);
    }
    setInterval(initClassMerge, 10000);
})();

// 2026-10-11: Bắt buộc chọn nơi lưu, không để mặc định data
(function(){
    function enforceFolderSelection(){
        try {
            // 1. Xóa lựa chọn mặc định (nếu đang là data gốc)
            // Tìm biến lưu thư mục hiện tại
            if (typeof window.selectedFolderPath !== 'undefined' && window.selectedFolderPath === 'data') {
                window.selectedFolderPath = '';
            }
            // Cập nhật hiển thị
            var folderLabel = document.querySelector('[id*="folder"] [class*="label"], .folder-display');
            // (Giữ nguyên hiển thị, chỉ chặn khi đẩy)
            
            // 2. Hook các nút đẩy để kiểm tra
            var pushBtns = document.querySelectorAll('button[onclick*="publish"], button[onclick*="Push"], button[onclick*="push"]');
            pushBtns.forEach(function(btn){
                if (btn._folderCheckHooked) return;
                btn._folderCheckHooked = true;
                var origOnclick = btn.getAttribute('onclick');
                btn.setAttribute('onclick', 'return checkFolderBeforePush(event, \'' + origOnclick.replace(/'/g, "\\'") + '\')');
            });
        } catch(e){}
    }
    
    window.checkFolderBeforePush = function(event, origOnclick){
        try {
            var folder = '';
            // Thử lấy từ các biến global thông dụng
            if (typeof window.selectedFolderPath !== 'undefined') folder = window.selectedFolderPath;
            else if (typeof window.currentFolder !== 'undefined') folder = window.currentFolder;
            else if (typeof selectedFolder !== 'undefined') folder = selectedFolder;
            
            // Kiểm tra: chưa chọn hoặc đang là data gốc
            if (!folder || folder === 'data' || folder === 'data/') {
                alert('⚠️ Bạn chưa chọn nơi lưu!\n\nXin vui lòng chọn đúng khối lớp và môn học tại "VỊ TRÍ LƯU TRỮ BÀI ĐẨY LÊN" trước khi đẩy bài.');
                if (event) event.preventDefault();
                return false;
            }
        } catch(e){}
        // Cho phép chạy tiếp
        try {
            eval(origOnclick);
        } catch(e){ console.warn(e); }
        return true;
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(enforceFolderSelection, 3000); });
    } else {
        setTimeout(enforceFolderSelection, 3000);
    }
    setInterval(enforceFolderSelection, 10000);
})();

// 2026-10-11: Đổi hiển thị mặc định thành "Chưa chọn" thay vì "data"
(function(){
    function resetDefaultFolder(){
        try {
            // Tìm và đổi text hiển thị
            var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            var node;
            while (node = walker.nextNode()) {
                if (node.textContent && node.textContent.indexOf('data (Thư viện bài giảng)') >= 0) {
                    // Chỉ đổi nếu là text node đơn lẻ trong label
                    var parent = node.parentElement;
                    if (parent && parent.children.length <= 2) {
                        node.textContent = node.textContent.replace('data (Thư viện bài giảng)', '⚠️ Chưa chọn (bấm để chọn)');
                    }
                }
                if (node.textContent && node.textContent.trim() === '[data]') {
                    node.textContent = '[chưa chọn]';
                }
            }
            // Reset biến global
            if (typeof window.selectedFolderPath !== 'undefined' && window.selectedFolderPath === 'data') {
                window.selectedFolderPath = '';
            }
        } catch(e){}
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(resetDefaultFolder, 2000); });
    } else {
        setTimeout(resetDefaultFolder, 2000);
    }
    setInterval(resetDefaultFolder, 8000);
})();

// 2026-10-11: Tự động thêm "/kiểm tra" khi lưu đề thi
(function(){
    function autoKiemTraFolder(){
        try {
            // Hook vào hàm lưu để tự thêm /kiểm tra
            if (!window._kiemTraHooked) {
                window._kiemTraHooked = true;
                // Lưu lại hàm gốc nếu có
                var origCheck = window.checkFolderBeforePush;
                if (typeof origCheck === 'function') {
                    window.checkFolderBeforePush = function(event, origOnclick){
                        try {
                            var folder = window.selectedFolderPath || '';
                            // Nếu là đề thi (có từ khóa exam/kiemtra trong onclick) và chưa có /kiểm tra
                            if (origOnclick && origOnclick.toLowerCase().indexOf('exam') >= 0) {
                                if (folder && folder.indexOf('/kiểm tra') < 0 && folder.indexOf('/kiemtra') < 0) {
                                    window.selectedFolderPath = folder + '/kiểm tra';
                                    console.log('Tự động thêm thư mục kiểm tra:', window.selectedFolderPath);
                                }
                            }
                        } catch(e){}
                        return origCheck(event, origOnclick);
                    };
                }
            }
        } catch(e){}
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(autoKiemTraFolder, 2000); });
    } else {
        setTimeout(autoKiemTraFolder, 2000);
    }
})();

// 2026-10-11: Ẩn chương trong popup khi đẩy đề thi, chỉ hiện đến môn
(function(){
    function hideChaptersInExamMode(){
        try {
            // Kiểm tra có đang ở tab đề thi không (dùng biến global theo dõi)
            var mode = window._currentPushMode || '';
            // Nếu chưa có biến, đoán từ nút active
            if (!mode) {
                var bankBtn = document.getElementById('push-mode-bank');
                var aiBtn = document.getElementById('push-mode-ai');
                var directBtn = document.getElementById('push-mode-direct');
                if (bankBtn && bankBtn.className.indexOf('text-white') >= 0) mode = 'bank';
                else if (aiBtn && aiBtn.className.indexOf('text-white') >= 0) mode = 'ai';
                else if (directBtn && directBtn.className.indexOf('text-white') >= 0) mode = 'direct';
            }
            var isExamMode = (mode === 'bank' || mode === 'ai' || mode === 'direct');
            if (!isExamMode) return;
            
            // Tìm popup chọn thư mục đang mở
            var modals = document.querySelectorAll('[style*="position:fixed"], [class*="fixed"]');
            modals.forEach(function(modal){
                if (modal.style.display === 'none') return;
                var title = modal.textContent || '';
                if (title.indexOf('Chọn thư mục') < 0) return;
                
                // XÓA HẲN các node chương khỏi DOM (không chỉ ẩn)
                var toRemove = [];
                modal.querySelectorAll('*').forEach(function(el){
                    var txt = (el.textContent || '').trim();
                    if (/^Chương \d+/.test(txt)) {
                        var row = el.closest('div');
                        if (row && toRemove.indexOf(row) < 0) toRemove.push(row);
                    }
                });
                toRemove.forEach(function(r){ r.remove(); });
                
                // Xóa nút mở rộng (mũi tên) của các môn
                modal.querySelectorAll('*').forEach(function(el){
                    var txt = (el.textContent || '').trim();
                    if (txt === '' || txt === '›' || txt === '>' || txt === '∨' || txt === 'v') {
                        // Kiểm tra có phải nút expand không
                        var parent = el.parentElement;
                        if (parent && /Toán|Văn|Anh|Lý|Hóa|Sinh|Sử|Địa|Tin/.test(parent.textContent || '')) {
                            el.style.display = 'none';
                        }
                    }
                    // Ẩn icon folder-expand
                    if (el.className && typeof el.className === 'string' && el.className.indexOf('fa-angle') >= 0) {
                        el.style.display = 'none';
                    }
                    // Ẩn icon mở rộng của môn (vì không cần mở nữa)
                    if (txt === '' && el.className && el.className.indexOf('fa-angle') >= 0) {
                        // Giữ lại để biết có con, nhưng không bắt buộc mở
                    }
                });
                
                // Biến tên môn thành nút bấm chọn
                if (!modal._subjectBtnAdded) {
                    modal._subjectBtnAdded = true;
                    modal.querySelectorAll('*').forEach(function(el){
                        if (el._subjectHooked) return;
                        var txt = (el.textContent || '').trim();
                        // Nhận diện tên môn
                        if (el.children.length <= 1 && txt.length < 25 && txt.length > 3
                            && /[6-9]|10|11|12/.test(txt) && txt.indexOf('Chương') < 0
                            && /Toán|Văn|Anh|Lý|Hóa|Sinh|Sử|Địa|Tin|KHTN|GDCD|Công nghệ|Âm nhạc|Mỹ thuật|Thể dục/.test(txt)) {
                            el._subjectHooked = true;
                            el.style.cursor = 'pointer';
                            el.style.fontWeight = 'bold';
                            el.style.color = '#1d4ed8';
                            el.title = 'Bấm để chọn môn này';
                            el.addEventListener('click', function(e){
                                e.stopPropagation();
                                var subject = txt;
                                // Tìm đường dẫn đầy đủ từ DOM
                                var path = '';
                                // Thử đoán từ vị trí trong cây
                                var walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT, null, false);
                                // Đơn giản: dùng subject name, code lưu sẽ tự tìm path
                                if (typeof window.selectedFolderPath !== 'undefined') {
                                    // Đánh dấu là chọn môn (code lưu sẽ tự thêm /kiểm tra)
                                    window.selectedFolderPath = 'SUBJECT:' + subject;
                                    window.selectedSubjectName = subject;
                                }
                                // Cập nhật hiển thị
                                var displays = document.querySelectorAll('#folder-display, [id*="folder"] span');
                                // Đóng modal
                                modal.style.display = 'none';
                                if (typeof showToast === 'function') {
                                    showToast('Đã chọn môn: ' + subject + ' (sẽ lưu vào thư mục kiểm tra)', 'success');
                                } else {
                                    alert('Đã chọn môn: ' + subject);
                                }
                            });
                        }
                    });
                }
            });
        } catch(e){}
    }
    
    setInterval(hideChaptersInExamMode, 2000);
})();

// Theo dõi push mode hiện tại
(function(){
    if (window._pushModeTracked) return;
    window._pushModeTracked = true;
    window._currentPushMode = 'theory';
    
    // Hook vào các nút chuyển mode
    ['theory', 'exercise', 'bank', 'direct', 'ai'].forEach(function(m){
        var btn = document.getElementById('push-mode-' + m);
        if (btn) {
            btn.addEventListener('click', function(){
                window._currentPushMode = m;
            });
        }
    });
    
    // Cũng hook vào hàm switchPushMode nếu có
    var checkExist = setInterval(function(){
        if (typeof window.switchPushMode === 'function' && !window._switchHooked) {
            window._switchHooked = true;
            var orig = window.switchPushMode;
            window.switchPushMode = function(mode){
                window._currentPushMode = mode;
                return orig(mode);
            };
            clearInterval(checkExist);
        }
    }, 1000);
})();

// 2026-10-11: Nút tổ chức lại Ôn thi vào 10 dùng token admin
(function(){
    function addReorganizeBtn(){
        try {
            // Chỉ hiện cho admin (có nút Quản trị)
            var adminBtn = document.getElementById('btn-admin-space');
            if (!adminBtn) return;
            if (document.getElementById('btn-reorg-vao10')) return;
            
            var btn = document.createElement('button');
            btn.id = 'btn-reorg-vao10';
            btn.textContent = '📁 Tổ chức lại Ôn thi vào 10';
            btn.className = 'ml-2 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700';
            btn.title = 'Chia 38 file thành 3 thư mục môn (dùng token admin)';
            btn.onclick = async function(){
                if (!confirm('Chia thư mục "Ôn thi vào 10" thành 3 môn (Toán, Tiếng Anh, Ngữ Văn)?\nSẽ di chuyển 38 file.')) return;
                
                // Lấy token từ cài đặt
                var tokenInput = document.getElementById('cfg-github-token');
                var token = tokenInput ? tokenInput.value : localStorage.getItem('github_token');
                if (!token) {
                    alert('Chưa có GitHub token! Vào Cài đặt Admin để nhập token.');
                    return;
                }
                
                btn.disabled = true;
                btn.textContent = '⏳ Đang xử lý...';
                
                try {
                    // Lấy danh sách file
                    var res = await fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/data/THCS/' + encodeURIComponent('Ôn thi vào 10'), {
                        headers: { 'Authorization': 'token ' + token }
                    });
                    var files = await res.json();
                    
                    var moved = 0;
                    for (var f of files) {
                        if (f.type !== 'file') continue;
                        var name = f.name;
                        var subject = null;
                        if (name.indexOf('VAO10_Toan_') === 0) subject = 'Toán';
                        else if (name.indexOf('VAO10_Anh_') === 0) subject = 'Tiếng Anh';
                        else if (name.indexOf('VAO10_Van_') === 0) subject = 'Ngữ Văn';
                        if (!subject) continue;
                        
                        // Lấy nội dung file
                        var contentRes = await fetch(f.download_url);
                        var content = await contentRes.text();
                        
                        // Tạo file mới trong thư mục môn
                        var newPath = 'data/THCS/Ôn thi vào 10/' + subject + '/' + name;
                        await fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/' + encodeURIComponent(newPath), {
                            method: 'PUT',
                            headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: 'Move ' + name + ' to ' + subject,
                                content: btoa(unescape(encodeURIComponent(content)))
                            })
                        });
                        
                        // Xóa file cũ
                        await fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/' + encodeURIComponent('data/THCS/Ôn thi vào 10/' + name), {
                            method: 'DELETE',
                            headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: 'Delete old ' + name, sha: f.sha })
                        });
                        
                        moved++;
                        btn.textContent = '⏳ Đã chuyển ' + moved + ' file...';
                    }
                    
                    alert('Xong! Đã chuyển ' + moved + ' file vào 3 thư mục môn.');
                    btn.textContent = '✅ Đã xong';
                } catch(e) {
                    alert('Lỗi: ' + e.message);
                    btn.disabled = false;
                    btn.textContent = '📁 Tổ chức lại Ôn thi vào 10';
                }
            };
            
            // Thêm vào đầu tab Soạn bài & Đề thi
            var tab1 = document.querySelector('[id*="tab-1"], [id*="tab1"], [data-tab="1"]');
            if (tab1) {
                tab1.insertBefore(btn, tab1.firstChild);
            } else {
                // Fallback: thêm vào sau các nút module
                var modules = document.querySelector('.grid, [class*="grid"]');
                if (modules && modules.parentElement) {
                    modules.parentElement.insertBefore(btn, modules.nextSibling);
                } else {
                    document.body.insertBefore(btn, document.body.firstChild);
                }
            }
        } catch(e){}
    }
    
    setInterval(addReorganizeBtn, 3000);
})();

// 2026-10-11: Thống kê học liệu trong tab 2
(function(){
    async function loadStats(){
        try {
            var tab2 = document.getElementById('module-manage-view');
            if (!tab2) return;
            if (document.getElementById('hoclieu-stats')) return;
            
            var statsDiv = document.createElement('div');
            statsDiv.id = 'hoclieu-stats';
            statsDiv.className = 'p-4 mb-4 bg-blue-50 rounded-lg border border-blue-200';
            statsDiv.innerHTML = '<p class="text-gray-500">⏳ Đang tải thống kê...</p>';
            tab2.insertBefore(statsDiv, tab2.firstChild);
            
            // Đếm đề thi từ GitHub API
            var examCount = 0;
            var questionStats = { mcq: 0, truefalse: 0, short: 0, essay: 0 };
            
            try {
                // Lấy danh sách bank files
                var res = await fetch('https://api.github.com/repos/saobay/saobay.github.io/contents/data/bank');
                if (res.ok) {
                    var files = await res.json();
                    // Đếm nhanh từ tên file (không tải nội dung chi tiết để nhanh)
                    examCount = files.filter(f => f.name.endsWith('.json')).length;
                }
            } catch(e){}
            
            statsDiv.innerHTML = `
                <h3 class="font-bold text-lg mb-3 text-blue-900">📊 Thống kê học liệu</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div class="bg-white p-3 rounded shadow text-center">
                        <div class="text-2xl font-bold text-blue-600">${examCount}</div>
                        <div class="text-sm text-gray-600">File trong Bank</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow text-center">
                        <div class="text-2xl font-bold text-green-600">0</div>
                        <div class="text-sm text-gray-600">Đề đã đẩy</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow text-center">
                        <div class="text-2xl font-bold text-purple-600">0</div>
                        <div class="text-sm text-gray-600">Bài lý thuyết</div>
                    </div>
                    <div class="bg-white p-3 rounded shadow text-center">
                        <div class="text-2xl font-bold text-orange-600">0</div>
                        <div class="text-sm text-gray-600">Bài tập</div>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">Thống kê chi tiết theo loại câu hỏi đang phát triển...</p>
            `;
        } catch(e){}
    }
    
    setInterval(loadStats, 3000);
})();

// 2026-10-11: Chuyển chọn thư mục vào trong từng tab
(function(){
    var MODES = {
        'theory': { name: 'Lý thuyết', showChapters: true },
        'exercise': { name: 'Bài tập', showChapters: true },
        'bank': { name: 'Đề từ Bank', showChapters: false },
        'direct': { name: 'Đề từ Word', showChapters: false },
        'ai': { name: 'Đề từ AI', showChapters: false }
    };
    
    function setupTabFolders(){
        try {
            // Ẩn thanh chọn thư mục chung ở trên (nếu có)
            var topBar = document.querySelector('[id*="folder"][id*="bar"], .folder-select-bar');
            // Không ẩn hẳn, chỉ ghi chú
            
            // Với mỗi mode, thêm nút chọn thư mục riêng
            Object.keys(MODES).forEach(function(mode){
                var modeContent = document.getElementById('push-mode-' + mode + '-content') 
                    || document.querySelector('[data-push-mode="' + mode + '"]');
                if (!modeContent) return;
                if (modeContent.querySelector('.tab-folder-select')) return;
                
                var cfg = MODES[mode];
                var div = document.createElement('div');
                div.className = 'tab-folder-select mb-3 p-3 bg-gray-50 rounded border';
                div.innerHTML = `
                    <div class="text-sm font-medium mb-2">
                        📁 Nơi lưu ${cfg.name}: 
                        <span class="folder-display-${mode} text-orange-600 font-bold">Chưa chọn (bấm để chọn)</span>
                    </div>
                    <button class="btn-select-folder-${mode} px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Chọn thư mục ${cfg.showChapters ? '(đến chương)' : '(đến môn)'}
                    </button>
                    ${cfg.showChapters ? '' : '<p class="text-xs text-gray-500 mt-1">Đề thi nhiều chương → chỉ chọn đến môn, tự lưu vào thư mục "kiểm tra"</p>'}
                `;
                modeContent.insertBefore(div, modeContent.firstChild);
                
                // Xử lý bấm chọn
                div.querySelector('.btn-select-folder-' + mode).onclick = function(){
                    window._selectingForMode = mode;
                    window._modeShowChapters = cfg.showChapters;
                    // Mở popup chọn thư mục chung
                    var folderBtn = document.querySelector('[id*="folder"][id*="select"], .btn-folder-select');
                    if (folderBtn) folderBtn.click();
                    else {
                        // Fallback: trigger click vào chỗ "Chưa chọn" ở thanh trên
                        var topSelect = document.querySelector('.text-orange-600');
                        if (topSelect) topSelect.click();
                    }
                };
            });
            
            // Hook vào việc chọn thư mục xong để cập nhật đúng tab
            if (!window._folderHookDone) {
                window._folderHookDone = true;
                var origSetPath = window.setSelectedFolderPath;
                // Theo dõi thay đổi selectedFolderPath
                setInterval(function(){
                    var mode = window._selectingForMode;
                    if (mode && window.selectedFolderPath) {
                        var display = document.querySelector('.folder-display-' + mode);
                        if (display) {
                            var path = window.selectedFolderPath;
                            // Nếu là đề thi và chưa có /kiểm tra thì thêm
                            if (!MODES[mode].showChapters && path.indexOf('/kiểm tra') < 0 && path.indexOf('SUBJECT:') < 0) {
                                // Sẽ xử lý khi đẩy
                            }
                            display.textContent = path.replace('SUBJECT:', '');
                            display.className = 'folder-display-' + mode + ' text-green-600 font-bold';
                        }
                        window._selectingForMode = null;
                    }
                }, 1000);
            }
        } catch(e){}
    }
    
    setInterval(setupTabFolders, 3000);
})();

// 2026-10-11: Nút xóa cache giữ đăng nhập
(function(){
    function addClearCacheBtn(){
        try {
            if (document.getElementById('btn-clear-cache')) return;
            
            var btn = document.createElement('button');
            btn.id = 'btn-clear-cache';
            btn.textContent = '🧹 Xóa cache';
            btn.title = 'Xóa cache để test (giữ lại đăng nhập)';
            btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:8px 12px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
            btn.onclick = async function(){
                if (!confirm('Xóa cache và tải lại trang?\n(Đăng nhập sẽ được giữ lại)')) return;
                
                // Lưu lại thông tin đăng nhập
                var backup = {};
                ['saobay_user', 'github_token', 'saobay_admin_token'].forEach(function(k){
                    var v = localStorage.getItem(k);
                    if (v) backup[k] = v;
                });
                // Lưu sessionStorage nữa
                var sessBackup = {};
                for (var i = 0; i < sessionStorage.length; i++) {
                    var k = sessionStorage.key(i);
                    if (k && k.indexOf('saobay') >= 0) sessBackup[k] = sessionStorage.getItem(k);
                }
                
                // Xóa cache của service worker
                if ('caches' in window) {
                    var names = await caches.keys();
                    for (var n of names) await caches.delete(n);
                }
                
                // Xóa localStorage (trừ backup)
                localStorage.clear();
                Object.keys(backup).forEach(function(k){ localStorage.setItem(k, backup[k]); });
                
                // Khôi phục sessionStorage
                Object.keys(sessBackup).forEach(function(k){ sessionStorage.setItem(k, sessBackup[k]); });
                
                // Hard reload với cache-buster
                var url = new URL(window.location.href);
                url.searchParams.set('_cb', Date.now());
                window.location.href = url.toString();
            };
            
            document.body.appendChild(btn);
        } catch(e){}
    }
    
    // Thêm sau khi trang tải xong
    if (document.readyState === 'complete') addClearCacheBtn();
    else window.addEventListener('load', addClearCacheBtn);
    setInterval(addClearCacheBtn, 5000);
})();





// 2026-10-11: Ẩn thanh top bằng CSS + tắt popup validation cũ
(function(){
    // CSS ẩn ngay
    var style = document.createElement('style');
    style.textContent = `
        /* Ẩn thanh VỊ TRÍ LƯU TRỮ ở trên */
        div:has(> *:contains("VỊ TRÍ LƯU TRỮ")) { display: none !important; }
    `;
    document.head.appendChild(style);
    
    // Tìm và ẩn bằng JS mạnh hơn
    function hideTop(){
        try {
            document.querySelectorAll('div').forEach(function(d){
                var t = d.textContent || '';
                // Thanh top có cả 2 cụm từ này và là div lớn màu xanh
                if (t.indexOf('VỊ TRÍ LƯU TRỮ') >= 0 && t.indexOf('Sẵn sàng đẩy bài') >= 0) {
                    // Chỉ ẩn div ngoài cùng (không ẩn div con)
                    var isOutermost = true;
                    var p = d.parentElement;
                    while (p && p !== document.body) {
                        var pt = p.textContent || '';
                        if (pt.indexOf('VỊ TRÍ LƯU TRỮ') >= 0 && pt.indexOf('Sẵn sàng đẩy bài') >= 0 && p !== d) {
                            isOutermost = false;
                            break;
                        }
                        p = p.parentElement;
                    }
                    if (isOutermost) d.style.display = 'none';
                }
            });
        } catch(e){}
    }
    setInterval(hideTop, 1000);
    
    // Tắt popup validation cũ bằng cách override alert cho message này
    var origAlert = window.alert;
    window.alert = function(msg){
        if (typeof msg === 'string' && msg.indexOf('chưa chọn nơi lưu') >= 0) {
            console.log('Đã chặn popup validation cũ');
            return;
        }
        return origAlert(msg);
    };
})();

// 2026-10-11: Ẩn thanh VỊ TRÍ LƯU TRỮ (đơn giản)
(function(){
    function hide(){
        document.querySelectorAll('div').forEach(function(d){
            var t = d.textContent || '';
            if (t.indexOf('VỊ TRÍ LƯU TRỮ') >= 0 && t.indexOf('Sẵn sàng đẩy bài') >= 0) {
                d.style.setProperty('display', 'none', 'important');
            }
        });
    }
    setInterval(hide, 500);
    hide();
})();

// 2026-10-11: Nút Đẩy data bằng token admin trong tab 2
(function(){
    function addPushBtn(){
        try {
            var tab2 = document.getElementById('module-manage-view');
            if (!tab2) return;
            if (document.getElementById('btn-push-data-admin')) return;
            
            // Chỉ hiện cho admin
            var adminBtn = document.getElementById('btn-admin-space');
            if (!adminBtn) return;
            
            var div = document.createElement('div');
            div.className = 'p-4 mb-4 bg-green-50 border border-green-300 rounded-lg';
            div.innerHTML = `
                <h3 class="font-bold text-green-900 mb-2">📤 Đẩy data (Admin)</h3>
                <p class="text-sm text-gray-600 mb-2">Dùng GitHub token của bạn để đẩy trực tiếp, không qua GAS.</p>
                <button id="btn-push-data-admin" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">
                    📤 Đẩy data
                </button>
                <div id="push-data-status" class="mt-2 text-sm"></div>
            `;
            tab2.insertBefore(div, tab2.firstChild);
            
            document.getElementById('btn-push-data-admin').onclick = async function(){
                var status = document.getElementById('push-data-status');
                
                // Lấy token
                var tokenInput = document.getElementById('cfg-github-token');
                var token = tokenInput ? tokenInput.value.trim() : '';
                if (!token) token = localStorage.getItem('github_token') || '';
                if (!token) {
                    status.innerHTML = '<span class="text-red-600">❌ Chưa có token! Vào Cài đặt Admin để nhập.</span>';
                    return;
                }
                
                status.innerHTML = '<span class="text-blue-600">⏳ Đang kiểm tra token...</span>';
                
                try {
                    // Test token
                    var res = await fetch('https://api.github.com/repos/saobay/saobay.github.io', {
                        headers: { 'Authorization': 'token ' + token }
                    });
                    if (!res.ok) {
                        status.innerHTML = '<span class="text-red-600">❌ Token không hợp lệ!</span>';
                        return;
                    }
                    
                    status.innerHTML = '<span class="text-green-600">✅ Token OK! Sẵn sàng đẩy.</span><br>' +
                        '<span class="text-gray-500 text-xs">Chức năng đẩy file đang phát triển. Token đã lưu để dùng cho các tác vụ khác.</span>';
                    
                    // Lưu token vào localStorage để dùng chung
                    localStorage.setItem('github_token', token);
                } catch(e) {
                    status.innerHTML = '<span class="text-red-600">❌ Lỗi: ' + e.message + '</span>';
                }
            };
        } catch(e){}
    }
    
    setInterval(addPushBtn, 3000);
})();

