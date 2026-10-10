// hub-examsched.js — Lên lịch kiểm tra chống lộ đề (SAOBAY)
// GV lên lịch kiểm tra trong teacher-hub: đề được TRỘN + GIẤU trong data/exams-pending/
// cho tới giờ thi; index.html đọc data/exam-schedule.json để hiện banner cho HS.
// Định nghĩa: window.ExamSched = { saveScheduledExam, loadSchedule, getExamsForClass, mergeExamToBank, markExamDone,
//   deleteScheduledExam, renderExamManageList, autoMergeCheck, canEditExam, canDeleteExam, isReviewer, setReviewerUser }
// Phân quyền (2026-10-10):
//   - Admin: toàn quyền (sửa/xóa mọi đề, set quyền thẩm định)
//   - GV thẩm định (reviewer): sửa/xóa mọi đề (kể cả đã vào bank)
//   - GV thường: CHỈ sửa đề do mình tạo VÀ chưa vào bank; KHÔNG được xóa đề
// Tự động (2026-10-10): đề quá 10 ngày sau giờ thi mà chưa merge → tự động đưa vào bank.
// Tạo: 2026-10-10
(function(){
    'use strict';

    var OWNER = 'saobay', REPO = 'saobay.github.io', BRANCH = 'main';
    var GAS_URL = (typeof API_URL !== 'undefined') ? API_URL
        : 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
    var SCHEDULE_PATH = 'data/exam-schedule.json';
    var PENDING_DIR = 'data/exams-pending/';
    var REVIEWERS_PATH = 'data/exam-reviewers.json';
    var AUTO_MERGE_DAYS = 10;

    function rawUrl(path){
        return 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + path + '?t=' + Date.now();
    }

    function notify(msg, isErr){
        try {
            if (typeof window.showToast === 'function'){ window.showToast(msg, isErr ? 'error' : 'success'); return; }
            if (typeof toast === 'function'){ toast(msg); return; }
        } catch(e){}
        alert((isErr ? 'Lỗi: ' : '') + msg);
    }

    // Đẩy file lên GitHub qua GAS proxy — copy đúng pattern pvGasPush (hub-private.js)
    async function gasPush(filePath, content, commitMessage, title){
        var author = (typeof currentUser !== 'undefined' && currentUser) ? (currentUser.name || currentUser.id) : 'GV';
        var lastErr = null;
        for (var attempt = 0; attempt < 3; attempt++){
            var pushRes = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    type: 'PUSH_TO_GITHUB',
                    filePath: filePath,
                    content: content,
                    commitMessage: commitMessage,
                    title: title,
                    author: author
                })
            });
            var rj = await pushRes.json();
            if (rj && rj.status === 'success') return true;
            var emsg = String((rj && rj.message) || '');
            if (emsg.indexOf('409') < 0) throw new Error(emsg || 'Lưu thất bại.');
            lastErr = new Error(emsg || 'Xung đột, đang thử lại...');
            await new Promise(function(r){ setTimeout(r, 1200); });
        }
        throw lastErr || new Error('Không lưu được, vui lòng thử lại.');
    }

    async function loadSchedule(){
        try {
            var r = await fetch(rawUrl(SCHEDULE_PATH));
            if (!r.ok) return { exams: [] };
            var j = await r.json();
            if (!j || !Array.isArray(j.exams)) return { exams: [] };
            return j;
        } catch(e){
            return { exams: [] };
        }
    }

    async function writeSchedule(sched){
        var content = JSON.stringify(sched, null, 1);
        await gasPush(SCHEDULE_PATH, content, 'Cap nhat lich kiem tra', 'Lich kiem tra');
    }

    function slugFile(name){
        var s = String(name || 'de-kiem-tra');
        try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(e){}
        s = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return s || 'de-kiem-tra';
    }

    // ============ PHÂN QUYỀN (2026-10-10) ============
    // Admin: currentUser.role === 'admin'
    // GV thẩm định: có tên trong data/exam-reviewers.json
    function isAdminUser(){
        try { return (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin'); }
        catch(e){ return false; }
    }

    function myUid(){
        try { return String((typeof currentUser !== 'undefined' && currentUser && currentUser.id) || ''); }
        catch(e){ return ''; }
    }

    var _reviewersCache = null;
    async function loadReviewers(){
        if (_reviewersCache) return _reviewersCache;
        try {
            var r = await fetch(rawUrl(REVIEWERS_PATH));
            if (!r.ok){ _reviewersCache = { reviewers: [] }; return _reviewersCache; }
            var j = await r.json();
            _reviewersCache = (j && Array.isArray(j.reviewers)) ? j : { reviewers: [] };
            return _reviewersCache;
        } catch(e){ _reviewersCache = { reviewers: [] }; return _reviewersCache; }
    }

    async function isReviewer(uid){
        uid = String(uid !== undefined ? uid : myUid());
        if (!uid) return false;
        var rev = await loadReviewers();
        return (rev.reviewers || []).some(function(x){ return String((x && x.id) || x) === uid; });
    }

    // Admin set/bỏ quyền thẩm định cho GV (chỉ admin được gọi)
    async function setReviewerUser(teacherId, teacherName, on){
        try {
            if (!isAdminUser()) throw new Error('Chỉ admin mới được phân quyền thẩm định.');
            teacherId = String(teacherId || '').trim();
            if (!teacherId) throw new Error('Thiếu mã giáo viên.');
            var rev = await loadReviewers();
            rev.reviewers = rev.reviewers || [];
            var idx = rev.reviewers.findIndex(function(x){ return String((x && x.id) || x) === teacherId; });
            if (on && idx < 0) rev.reviewers.push({ id: teacherId, name: String(teacherName || ''), setAt: new Date().toISOString() });
            if (!on && idx >= 0) rev.reviewers.splice(idx, 1);
            _reviewersCache = rev;
            await gasPush(REVIEWERS_PATH, JSON.stringify(rev, null, 1),
                (on ? 'Them' : 'Bo') + ' quyen tham dinh de: ' + teacherId, 'Quyen tham dinh');
            notify((on ? 'Đã cấp' : 'Đã gỡ') + ' quyền thẩm định đề cho ' + (teacherName || teacherId) + '.');
            return { ok: true };
        } catch(e){
            notify('Không cập nhật được quyền thẩm định: ' + (e.message || e), true);
            return { ok: false, error: String((e && e.message) || e) };
        }
    }

    // GV thường: CHỈ sửa đề do mình tạo VÀ chưa vào bank.
    // GV thẩm định + admin: sửa mọi đề (kể cả đã vào bank).
    async function canEditExam(ex){
        try {
            if (!ex) return false;
            if (isAdminUser()) return true;
            if (await isReviewer()) return true;
            var uid = myUid();
            if (!uid) return false;
            var isOwner = String(ex.teacherId || '') === uid;
            var inBank = (ex.status === 'merged');
            return isOwner && !inBank;
        } catch(e){ return false; }
    }

    // CHỈ admin + GV thẩm định được xóa đề. GV thường KHÔNG được xóa.
    async function canDeleteExam(ex){
        try {
            if (!ex) return false;
            if (isAdminUser()) return true;
            return await isReviewer();
        } catch(e){ return false; }
    }

    // Đoán thư mục bank mặc định từ môn + khối (dùng cho auto-merge)
    function guessBankFolder(subject, grade){
        var s = String(subject || '').trim();
        var g = String(grade || '').trim().replace(/^lớp\s*/i, '').trim();
        if (/thpt|10|11|12/.test(g) || !g){
            // Mặc định THPT nếu không rõ
            return 'data/THPT/Khối lớp ' + (g || '10') + '/' + (s ? s + ' ' + (g || '10') : '');
        }
        return 'data/THCS/Khối lớp ' + g + '/' + (s ? s + ' ' + g : '');
    }

    // Lưu một lịch kiểm tra mới.
    // examJson: object đề thi (có sets: [{name, questions:[...]}]), đúng format exam10 mà web đọc được.
    async function saveScheduledExam(opts){
        try {
            opts = opts || {};
            var title = String(opts.title || '').trim();
            var subject = String(opts.subject || '').trim();
            var grade = String(opts.grade || '').trim();
            var classId = String(opts.classId || '').trim();
            var className = String(opts.className || opts.classId || '').trim();
            var examTime = String(opts.examTime || '').trim();
            var durationMin = parseInt(opts.durationMin, 10);
            var examJson = opts.examJson || {};
            var teacherId = String(opts.teacherId || '').trim();
            var teacherName = String(opts.teacherName || '').trim();

            if (!title) throw new Error('Thiếu tiêu đề đề kiểm tra.');
            if (!classId) throw new Error('Chưa chọn lớp kiểm tra.');
            if (!examTime) throw new Error('Chưa chọn giờ kiểm tra.');
            if (!durationMin || durationMin <= 0) throw new Error('Thời lượng làm bài không hợp lệ.');
            if (!examJson.sets || !examJson.sets.length) throw new Error('Đề thi chưa có bộ câu hỏi (sets trống).');

            var id = 'ex' + Date.now().toString(36);

            // Nội dung file đề chờ: examJson spread TRƯỚC, metadata lịch thi GHI ĐÈ sau
            // để các trường is_exam/exam_class/... luôn đúng dù examJson có trùng key.
            var pending = Object.assign({}, examJson, {
                is_exam: true,
                exam_class: classId,
                exam_class_name: className,
                exam_time: examTime,
                duration_min: durationMin,
                title: title,
                subject: subject,
                grade: grade,
                exam_id: id
            });

            var sched = await loadSchedule();
            sched.exams.push({
                id: id,
                title: title,
                subject: subject,
                grade: grade,
                classId: classId,
                className: className,
                examTime: examTime,
                durationMin: durationMin,
                file: PENDING_DIR + id + '.json',
                status: 'scheduled',
                teacherId: teacherId,
                teacherName: teacherName,
                createdAt: new Date().toISOString()
            });

            await gasPush(PENDING_DIR + id + '.json', JSON.stringify(pending, null, 1),
                'Len lich kiem tra: ' + title + ' (' + className + ')', 'De kiem tra ' + title);
            await writeSchedule(sched);

            notify('Đã lên lịch kiểm tra "' + title + '" cho lớp ' + className + '.');
            return { ok: true, id: id };
        } catch(e){
            notify('Không lưu được lịch kiểm tra: ' + (e.message || e), true);
            return { ok: false, error: String((e && e.message) || e) };
        }
    }

    // Lọc các lịch kiểm tra còn hiệu lực của một lớp (theo classId hoặc className).
    function getExamsForClass(sched, classIdOrName){
        try {
            var key = String(classIdOrName || '').trim();
            if (!key) return [];
            var exams = (sched && Array.isArray(sched.exams)) ? sched.exams : [];
            return exams.filter(function(x){
                if (!x) return false;
                if (x.status !== 'scheduled' && x.status !== 'active') return false;
                return String(x.classId || '') === key || String(x.className || '') === key;
            });
        } catch(e){ return []; }
    }

    // Sau khi HS thi xong: đưa đề vào bank + đánh dấu merged.
    async function mergeExamToBank(examId, bankFolder){
        try {
            examId = String(examId || '').trim();
            bankFolder = String(bankFolder || '').replace(/^\/+|\/+$/g, '');
            if (!examId) throw new Error('Thiếu mã lịch kiểm tra.');
            if (!bankFolder) throw new Error('Chưa chọn thư mục bank để lưu đề.');

            var sched = await loadSchedule();
            var ex = (sched.exams || []).find(function(x){ return x && x.id === examId; });
            if (!ex) throw new Error('Không tìm thấy lịch kiểm tra ' + examId + '.');

            var r = await fetch(rawUrl(ex.file));
            if (!r.ok) throw new Error('Không tải được file đề chờ (' + ex.file + ').');
            var pending = await r.json();

            var fileName = slugFile(ex.title) + '.json';
            var dest = bankFolder + '/' + fileName;
            await gasPush(dest, JSON.stringify(pending, null, 1),
                'Dua de kiem tra vao bank: ' + ex.title, 'De ' + ex.title);

            ex.status = 'merged';
            await writeSchedule(sched);

            notify('Đã đưa đề "' + ex.title + '" vào bank (' + dest + ').');
            return { ok: true, file: dest };
        } catch(e){
            notify('Không đưa được đề vào bank: ' + (e.message || e), true);
            return { ok: false, error: String((e && e.message) || e) };
        }
    }

    // Đánh dấu một lịch kiểm tra đã xong (không đưa vào bank).
    async function markExamDone(examId){
        try {
            examId = String(examId || '').trim();
            if (!examId) throw new Error('Thiếu mã lịch kiểm tra.');
            var sched = await loadSchedule();
            var ex = (sched.exams || []).find(function(x){ return x && x.id === examId; });
            if (!ex) throw new Error('Không tìm thấy lịch kiểm tra ' + examId + '.');
            ex.status = 'done';
            await writeSchedule(sched);
            notify('Đã đánh dấu hoàn thành lịch kiểm tra "' + ex.title + '".');
            return { ok: true };
        } catch(e){
            notify('Không cập nhật được trạng thái: ' + (e.message || e), true);
            return { ok: false, error: String((e && e.message) || e) };
        }
    }

    // ============ TỰ ĐỘNG ĐƯA VÀO BANK SAU 10 NGÀY (2026-10-10) ============
    // Đề kiểm tra quá 10 ngày sau giờ thi mà chưa merge → tự động đưa vào bank.
    // Gọi khi mở teacher-hub (không chặn UI).
    async function autoMergeCheck(){
        try {
            var sched = await loadSchedule();
            var exams = sched.exams || [];
            var now = Date.now();
            var changed = false;
            for (var i = 0; i < exams.length; i++){
                var ex = exams[i];
                if (!ex) continue;
                if (ex.status === 'merged') continue; // đã vào bank rồi
                if (!ex.examTime) continue;
                var examMs = new Date(ex.examTime).getTime();
                if (isNaN(examMs)) continue;
                var deadline = examMs + AUTO_MERGE_DAYS * 24 * 60 * 60 * 1000;
                if (now < deadline) continue; // chưa quá 10 ngày
                // Tự động merge
                try {
                    var r = await fetch(rawUrl(ex.file));
                    if (!r.ok) continue;
                    var pending = await r.json();
                    var bankFolder = ex.bankFolder || guessBankFolder(ex.subject, ex.grade);
                    var fileName = slugFile(ex.title) + '.json';
                    var dest = String(bankFolder).replace(/^\/+|\/+$/g, '') + '/' + fileName;
                    await gasPush(dest, JSON.stringify(pending, null, 1),
                        'Tu dong dua de kiem tra vao bank (qua 10 ngay): ' + ex.title, 'De ' + ex.title);
                    ex.status = 'merged';
                    ex.mergedAt = new Date().toISOString();
                    ex.autoMerged = true;
                    changed = true;
                } catch(e){ /* bỏ qua đề lỗi, xử lý đề tiếp theo */ }
            }
            if (changed) await writeSchedule(sched);
            return { ok: true, changed: changed };
        } catch(e){
            return { ok: false, error: String((e && e.message) || e) };
        }
    }

    // ============ XÓA ĐỀ KIỂM TRA (chỉ admin + GV thẩm định) ============
    async function deleteScheduledExam(examId){
        try {
            examId = String(examId || '').trim();
            if (!examId) throw new Error('Thiếu mã lịch kiểm tra.');
            var sched = await loadSchedule();
            var idx = (sched.exams || []).findIndex(function(x){ return x && x.id === examId; });
            if (idx < 0) throw new Error('Không tìm thấy lịch kiểm tra ' + examId + '.');
            var ex = sched.exams[idx];
            // Kiểm tra quyền: chỉ admin + GV thẩm định được xóa
            if (!(await canDeleteExam(ex))){
                throw new Error('Bạn không có quyền xóa đề này. Chỉ admin và GV thẩm định được xóa đề.');
            }
            if (!confirm('Xóa đề kiểm tra "' + ex.title + '" (' + (ex.className || '') + ')?\nHành động này không thể hoàn tác.')) {
                return { ok: false, cancelled: true };
            }
            // Xóa file đề chờ bằng cách ghi đè null (giống pattern xóa điểm)
            try { await gasPush(ex.file, 'null', 'Xoa de kiem tra: ' + ex.title, 'Xoa de'); } catch(e){}
            sched.exams.splice(idx, 1);
            await writeSchedule(sched);
            notify('Đã xóa đề kiểm tra "' + ex.title + '".');
            return { ok: true };
        } catch(e){
            notify('Không xóa được đề: ' + (e.message || e), true);
            return { ok: false, error: String((e && e.message) || e) };
        }
    }

    // ============ UI QUẢN LÝ ĐỀ KIỂM TRA (2026-10-10) ============
    // Render danh sách đề kiểm tra với nút "Hoàn thành & đưa vào bank" + "Xóa" (theo quyền)
    async function renderExamManageList(containerId){
        var box = document.getElementById(containerId);
        if (!box) return;
        try {
            var sched = await loadSchedule();
            var exams = (sched.exams || []).filter(function(x){ return x && x.status !== 'merged'; });
            if (!exams.length){
                box.innerHTML = '<p class="text-xs text-slate-500 italic px-1">Chưa có đề kiểm tra nào đang chờ.</p>';
                return;
            }
            var isAdm = isAdminUser();
            var reviewer = await isReviewer();
            var uid = myUid();
            var html = '';
            for (var i = 0; i < exams.length; i++){
                var ex = exams[i];
                var canEdit = isAdm || reviewer || (String(ex.teacherId || '') === uid);
                var canDel = isAdm || reviewer;
                var examDate = '';
                try { examDate = new Date(ex.examTime).toLocaleString('vi-VN'); } catch(e){ examDate = ex.examTime || ''; }
                // Đếm ngược auto-merge
                var autoInfo = '';
                try {
                    var examMs = new Date(ex.examTime).getTime();
                    var deadline = examMs + AUTO_MERGE_DAYS * 24 * 60 * 60 * 1000;
                    var daysLeft = Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));
                    if (daysLeft > 0) autoInfo = '<span class="text-[10px] text-amber-700">⏳ Tự vào bank sau ' + daysLeft + ' ngày</span>';
                    else autoInfo = '<span class="text-[10px] text-rose-700">⚠️ Quá hạn 10 ngày — sẽ tự vào bank</span>';
                } catch(e){}
                html += '<div class="border border-rose-200 rounded-lg p-2 mb-2 bg-white">'
                    + '<div class="flex items-start justify-between gap-2">'
                    + '<div class="min-w-0">'
                    + '<p class="text-xs font-black text-slate-800 truncate">' + escapeHtml(ex.title) + '</p>'
                    + '<p class="text-[10px] text-slate-500">' + escapeHtml(ex.subject || '') + ' • ' + escapeHtml(ex.grade || '')
                    + ' • Lớp: ' + escapeHtml(ex.className || '') + '</p>'
                    + '<p class="text-[10px] text-slate-500">🕐 ' + escapeHtml(examDate) + ' • GV: ' + escapeHtml(ex.teacherName || '') + '</p>'
                    + '<p class="mt-0.5">' + autoInfo + '</p>'
                    + '</div>'
                    + '<div class="flex flex-col gap-1 shrink-0">';
                if (canEdit){
                    html += '<button onclick="ExamSched.uiMergeExam(\'' + ex.id + '\')"'
                        + ' class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded">✅ Hoàn thành & đưa vào bank</button>';
                }
                if (canDel){
                    html += '<button onclick="ExamSched.deleteScheduledExam(\'' + ex.id + '\').then(function(){ExamSched.renderExamManageList(\'' + containerId + '\');})"'
                        + ' class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded">🗑 Xóa đề</button>';
                }
                html += '</div></div></div>';
            }
            box.innerHTML = html;
        } catch(e){
            box.innerHTML = '<p class="text-xs text-rose-600">Không tải được danh sách đề kiểm tra.</p>';
        }
    }

    function escapeHtml(s){
        return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // UI handler: bấm "Hoàn thành & đưa vào bank" → hỏi thư mục bank → merge
    async function uiMergeExam(examId){
        try {
            var sched = await loadSchedule();
            var ex = (sched.exams || []).find(function(x){ return x && x.id === examId; });
            if (!ex){ notify('Không tìm thấy đề.', true); return; }
            if (!(await canEditExam(ex))){ notify('Bạn không có quyền xử lý đề này.', true); return; }
            var defFolder = ex.bankFolder || guessBankFolder(ex.subject, ex.grade);
            var folder = prompt('Đưa đề "' + ex.title + '" vào thư mục bank nào?\n(VD: data/THPT/Khối lớp 10/Toán 10)', defFolder);
            if (!folder) return;
            var res = await mergeExamToBank(examId, folder);
            if (res && res.ok){
                // refresh danh sách nếu đang hiện
                var boxes = document.querySelectorAll('[data-exam-manage-list]');
                for (var i = 0; i < boxes.length; i++){ renderExamManageList(boxes[i].id); }
            }
        } catch(e){ notify('Lỗi: ' + (e.message || e), true); }
    }

    window.ExamSched = {
        saveScheduledExam: saveScheduledExam,
        loadSchedule: loadSchedule,
        getExamsForClass: getExamsForClass,
        mergeExamToBank: mergeExamToBank,
        markExamDone: markExamDone,
        deleteScheduledExam: deleteScheduledExam,
        renderExamManageList: renderExamManageList,
        autoMergeCheck: autoMergeCheck,
        canEditExam: canEditExam,
        canDeleteExam: canDeleteExam,
        isReviewer: isReviewer,
        setReviewerUser: setReviewerUser,
        isAdminUser: isAdminUser,
        uiMergeExam: uiMergeExam,
        _SCHEDULE_PATH: SCHEDULE_PATH,
        _PENDING_DIR: PENDING_DIR,
        _REVIEWERS_PATH: REVIEWERS_PATH
    };
})();
