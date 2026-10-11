// SAOBAY_TEACHER_EXAM_MANAGE_VERSION:20261011_1952
// SAOBAY Teacher Exam Management - 2026-10-11
// Quản lý đề kiểm tra của GV: danh sách đề đã tạo từ ma trận, nút "Giao cho HS"
(function(){
    'use strict';
    
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
    
    // Tải danh sách đề của GV hiện tại
    async function exbLoadTeacherExams(){
        var container = document.getElementById('teacher-exams-list');
        if (!container) return;
        
        container.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải danh sách đề...</p>';
        
        try {
            var user = null;
            try { user = JSON.parse(localStorage.getItem('saobay_user') || 'null'); } catch(e){}
            if (!user || !user.id) {
                container.innerHTML = '<p class="text-sm text-slate-500">Vui lòng đăng nhập.</p>';
                return;
            }
            
            var teacherId = String(user.id).replace(/[^a-zA-Z0-9]/g, '_');
            
            // Tải index.json (tránh dùng GitHub API bị 403)
            var indexUrl = 'https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/private/' + classId + '/index.json?t=' + Date.now();
            var resp = await fetch(indexUrl);
            if (!resp.ok) {
                container.innerHTML = '<p class="text-sm text-slate-500 text-center py-6"><i class="fa-solid fa-folder-open text-2xl mb-2 block text-slate-300"></i>Chưa có đề nào. Dùng ma trận để tạo đề mới.</p>';
                return;
            }
            
            var indexData = await resp.json();
            var exams = indexData.exams || [];
            if (!exams.length) {
                container.innerHTML = '<p class="text-sm text-slate-500 text-center py-6">Chưa có đề nào.</p>';
                return;
            }
            
            // Render từ index (đã có sẵn title, không cần tải từng file)
            var html = '<div class="space-y-2">';
            exams.forEach(function(ex){
                html += renderExamCard(ex);
            });
            html += '</div>';
            container.innerHTML = html;
            
        } catch(e) {
            console.error('exbLoadTeacherExams:', e);
            container.innerHTML = '<p class="text-sm text-rose-500">Lỗi: ' + escapeHtml(e.message) + '</p>';
        }
    }
    
    function renderExamCard(exam){
        var qCount = (exam.questions || []).length;
        var date = exam.created_at ? new Date(exam.created_at).toLocaleDateString('vi-VN') : '';
        return '<div class="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition">'
            + '<div class="flex items-start justify-between">'
            + '<div class="flex-1">'
            + '<p class="font-bold text-sm text-slate-800">' + escapeHtml(exam.title || 'Đề kiểm tra') + '</p>'
            + '<p class="text-xs text-slate-500 mt-1">'
            + (exam.subject ? escapeHtml(exam.subject) + ' • ' : '')
            + qCount + ' câu • ' + date
            + '</p>'
            + '</div>'
            + '<div class="flex gap-1.5">'
            + '<button onclick="exbPreviewExam(\'' + (exam.id || '') + '\')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold" title="Xem trước">'
            + '<i class="fa-solid fa-eye"></i></button>'
            + '<button onclick="exbSendToClass(\'' + (exam.id || '') + '\', \'' + (exam.bank_path || exam.private_path || '') + '\')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold">'
            + '<i class="fa-solid fa-paper-plane mr-1"></i>Gửi cho lớp</button>'
            + '<button onclick="exbDeleteExam(\'' + (exam.id || '') + '\')" class="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 px-2.5 py-1.5 rounded-lg font-bold" title="Xóa">'
            + '<i class="fa-solid fa-trash"></i></button>'
            + '</div>'
            + '</div>'
            + '</div>';
    }
    
    function escapeHtml(s){
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    
    // Giao đề cho HS
    window.exbAssignExam = async function(examId){
        try {
            var user = null;
            try { user = JSON.parse(localStorage.getItem('saobay_user') || 'null'); } catch(e){}
            if (!user || !user.id) { alert('Vui lòng đăng nhập.'); return; }
            
            var teacherId = String(user.id).replace(/[^a-zA-Z0-9]/g, '_');
            
            // Tải thông tin đề
            var examResp = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/private/' + classId + '/' + examId + '.json');
            var exam = await examResp.json();
            
            // Hỏi đối tượng giao: lớp học thêm, tất cả, hoặc nhập tay
            var target = prompt('Giao đề "' + (exam.title || '') + '" cho:\n- Nhập "all" để giao cho tất cả HS\n- Nhập tên lớp (vd: 6A1) để giao cho cả lớp\n- Nhập ID HS để giao cho 1 HS\n\nNhập đối tượng:', 'all');
            if (!target) return;
            target = target.trim();
            if (!target) return;
            
            var deadline = prompt('Hạn nộp (định dạng YYYY-MM-DD, để trống nếu không giới hạn):', '');
            
            // Tải assignments hiện tại
            var assignResp = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/exam-assignments.json?t=' + Date.now());
            var assignData = assignResp.ok ? await assignResp.json() : { assignments: [] };
            
            // Thêm assignment mới
            assignData.assignments.push({
                id: 'assign_' + Date.now(),
                exam_id: examId,
                exam_path: 'data/private/' + classId + '/' + examId + '.json',
                title: exam.title,
                subject: exam.subject,
                targets: [target],
                deadline: deadline || '',
                created_by: user.id,
                created_at: new Date().toISOString()
            });
            
            // Lưu lên GitHub
            var saveResp = await fetch(GAS_URL, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain;charset=utf-8'},
                body: JSON.stringify({
                    type: 'PUSH_TO_GITHUB',
                    filePath: 'data/exam-assignments.json',
                    content: JSON.stringify(assignData, null, 2),
                    commitMessage: 'Giao đề: ' + exam.title,
                    title: 'Giao đề kiểm tra',
                    author: 'saobay-teacher'
                })
            });
            var result = await saveResp.json();
            if (result.error) throw new Error(result.error);
            
            alert('Đã giao đề "' + exam.title + '" cho ' + (target === 'all' ? 'tất cả HS' : target) + '!');
            if (typeof showToast === 'function') showToast('Đã giao đề thành công!', 'success');
            
        } catch(e) {
            console.error('exbAssignExam:', e);
            alert('Lỗi: ' + e.message);
        }
    };
    
    // Xem trước đề
    window.exbPreviewExam = async function(examId){
        alert('Chức năng xem trước đang phát triển. Đề ID: ' + examId);
    };
    
    // Xóa đề
    window.exbDeleteExam = async function(examId){
        if (!confirm('Xóa đề này? Hành động không thể hoàn tác.')) return;
        alert('Chức năng xóa đang phát triển.');
    };
    
    // Expose
    window.exbLoadTeacherExams = exbLoadTeacherExams;
    
    // Tự động tải khi chuyển sang tab manage
    document.addEventListener('DOMContentLoaded', function(){
        // Hook vào switchTeacherModule nếu có
        var origSwitch = window.switchTeacherModule;
        if (typeof origSwitch === 'function') {
            window.switchTeacherModule = function(mod){
                origSwitch(mod);
                if (mod === 'manage') {
                    setTimeout(exbLoadTeacherExams, 300);
                }
            };
        }
    });

    // Tự động thêm section "Đề kiểm tra của tôi" vào tab Quản lý
    function injectExamSection(){
        var container = document.getElementById('manage-lessons-table-container');
        if (!container) return;
        if (document.getElementById('teacher-exams-section')) return;
        
        var section = document.createElement('div');
        section.id = 'teacher-exams-section';
        section.className = 'mt-6 pt-4 border-t-2 border-blue-200';
        section.innerHTML = '<h3 class="font-extrabold text-slate-800 text-base flex items-center mb-3">'
            + '<i class="fa-solid fa-clipboard-list text-blue-600 mr-2"></i> Đề Kiểm Tra Của Tôi (từ ma trận)'
            + '<button onclick="exbLoadTeacherExams()" class="ml-auto text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-lg font-bold">'
            + '<i class="fa-solid fa-rotate mr-1"></i>Làm mới</button></h3>'
            + '<div id="teacher-exams-list" class="space-y-2"></div>';
        
        container.parentNode.insertBefore(section, container.nextSibling);
    }
    
    // Inject khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(injectExamSection, 1000); });
    } else {
        setTimeout(injectExamSection, 1000);
    }


    // Kiểm tra có phải admin không
    function isAdmin(){
        try {
            var u = JSON.parse(localStorage.getItem('saobay_user') || 'null');
            return u && u.role === 'admin';
        } catch(e){ return false; }
    }
    
    // Tải danh sách TẤT CẢ đề (cho admin)
    async function exbLoadAllExams(teacherFilter){
        var container = document.getElementById('teacher-exams-list');
        if (!container) return;
        
        container.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải...</p>';
        
        try {
            // Lấy danh sách GV từ index tổng
            var allExams = [];
            // TODO: cần API liệt kê thư mục, tạm thời dùng cách khác
            container.innerHTML = '<p class="text-sm text-slate-500">Chức năng admin đang phát triển. Tạm thời xem từng GV.</p>';
        } catch(e) {
            container.innerHTML = '<p class="text-sm text-rose-500">Lỗi: ' + escapeHtml(e.message) + '</p>';
        }
    }
    
    // Admin duyệt đề -> đưa vào data bank
    window.exbAddToBank = async function(teacherId, examId){
        if (!confirm('Đưa đề này vào Bank chung?')) return;
        try {
            // Tải đề
            var examResp = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/private/' + classId + '/' + examId + '.json');
            var exam = await examResp.json();
            
            // Cập nhật status
            exam.status = 'in_bank';
            exam.in_bank_at = new Date().toISOString();
            
            // Lưu lại
            var saveResp = await fetch(GAS_URL, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain;charset=utf-8'},
                body: JSON.stringify({
                    type: 'PUSH_TO_GITHUB',
                    filePath: 'data/private/' + classId + '/' + examId + '.json',
                    content: JSON.stringify(exam, null, 2),
                    commitMessage: 'Duyệt đề: ' + exam.title,
                    title: 'Duyệt đề',
                    author: 'saobay-admin'
                })
            });
            
            alert('Đã duyệt đề "' + exam.title + '"!');
            exbLoadTeacherExams();
        } catch(e) {
            alert('Lỗi: ' + e.message);
        }
    };
    
    // Cập nhật renderExamCard để hiện nút duyệt cho admin
    var origRender = renderExamCard;
    renderExamCard = function(exam){
        var html = origRender(exam);
        if (isAdmin() && exam.status !== 'in_bank') {
            // Thêm nút duyệt
            html = html.replace('</div></div>', 
                '<button onclick="exbAddToBank(\'' + (exam.teacher_id || '') + '\',\'' + (exam.id || '') + '\')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold ml-1">'
                + '<i class="fa-solid fa-database mr-1"></i>Đưa vào Bank</button></div></div>');
        }
        // Hiện trạng thái
        var statusBadge = '';
        if (exam.status === 'in_bank') statusBadge = '<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold ml-2">Đã vào Bank</span>';
        else statusBadge = '<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold ml-2">Đề riêng</span>';
        html = html.replace('</p>', statusBadge + '</p>');
        return html;
    };


    // Admin duyệt: chuyển đề từ private sang bank + cập nhật link
    window.exbApproveToBank = async function(classId, examId){
        if (!confirm('Chuyển đề này sang Bank chung? Link bài sẽ được cập nhật.')) return;
        try {
            // 1. Tải đề từ private
            var srcUrl = 'https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/private/' + classId + '/' + examId + '.json?t=' + Date.now();
            var examResp = await fetch(srcUrl);
            if (!examResp.ok) throw new Error('Không tải được đề');
            var exam = await examResp.json();
            
            // 2. Lưu sang bank
            var bankPath = 'data/bank/exams/' + examId + '.json';
            exam.bank_path = bankPath;
            exam.approved_at = new Date().toISOString();
            exam.status = 'in_bank';
            
            var saveResp = await fetch('https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec', {
                method: 'POST',
                headers: {'Content-Type': 'text/plain;charset=utf-8'},
                body: JSON.stringify({
                    type: 'PUSH_TO_GITHUB',
                    filePath: bankPath,
                    content: JSON.stringify(exam, null, 2),
                    commitMessage: 'Duyệt đề vào bank: ' + exam.title,
                    title: 'Duyệt đề',
                    author: 'saobay-admin'
                })
            });
            var result = await saveResp.json();
            if (result.error) throw new Error(result.error);
            
            // 3. Xóa file ở private (hoặc đánh dấu đã chuyển)
            // Giữ lại file private nhưng cập nhật status
            exam.private_path = 'data/private/' + classId + '/' + examId + '.json';
            alert('Đã chuyển đề "' + exam.title + '" sang Bank!\nLink mới: ' + bankPath);
            
            if (typeof exbLoadTeacherExams === 'function') exbLoadTeacherExams();
        } catch(e) {
            alert('Lỗi: ' + e.message);
        }
    };


    // Gửi đề cho lớp - chọn từ cả lớp trường và lớp tự tạo
    window.exbSendToClass = async function(examId, examPath){
        try {
            // Lấy danh sách lớp
            var classes = [];
            // Lớp tự tạo (private)
            if (typeof pvMyClasses === 'function') {
                var priv = pvMyClasses() || [];
                priv.forEach(function(c){ classes.push({id: c.id, name: c.name + ' (lớp tự tạo)', type: 'private'}); });
            }
            // Lớp trường (từ phân công)
            if (typeof pvTeachAssigns !== 'undefined' && pvTeachAssigns.length) {
                pvTeachAssigns.forEach(function(a){
                    classes.push({id: 'school:' + a.class, name: a.class + ' - ' + a.subject + ' (lớp trường)', type: 'school'});
                });
            }
            
            if (!classes.length) {
                alert('Chưa có lớp nào. Hãy tạo lớp ở mục "Quản lý lớp học của tôi".');
                return;
            }
            
            // Tạo modal chọn lớp
            var html = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;" id="send-class-modal">';
            html += '<div style="background:white;border-radius:12px;padding:20px;max-width:400px;width:90%;">';
            html += '<h3 style="font-weight:bold;margin-bottom:12px;">Chọn lớp để gửi đề</h3>';
            html += '<select id="send-class-select" style="width:100%;border:1px solid #ccc;border-radius:8px;padding:8px;margin-bottom:12px;">';
            classes.forEach(function(c){
                html += '<option value="' + c.id + '">' + c.name + '</option>';
            });
            html += '</select>';
            html += '<div style="display:flex;gap:8px;justify-content:flex-end;">';
            html += '<button onclick="document.getElementById(\'send-class-modal\').remove()" style="padding:8px 16px;border-radius:8px;background:#e5e7eb;">Hủy</button>';
            html += '<button onclick="exbDoSendToClass(\'' + examId + '\', \'' + examPath + '\')" style="padding:8px 16px;border-radius:8px;background:#2563eb;color:white;font-weight:bold;">Gửi</button>';
            html += '</div></div></div>';
            
            document.body.insertAdjacentHTML('beforeend', html);
        } catch(e){ alert('Lỗi: ' + e.message); }
    };
    
    window.exbDoSendToClass = async function(examId, examPath){
        try {
            var sel = document.getElementById('send-class-select');
            var classId = sel ? sel.value : '';
            if (!classId) return;
            
            // Lưu assignment
            var assignData = {
                exam_id: examId,
                exam_path: examPath, // Link tự động là bank nếu đã duyệt
                class_id: classId,
                assigned_at: new Date().toISOString(),
                assigned_by: (typeof currentUser !== 'undefined' && currentUser.id) ? currentUser.id : ''
            };
            
            // Gọi API lưu assignment (dùng exam-assignments.json)
            var resp = await fetch('https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec', {
                method: 'POST',
                headers: {'Content-Type': 'text/plain;charset=utf-8'},
                body: JSON.stringify({
                    type: 'PUSH_TO_GITHUB',
                    filePath: 'data/exam-assignments/' + examId + '_' + Date.now() + '.json',
                    content: JSON.stringify(assignData, null, 2),
                    commitMessage: 'Giao đề cho lớp: ' + classId,
                    title: 'Giao đề',
                    author: 'saobay-teacher'
                })
            });
            
            document.getElementById('send-class-modal').remove();
            alert('Đã gửi đề cho lớp!');
        } catch(e){ alert('Lỗi: ' + e.message); }
    };

})();
