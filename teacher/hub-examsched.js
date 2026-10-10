// hub-examsched.js — Lên lịch kiểm tra chống lộ đề (SAOBAY)
// GV lên lịch kiểm tra trong teacher-hub: đề được TRỘN + GIẤU trong data/exams-pending/
// cho tới giờ thi; index.html đọc data/exam-schedule.json để hiện banner cho HS.
// Định nghĩa: window.ExamSched = { saveScheduledExam, loadSchedule, getExamsForClass, mergeExamToBank, markExamDone }
// Tạo: 2026-10-10
(function(){
    'use strict';

    var OWNER = 'saobay', REPO = 'saobay.github.io', BRANCH = 'main';
    var GAS_URL = (typeof API_URL !== 'undefined') ? API_URL
        : 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
    var SCHEDULE_PATH = 'data/exam-schedule.json';
    var PENDING_DIR = 'data/exams-pending/';

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

    window.ExamSched = {
        saveScheduledExam: saveScheduledExam,
        loadSchedule: loadSchedule,
        getExamsForClass: getExamsForClass,
        mergeExamToBank: mergeExamToBank,
        markExamDone: markExamDone,
        _SCHEDULE_PATH: SCHEDULE_PATH,
        _PENDING_DIR: PENDING_DIR
    };
})();
