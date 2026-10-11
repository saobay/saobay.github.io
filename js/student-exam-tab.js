// SAOBAY Student Exam Tab - 2026-10-11
// Tab "Bài Kiểm Tra" cho HS: hiện danh sách bài kiểm tra được giao, không cần chọn thư mục
(function(){
    'use strict';
    
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
