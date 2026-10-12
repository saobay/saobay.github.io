// Quan ly bao cao loi sai tu HS (2026-10-09) + SB_REPORTLINK_20261012_V1: the bao cao co nut "Mo cho loi" (link ?sbopen + #qN) va noi dung cau
// SB_REPORTFIX2_20261012: module hien trong du co bao cao pending - goc loi o loc theo mon: used.html luu saobay_user.subjects dang CHUOI noi dau phay ('' khi chua phan cong) con code cu coi la mang -> GV khong phan cong bi an het, GV co phan cong thi .some() tren String lam chet render; them bgh vao nhom xem toan truong nhu admin.
(function(){
    let reports = [];

    async function loadReports(){
        try {
            let r = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/reports/index.json?t=' + Date.now());
            if (r.ok){ let j = await r.json(); reports = j.reports || []; }
        } catch(e){ reports = []; }
        renderReports();
    }

    function mySubjects(){
        try {
            let u = JSON.parse(localStorage.getItem('saobay_user') || 'null');
            if (!u) return [];
            // SB_REPORTFIX2_20261012: BGH xem toan truong nhu admin (truoc day chi admin moi duoc ALL,
            // tai khoan bgh bi rot vao nhanh loc mon nen thay danh sach trong)
            if (u.role === 'admin' || u.role === 'bgh') return ['ALL'];
            // Lay mon tu phan cong. LUU Y: used.html luu subjects dang CHUOI noi bang dau phay
            // (vd "TOAN, NGU VAN", khong phan cong thi la chuoi rong ''), KHONG phai mang.
            // Ban cu tra thang u.subjects: chuoi rong -> loc .some() tren [] lam mat het bao cao;
            // chuoi co mon -> .some() khong ton tai tren String lam renderReports chet giua chung.
            let raw = u.subjects;
            if (Array.isArray(raw)) return raw.map(function(s){ return String(s).trim(); }).filter(Boolean);
            if (typeof raw === 'string') return raw.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
            return [];
        } catch(e){ return []; }
    }

    function renderReports(){
        let box = document.getElementById('reports-list');
        if (!box) return;
        let subs = mySubjects();
        let isAdmin = subs.includes('ALL');
        let list = reports.filter(function(rp){
            if (rp.status !== 'pending') return false;
            if (isAdmin) return true;
            // SB_REPORTFIX2_20261012: GV chua co du lieu phan cong mon (subs rong) thi khong loc duoc
            // -> hien tat ca bao cao cho xu ly (ban cu loc .some() tren [] = an het, bao "khong co bao cao" sai).
            if (!subs.length) return true;
            // Loc theo mon: khop tren ca duong dan lan tieu de trang (record cu co page_path='index.html'
            // nhung page_title chua ma mon, vd 'TOAN 10 Bai 1 Menh de Bai tap')
            let hay = ((rp.page_path || '') + ' ' + (rp.page_title || '')).toLowerCase();
            return subs.some(function(s){ return hay.includes(String(s).toLowerCase()); });
        });
        if (!list.length){
            box.innerHTML = '<p class="text-xs text-slate-400 italic p-4">Chưa có báo cáo nào chờ xử lý.</p>';
            return;
        }
        box.innerHTML = list.map(function(rp){
            var isFormula = rp.type === 'formula_error';
            var badge = isFormula
                ? '<span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full ml-2">⚠️ LỖI CÔNG THỨC</span>'
                : '<span class="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full ml-2">BÁO LỖI HS</span>';
            var reporter = isFormula
                ? escHtml(rp.student_name || '') + ' (GV)'
                : escHtml(rp.student_name || '') + ' (' + escHtml(rp.student_class || '') + ')';
            var descBg = isFormula ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-100';
            var okBtn = isFormula ? 'Đã sửa xong' : 'Đúng — sửa & +5đ';
            return '<div class="bg-white border border-slate-200 rounded-xl p-3 mb-2">'
                + '<div class="flex items-start justify-between gap-2">'
                + '<div class="flex-1">'
                + '<p class="text-sm font-bold text-slate-800">' + escHtml(rp.page_title || '') + badge + '</p>'
                + '<p class="text-[11px] text-slate-500">' + reporter
                + (rp.question_num ? ' • Câu ' + escHtml(rp.question_num) : '') + '</p>'
                + '<p class="text-xs text-slate-700 mt-1.5 ' + descBg + ' border rounded-lg px-2.5 py-2">' + escHtml(rp.description || '') + '</p>'
                + (rp.question_text ? '<p class="text-[11px] text-slate-500 mt-1.5">Câu hỏi: <span class="text-slate-700 font-semibold">' + escHtml(String(rp.question_text).substring(0, 180)) + '</span></p>' : '')
                + (rp.exam_set ? '<p class="text-[11px] text-slate-400 mt-0.5">' + escHtml(rp.exam_set) + '</p>' : '')
                + '</div></div>'
                + '<div class="flex flex-wrap gap-2 mt-2">'
                + (rp.link ? '<a href="' + escHtml(rp.link) + '" target="_blank" rel="noopener" class="text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"><i class="fa-solid fa-link mr-1"></i>Mở chỗ lỗi</a>' : '')
                + '<button onclick="rpResolve(\'' + rp.id + '\', true)" class="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg"><i class="fa-solid fa-check mr-1"></i>' + okBtn + '</button>'
                + '<button onclick="rpResolve(\'' + rp.id + '\', false)" class="text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg">Sai — bỏ qua</button>'
                + '</div></div>';
        }).join('');
    }

    function escHtml(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    window.rpResolve = async function(id, valid){
        var rp = reports.find(function(x){ return x.id === id; });
        var isFormula = rp && rp.type === 'formula_error';
        var msg = valid
            ? (isFormula ? 'Xác nhận đã SỬA XONG lỗi công thức này?' : 'Xác nhận báo cáo ĐÚNG? HS sẽ được +5 điểm năng động.')
            : 'Xác nhận báo cáo SAI và bỏ qua?';
        if (!confirm(msg)) return;
        try {
            // SB_REPORTFIX_20261012_V1: ghi thang vao data/reports/index.json qua PUSH_TO_GITHUB (GAS khong co action resolveReport)
            let r0 = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/data/reports/index.json?t=' + Date.now());
            let j0 = r0.ok ? await r0.json() : { reports: [] };
            if (!j0 || !Array.isArray(j0.reports)) j0 = { reports: [] };
            let target = j0.reports.find(function(x){ return x.id === id; });
            if (!target){ alert('Không tìm thấy báo cáo trong dữ liệu mới nhất.'); return; }
            target.status = valid ? 'resolved' : 'rejected';
            target.resolved_at = new Date().toISOString();
            target.valid = !!valid;
            j0.updated = new Date().toISOString();
            let r = await fetch('https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec', {
                method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: 'data/reports/index.json', content: JSON.stringify(j0, null, 1), commitMessage: 'Xu ly bao loi ' + id })
            });
            let j = await r.json();
            if (j && (j.status === 'success' || j.status === 'ok')){
                alert(valid ? (isFormula ? 'Đã đánh dấu sửa xong!' : 'Đã duyệt! HS được +5 điểm năng động. ⭐') : 'Đã bỏ qua báo cáo.');
                loadReports();
            } else alert('Lỗi, thử lại sau.');
        } catch(e){ alert('Lỗi kết nối.'); }
    };

    window.rpInit = loadReports;
})();
