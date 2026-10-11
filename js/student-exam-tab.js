// SAOBAY_STUDENT_EXAM_TAB_VERSION:20261011_1816
// SAOBAY Student Exam Tab - 2026-10-11
// Tab "Bài Kiểm Tra" cho HS: hiện danh sách bài kiểm tra được giao, không cần chọn thư mục
(function(){
    'use strict';

    // Tự động thêm nút tab "Bài Kiểm Tra" vào thanh tab
    function injectExamTab(){
        if (document.getElementById('tab-exam')) return;
        var practiceBtn = document.getElementById('tab-practice');
        if (!practiceBtn) return;
        
        var btn = document.createElement('button');
        btn.id = 'tab-exam';
        btn.onclick = function(){ switchMode('exam'); };
        btn.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 relative';
        btn.innerHTML = '<i class="fa-solid fa-clipboard-check mr-2"></i> Bài Kiểm Tra'
            + '<span id="exam-tab-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>';
        
        practiceBtn.parentNode.insertBefore(btn, practiceBtn.nextSibling);
        
        // Thêm container cho danh sách bài kiểm tra
        var treeContainer = document.getElementById('tree-directory-container');
        if (treeContainer && !document.getElementById('exam-list-container')) {
            var examDiv = document.createElement('div');
            examDiv.id = 'exam-list-container';
            examDiv.className = 'hidden p-2';
            treeContainer.parentNode.insertBefore(examDiv, treeContainer.nextSibling);
        }
    }
    
    // Cập nhật switchMode để xử lý tab exam
    function patchSwitchMode(){
        if (window._examTabPatched) return;
        window._examTabPatched = true;
        
        var orig = window.switchMode;
        window.switchMode = function(mode){
            // Cập nhật style nút tab
            ['theory', 'practice', 'exam'].forEach(function(m){
                var b = document.getElementById('tab-' + m);
                if (!b) return;
                if (m === mode) {
                    b.className = b.className.replace(/bg-slate-100 text-slate-600( hover:bg-slate-200)?/, 'bg-blue-600 text-white shadow');
                    if (!b.className.includes('bg-blue-600')) b.classList.add('bg-blue-600', 'text-white', 'shadow');
                } else {
                    b.className = b.className.replace(/bg-blue-600 text-white shadow/, 'bg-slate-100 text-slate-600 hover:bg-slate-200');
                }
            });
            
            // Ẩn/hiện container phù hợp
            var treeContainer = document.getElementById('tree-directory-container');
            var examContainer = document.getElementById('exam-list-container');
            if (mode === 'exam') {
                if (treeContainer) treeContainer.classList.add('hidden');
                if (examContainer) {
                    examContainer.classList.remove('hidden');
                    setTimeout(loadMyExams, 100);
                }
            } else {
                if (treeContainer) treeContainer.classList.remove('hidden');
                if (examContainer) examContainer.classList.add('hidden');
                if (typeof orig === 'function') orig(mode);
            }
        };
    }
    
    // Inject khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ 
            setTimeout(function(){ injectExamTab(); patchSwitchMode(); }, 1500); 
        });
    } else {
        setTimeout(function(){ injectExamTab(); patchSwitchMode(); }, 1500);
    }

    
    // Load danh sách bài kiểm tra được giao cho HS hiện tại
    async function loadMyExams(){
        var container = document.getElementById('exam-list-container');
        if (!container) return;
        
        container.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải bài kiểm tra...</p>';
        
        try {
            var user = null;
            try { user = JSON.parse(localStorage.getItem('saobay_user') || 'null'); } catch(e){}
            if (!user || !user.id) {
                container.innerHTML = '<p class="text-sm text-slate-500 text-center py-8">Vui lòng đăng nhập để xem bài kiểm tra được giao.</p>';
                return;
            }
            
            // Tải file assignments
            var resp = await fetch('data/exam-assignments.json?t=' + Date.now());
            if (!resp.ok) {
                container.innerHTML = '<p class="text-sm text-slate-500 text-center py-8">Chưa có bài kiểm tra nào được giao.</p>';
                updateExamBadge(0);
                return;
            }
            var data = await resp.json();
            
            // Tìm bài giao cho HS này (theo ID, lớp, hoặc tất cả)
            var myExams = [];
            var userId = String(user.id || '');
            var className = String(user.className || user.class || '');
            
            (data.assignments || []).forEach(function(a){
                var targets = a.targets || [];
                var match = false;
                targets.forEach(function(t){
                    if (t === 'all' || t === userId || t === className) match = true;
                });
                if (match) myExams.push(a);
            });
            
            // Cập nhật badge
            updateExamBadge(myExams.length);
            
            if (!myExams.length) {
                container.innerHTML = '<p class="text-sm text-slate-500 text-center py-8"><i class="fa-solid fa-clipboard-check text-2xl mb-2 block text-slate-300"></i>Chưa có bài kiểm tra nào được giao.</p>';
                return;
            }
            
            // Render danh sách
            var html = '<div class="space-y-2">';
            myExams.forEach(function(ex, idx){
                var status = ex.status || 'pending';
                var statusColor = status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
                var statusText = status === 'done' ? 'Đã làm' : 'Chưa làm';
                html += '<div class="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:shadow-md transition cursor-pointer" onclick="openAssignedExam(\'' + (ex.path || '').replace(/'/g, "\\'") + '\')">'
                    + '<div class="flex-1">'
                    + '<p class="font-bold text-sm text-slate-800">' + escapeHtml(ex.title || 'Bài kiểm tra') + '</p>'
                    + '<p class="text-xs text-slate-500 mt-0.5">'
                    + (ex.subject ? escapeHtml(ex.subject) + ' • ' : '')
                    + (ex.deadline ? 'Hạn: ' + escapeHtml(ex.deadline) : 'Không giới hạn thời gian')
                    + '</p>'
                    + '</div>'
                    + '<span class="text-[10px] font-bold px-2 py-1 rounded-full ' + statusColor + '">' + statusText + '</span>'
                    + '<i class="fa-solid fa-chevron-right text-slate-300 ml-2"></i>'
                    + '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
            
        } catch(e) {
            console.error('loadMyExams:', e);
            container.innerHTML = '<p class="text-sm text-rose-500 text-center py-8">Lỗi tải danh sách: ' + escapeHtml(String(e.message || e)) + '</p>';
        }
    }
    
    function escapeHtml(s){
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    
    function updateExamBadge(count){
        var badge = document.getElementById('exam-tab-badge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    // Mở bài kiểm tra được giao
    window.openAssignedExam = function(path){
        if (!path) return;
        // Chuyển sang chế độ practice và mở bài
        // Path là đường dẫn tới file HTML bài kiểm tra
        window.location.href = path;
    };
    
    // Expose ra global
    window.loadMyExams = loadMyExams;
    window.updateExamBadge = updateExamBadge;
    
    // Tự động load khi chuyển sang tab exam
    var origSwitchMode = window.switchMode;
    if (typeof origSwitchMode === 'function') {
        window.switchMode = function(mode){
            origSwitchMode(mode);
            if (mode === 'exam') {
                setTimeout(loadMyExams, 100);
            }
        };
    }
    
    // Load badge khi trang tải xong (nếu đã đăng nhập)
    document.addEventListener('DOMContentLoaded', function(){
        setTimeout(function(){
            try {
                var user = JSON.parse(localStorage.getItem('saobay_user') || 'null');
                if (user && user.id) {
                    // Load ngầm để cập nhật badge
                    fetch('data/exam-assignments.json?t=' + Date.now())
                        .then(function(r){ return r.ok ? r.json() : null; })
                        .then(function(data){
                            if (!data) return;
                            var userId = String(user.id || '');
                            var className = String(user.className || user.class || '');
                            var count = 0;
                            (data.assignments || []).forEach(function(a){
                                (a.targets || []).forEach(function(t){
                                    if (t === 'all' || t === userId || t === className) count++;
                                });
                            });
                            updateExamBadge(count);
                        })
                        .catch(function(){});
                }
            } catch(e){}
        }, 2000);
    });
})();
