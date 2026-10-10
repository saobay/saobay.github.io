// Quan ly bao cao loi sai tu HS (2026-10-09)
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
            if (u.role === 'admin') return ['ALL'];
            // Lay mon tu phan cong
            return (u.subjects || []);
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
            // Loc theo mon: duong dan chua ten mon
            let path = (rp.page_path || '').toLowerCase();
            return subs.some(function(s){ return path.includes(s.toLowerCase()); });
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
                + '</div></div>'
                + '<div class="flex gap-2 mt-2">'
                + '<button onclick="rpResolve(\'' + rp.id + '\', true)" class="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg"><i class="fa-solid fa-check mr-1"></i>' + okBtn + '</button>'
                + '<button onclick="rpResolve(\'' + rp.id + '\', false)" class="text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg">Sai — bỏ qua</button>'
                + '</div></div>';
        }).join('');
    }

    function escHtml(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    window.rpResolve = async function(id, valid){
        var rp = (typeof reports !== 'undefined' ? reports : []).find(function(x){ return x.id === id; });
        var isFormula = rp && rp.type === 'formula_error';
        var msg = valid
            ? (isFormula ? 'Xác nhận đã SỬA XONG lỗi công thức này?' : 'Xác nhận báo cáo ĐÚNG? HS sẽ được +5 điểm năng động.')
            : 'Xác nhận báo cáo SAI và bỏ qua?';
        if (!confirm(msg)) return;
        try {
            let r = await fetch('https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec', {
                method: 'POST',
                body: JSON.stringify({ action: 'resolveReport', id: id, valid: valid })
            });
            let j = await r.json();
            if (j.ok){
                var rp2 = (typeof reports !== 'undefined' ? reports : []).find(function(x){ return x.id === id; });
                var isF = rp2 && rp2.type === 'formula_error';
                alert(valid ? (isF ? 'Đã đánh dấu sửa xong!' : 'Đã duyệt! HS được +5 điểm năng động. ⭐') : 'Đã bỏ qua báo cáo.');
                loadReports();
            } else alert('Lỗi, thử lại sau.');
        } catch(e){ alert('Lỗi kết nối.'); }
    };

    window.rpInit = loadReports;
})();
