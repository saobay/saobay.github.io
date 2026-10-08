        // ========================================================
        // TRÌNH SOẠN ĐỀ KIỂM TRA (Phase 4, 2026-10-08)
        // - Lọc bank theo môn/khối/bài/chương, bốc câu theo tỉ lệ mức độ
        // - Thang điểm từng dạng, khóa giờ mở, chế độ nghiêm túc (ẩn đáp án)
        // - Lưu đề "đóng băng" + xuất Word / In PDF
        // ========================================================

        let examBuilderState = { questions: [], meta: null };

        function openExamBuilder(){
            let old = document.getElementById('exam-builder-modal');
            if (old) old.remove();
            let modal = document.createElement('div');
            modal.id = 'exam-builder-modal';
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-3';
            modal.innerHTML =
                '<div class="absolute inset-0 bg-black/50" onclick="document.getElementById(\'exam-builder-modal\').remove()"></div>'
                + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">'
                + '<div class="flex items-center justify-between px-5 py-3 border-b bg-amber-600 text-white">'
                + '<h3 class="font-black text-sm"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>Soạn Đề Kiểm Tra Từ Ngân Hàng</h3>'
                + '<button onclick="document.getElementById(\'exam-builder-modal\').remove()" class="text-white/80 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button></div>'
                + '<div class="flex gap-2 px-5 pt-3 text-xs font-bold bg-amber-50/50">'
                + '<button id="exb-mode-bank" onclick="exbSwitchMode(\'bank\')" class="flex-1 px-3 py-2 rounded-lg bg-indigo-700 text-white shadow">Soạn đề từ Ngân hàng đề<br><span class="font-normal opacity-90">(Mỗi học sinh 1 đề)</span></button>'
                + '<button id="exb-mode-fixed" onclick="exbSwitchMode(\'fixed\')" class="flex-1 px-3 py-2 rounded-lg bg-white text-slate-700 border border-slate-300">Soạn đề cố định<br><span class="font-normal opacity-70">(Khóa sẵn bộ câu)</span></button>'
                + '</div>'
                + '<div class="p-5 overflow-y-auto space-y-4 text-sm">'
                + '<div id="exb-pane-bank" class="space-y-4">'
                + '<div class="flex gap-2">'
                + '<button id="exb-sub-mot" onclick="exbSwitchSub(\'mot\')" class="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-700 text-white shadow">Mỗi HS 1 đề cùng ma trận</button>'
                + '<button id="exb-sub-lop" onclick="exbSwitchSub(\'lop\')" class="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300">Cả lớp chung 1 đề</button>'
                + '</div>'
                + '<p id="exb-sub-desc" class="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 leading-relaxed"><i class="fa-solid fa-shuffle mr-1"></i><b>Mỗi HS 1 đề cùng ma trận:</b> file chỉ lưu <b>ma trận</b> — mỗi em mở ra web bốc 1 bộ câu <b>khác nhau</b> nhưng cùng ma trận (cùng vùng kiến thức, số câu, tỉ lệ).</p>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Tên đề</label>'
                + '<input id="exbb-title" value="Luyện tập chương 1" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div class="grid grid-cols-4 gap-2">'
                + '<div><label class="text-[11px] font-bold text-slate-600">Môn</label><input id="exbb-subject" value="TOAN" class="mt-1 w-full text-sm border rounded-lg px-2 py-2 font-bold uppercase"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Khối</label><input id="exbb-grade" type="number" value="10" class="mt-1 w-full text-sm border rounded-lg px-2 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Từ chương</label><input id="exbb-ch-from" type="number" value="1" class="mt-1 w-full text-sm border rounded-lg px-2 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Đến chương</label><input id="exbb-ch-to" type="number" value="1" class="mt-1 w-full text-sm border rounded-lg px-2 py-2 font-bold"></div>'
                + '</div>'
                + '<button onclick="exbLoadMatrix()" class="w-full bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl"><i class="fa-solid fa-table-cells mr-1"></i>Tải ma trận từ ngân hàng</button>'
                + '<div id="exb-matrix"><p class="text-xs text-slate-400 italic">Bấm "Tải ma trận" để xem số câu từng chương trong bank.</p></div>'
                + '<div class="grid grid-cols-3 gap-2">'
                + '<div><label class="text-[11px] font-bold text-blue-900">TN (câu)</label><input id="exbb-n-mcq" type="number" value="8" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-amber-900">Đ/S (câu)</label><input id="exbb-n-tf" type="number" value="2" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-emerald-900">TLN (câu)</label><input id="exbb-n-short" type="number" value="0" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-2 font-bold"></div>'
                + '</div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Tỉ lệ mức độ % — NB / TH / VD / VDC</label>'
                + '<div class="grid grid-cols-4 gap-2 mt-1">'
                + '<input id="exbb-lv-nb" type="number" value="40" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '<input id="exbb-lv-th" type="number" value="30" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '<input id="exbb-lv-vd" type="number" value="20" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '<input id="exbb-lv-vdc" type="number" value="10" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '</div></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Thời gian làm bài (phút, 0 = không tính giờ)</label><input id="exbb-timelimit" type="number" value="0" min="0" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<p class="text-[11px] text-slate-500 bg-slate-50 border rounded-lg px-3 py-2"><i class="fa-solid fa-scale-balanced mr-1"></i><b>Thang điểm Đúng/Sai</b> (áp dụng mọi câu Đ/S): đúng 1/4 ý → <b>0.125</b> • 2/4 → <b>0.25</b> • 3/4 → <b>0.5</b> • 4/4 → <b>1</b> điểm.</p>'
                + '<div id="exb-act-mot" class="flex gap-2">'
                + '<button onclick="exbPreviewSample()" class="flex-1 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-eye mr-1"></i>Xem đề mẫu</button>'
                + '<button onclick="exbBankSave()" class="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Lưu đề</button>'
                + '</div>'
                + '<div id="exb-act-lop" class="hidden flex gap-2">'
                + '<button onclick="exbPickClassExam()" class="flex-1 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-dice mr-1"></i>Bốc đề & xem trước</button>'
                + '<button onclick="exbClassSave()" class="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Lưu đề</button>'
                + '</div>'
                + '<div id="exb-bank-preview" class="border-t pt-3"><p class="text-xs text-slate-400 italic">Tải ma trận rồi xem trước đề.</p></div>'
                + '</div>'

                + '</div>'
                + '<div id="exb-pane-fixed" class="hidden space-y-4">'
                + '<div><label class="text-[11px] font-bold text-slate-600">Tên đề kiểm tra</label>'
                + '<input id="exb-title" value="Kiểm tra 15 phút" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">'
                + '<div><label class="text-[11px] font-bold text-slate-600">Môn</label><input id="exb-subject" value="TOAN" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold uppercase"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Khối</label><input id="exb-grade" type="number" value="10" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Từ bài</label><input id="exb-lesson-from" type="number" value="1" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Đến bài</label><input id="exb-lesson-to" type="number" value="1" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '</div>'
                + '<div class="grid grid-cols-3 gap-3">'
                + '<div class="bg-blue-50 border border-blue-200 rounded-xl p-3"><label class="text-[11px] font-bold text-blue-900">Trắc nghiệm (câu)</label><input id="exb-n-mcq" type="number" value="6" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 font-bold">'
                + '<label class="text-[11px] font-bold text-blue-900 mt-2 block">Điểm/câu</label><input id="exb-s-mcq" type="number" value="0.5" step="0.25" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 font-bold"></div>'
                + '<div class="bg-amber-50 border border-amber-200 rounded-xl p-3"><label class="text-[11px] font-bold text-amber-900">Đúng/Sai (câu)</label><input id="exb-n-truefalse" type="number" value="2" min="0" class="text-sm border rounded-lg px-2 py-1.5 font-bold w-full mt-1">'
                + '<label class="text-[11px] font-bold text-amber-900 mt-2 block">Điểm/câu</label><input id="exb-s-truefalse" type="number" value="1" step="0.25" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 font-bold"></div>'
                + '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><label class="text-[11px] font-bold text-emerald-900">Trả lời ngắn (câu)</label><input id="exb-n-short" type="number" value="2" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 font-bold">'
                + '<label class="text-[11px] font-bold text-emerald-900 mt-2 block">Điểm/câu</label><input id="exb-s-short" type="number" value="1" step="0.25" min="0" class="mt-1 w-full text-sm border rounded-lg px-2 py-1.5 font-bold"></div>'
                + '</div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Tỉ lệ mức độ % — Nhận biết / Thông hiểu / Vận dụng / VD cao</label>'
                + '<div class="grid grid-cols-4 gap-2 mt-1">'
                + '<input id="exb-lv-nb" type="number" value="40" class="text-sm border rounded-lg px-2 py-2 text-center font-bold" title="Nhận biết">'
                + '<input id="exb-lv-th" type="number" value="30" class="text-sm border rounded-lg px-2 py-2 text-center font-bold" title="Thông hiểu">'
                + '<input id="exb-lv-vd" type="number" value="20" class="text-sm border rounded-lg px-2 py-2 text-center font-bold" title="Vận dụng">'
                + '<input id="exb-lv-vdc" type="number" value="10" class="text-sm border rounded-lg px-2 py-2 text-center font-bold" title="Vận dụng cao">'
                + '</div></div>'
                + '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
                + '<div><label class="text-[11px] font-bold text-slate-600">Thời gian làm bài (phút)</label><input id="exb-timelimit" type="number" value="15" min="1" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Mở từ (giờ/ngày)</label><input id="exb-open-from" type="datetime-local" class="mt-1 w-full text-sm border rounded-lg px-3 py-2"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Đóng lúc (giờ/ngày)</label><input id="exb-open-to" type="datetime-local" class="mt-1 w-full text-sm border rounded-lg px-3 py-2"></div>'
                + '</div>'
                + '<label class="flex items-start gap-2 text-[11px] text-slate-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 cursor-pointer">'
                + '<input id="exb-shuffle" type="checkbox" class="mt-0.5">'
                + '<span><b>Trộn thứ tự câu trong từng dạng</b> (đề chung cả lớp: cả lớp cùng bộ câu, mỗi HS mở ra thứ tự TN/Đ-S/TLN được trộn riêng — chống nhìn bài).</span></label>'
                + '<p class="text-[11px] text-slate-500 leading-relaxed"><i class="fa-solid fa-circle-info mr-1"></i>Chế độ <b>nghiêm túc</b>: trong giờ làm bài, học sinh trả lời từng câu <b>không hiện đáp án đúng/sai</b> (chỉ ghi nhận + khóa câu); hết giờ hoặc nộp bài mới hiện đáp án, lời giải và điểm theo thang điểm trên. Để trống giờ mở/đóng = mở tự do.</p>'
                + '</div>'
                + '<div class="flex flex-wrap gap-2">'
                + '<button onclick="examBuilderPreview()" class="flex-1 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-filter mr-1"></i>1. Lọc & Xem trước</button>'
                + '<button onclick="examBuilderSave()" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>2. Lưu đề kiểm tra</button>'
                + '</div>'
                + '<div class="flex flex-wrap gap-2">'
                + '<button onclick="examBuilderExportWord()" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl"><i class="fa-solid fa-file-word mr-1"></i>Xuất Word (.doc)</button>'
                + '<button onclick="examBuilderPrint()" class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl"><i class="fa-solid fa-print mr-1"></i>In đề (PDF)</button>'
                + '</div>'
                + '<div id="exb-preview" class="border-t pt-3"><p class="text-xs text-slate-400 italic">Bấm "Lọc & Xem trước" để bốc câu hỏi từ bank.</p></div>'
                + '</div></div>';
            document.body.appendChild(modal);
        }

        function exbVal(id){ let el = document.getElementById(id); return el ? el.value.trim() : ''; }
        function exbNum(id, def){ let v = parseFloat(exbVal(id)); return (v >= 0 || v < 0) && !isNaN(v) ? v : def; }

        function exbAllocate(groups, count, ratios){
            let totalR = 0;
            ['NB','TH','VD','VDC'].forEach(function(lv){ totalR += (+ratios[lv] || 0); });
            if (!totalR) totalR = 1;
            let picked = [], used = {};
            ['NB','TH','VD','VDC'].forEach(function(lv){
                let want = Math.round(count * ((+ratios[lv] || 0) / totalR));
                let g = groups[lv] || [];
                for (let i = 0; i < want && i < g.length; i++){ picked.push(g[i]); used[g[i].id] = 1; }
            });
            return { picked: picked, used: used };
        }

        function exbShuffle(a){
            for (let i = a.length - 1; i > 0; i--){
                let j = Math.floor(Math.random() * (i + 1));
                let t = a[i]; a[i] = a[j]; a[j] = t;
            }
            return a;
        }

        let exbMode = 'bank';
        function exbSwitchMode(mode){
            exbMode = mode;
            let pb = document.getElementById('exb-pane-bank'), pf = document.getElementById('exb-pane-fixed');
            let mb = document.getElementById('exb-mode-bank'), mf = document.getElementById('exb-mode-fixed');
            if (pb) pb.classList.toggle('hidden', mode !== 'bank');
            if (pf) pf.classList.toggle('hidden', mode !== 'fixed');
            if (mb) mb.className = 'flex-1 px-3 py-2 rounded-lg text-xs font-bold ' + (mode === 'bank' ? 'bg-indigo-700 text-white shadow' : 'bg-white text-slate-700 border border-slate-300');
            if (mf) mf.className = 'flex-1 px-3 py-2 rounded-lg text-xs font-bold ' + (mode === 'fixed' ? 'bg-amber-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-300');
        }

        let exbSub = 'mot'; // 'mot' = moi HS 1 de | 'lop' = ca lop chung 1 de
        let exbBankPool = [];
        let exbClassExam = [];

        function exbSwitchSub(sub){
            exbSub = sub;
            let bm = document.getElementById('exb-sub-mot'), bl = document.getElementById('exb-sub-lop');
            let am = document.getElementById('exb-act-mot'), al = document.getElementById('exb-act-lop');
            let desc = document.getElementById('exb-sub-desc');
            if (bm) bm.className = 'flex-1 px-3 py-2.5 rounded-xl text-xs font-bold ' + (sub === 'mot' ? 'bg-indigo-700 text-white shadow' : 'bg-white text-slate-700 border border-slate-300');
            if (bl) bl.className = 'flex-1 px-3 py-2.5 rounded-xl text-xs font-bold ' + (sub === 'lop' ? 'bg-indigo-700 text-white shadow' : 'bg-white text-slate-700 border border-slate-300');
            if (am) am.classList.toggle('hidden', sub !== 'mot');
            if (al){ al.classList.toggle('hidden', sub !== 'lop'); al.classList.toggle('flex', sub === 'lop'); }
            if (desc) desc.innerHTML = sub === 'mot'
                ? '<i class="fa-solid fa-shuffle mr-1"></i><b>Mỗi HS 1 đề cùng ma trận:</b> file chỉ lưu <b>ma trận</b> — mỗi em mở ra web bốc 1 bộ câu <b>khác nhau</b> nhưng cùng ma trận.'
                : '<i class="fa-solid fa-users mr-1"></i><b>Cả lớp chung 1 đề:</b> bốc <b>1 lần duy nhất</b> từ bank theo ma trận, khóa cứng bộ câu — cả lớp làm cùng 1 đề, thứ tự câu trộn trong từng dạng.';
        }

        function exbBankVal(id){ let el = document.getElementById(id); return el ? el.value.trim() : ''; }
        function exbBankNum(id, def){ let v = parseFloat(exbBankVal(id)); return isNaN(v) ? def : v; }

        // Tai ma tran chuong tu bank
        async function exbLoadMatrix(){
            let mx = document.getElementById('exb-matrix');
            mx.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải bank...</p>';
            try {
                let subject = (exbBankVal('exbb-subject') || 'TOAN').toUpperCase();
                let grade = parseInt(exbBankVal('exbb-grade'), 10) || 10;
                let chFrom = parseInt(exbBankVal('exbb-ch-from'), 10) || 1;
                let chTo = parseInt(exbBankVal('exbb-ch-to'), 10) || chFrom;
                if (chTo < chFrom){ let t = chFrom; chFrom = chTo; chTo = t; }
                let r = await bankApiRead(bankKey(subject, grade));
                if (r.notFound) throw new Error('Chưa có bank ' + subject + ' khối ' + grade + '. Hãy đẩy đề để tạo bank trước.');
                if (r.error) throw new Error(r.error);
                exbBankPool = r.data.questions || [];
                let rows = '';
                for (let c = chFrom; c <= chTo; c++){
                    let n = exbBankPool.filter(function(q){ return q.chapter === c; }).length;
                    rows += '<tr class="border-t"><td class="px-2 py-1.5 font-bold text-slate-700">Chương ' + c + '</td>'
                        + '<td class="px-2 py-1.5 text-slate-500">' + n + ' câu</td>'
                        + '<td class="px-2 py-1.5"><input data-ch="' + c + '" type="number" value="' + n + '" min="0" class="exb-ch-count w-16 text-xs border rounded px-1.5 py-1 text-center font-bold"></td></tr>';
                }
                mx.innerHTML = '<table class="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">'
                    + '<thead><tr class="bg-slate-100 text-slate-600"><th class="px-2 py-1.5 text-left">Vùng kiến thức</th><th class="px-2 py-1.5 text-left">Trong bank</th><th class="px-2 py-1.5 text-left">Số câu lấy</th></tr></thead>'
                    + '<tbody>' + rows + '</tbody></table>'
                    + '<p class="text-[10px] text-slate-400 mt-1">Chỉnh "Số câu lấy" mỗi chương cho đúng ý đồ ma trận.</p>';
            } catch(e){ mx.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>'; }
        }

        // Doc ma tran tu form
        function exbGetMatrix(){
            let chapters = {};
            document.querySelectorAll('.exb-ch-count').forEach(function(el){
                let c = el.getAttribute('data-ch');
                chapters[c] = Math.max(0, parseInt(el.value, 10) || 0);
            });
            // neu chua tai ma tran: lay theo khoang chuong, chia deu
            if (!Object.keys(chapters).length){
                let chFrom = parseInt(exbBankVal('exbb-ch-from'), 10) || 1;
                let chTo = parseInt(exbBankVal('exbb-ch-to'), 10) || chFrom;
                for (let c = Math.min(chFrom, chTo); c <= Math.max(chFrom, chTo); c++) chapters[c] = 9999;
            }
            return {
                subject: (exbBankVal('exbb-subject') || 'TOAN').toUpperCase(),
                grade: parseInt(exbBankVal('exbb-grade'), 10) || 10,
                chapters: chapters,
                types: { mcq: Math.max(0, parseInt(exbBankVal('exbb-n-mcq'), 10) || 0),
                         truefalse: Math.max(0, parseInt(exbBankVal('exbb-n-tf'), 10) || 0),
                         short: Math.max(0, parseInt(exbBankVal('exbb-n-short'), 10) || 0) },
                levels: { NB: exbBankNum('exbb-lv-nb', 25), TH: exbBankNum('exbb-lv-th', 25),
                          VD: exbBankNum('exbb-lv-vd', 25), VDC: exbBankNum('exbb-lv-vdc', 25) },
                time_limit: Math.max(0, exbBankNum('exbb-timelimit', 0))
            };
        }

        // Boc cau theo ma tran: moi chuong -> phan bo theo dang -> phan bo theo muc do
        function exbMatrixPick(pool, matrix){
            let picked = [], used = {};
            let typeTotal = (matrix.types.mcq || 0) + (matrix.types.truefalse || 0) + (matrix.types.short || 0);
            if (!typeTotal) typeTotal = 1;
            let lvTotal = (matrix.levels.NB || 0) + (matrix.levels.TH || 0) + (matrix.levels.VD || 0) + (matrix.levels.VDC || 0);
            if (!lvTotal) lvTotal = 1;
            Object.keys(matrix.chapters).forEach(function(ch){
                let n = matrix.chapters[ch] || 0;
                if (!n) return;
                // 9999 = lay het theo ti le dang
                let cpool = pool.filter(function(q){ return String(q.chapter) === String(ch); });
                if (!cpool.length) return;
                if (n >= 9999) n = cpool.length;
                ['mcq', 'truefalse', 'short'].forEach(function(tp){
                    let want = (matrix.types[tp] || 0) > 0 ? Math.max(1, Math.round(n * ((matrix.types[tp] || 0) / typeTotal))) : 0;
                    let groups = { NB: [], TH: [], VD: [], VDC: [] };
                    cpool.forEach(function(q){ if (q.type === tp && !used[q.id]) (groups[q.level] || groups.NB).push(q); });
                    Object.keys(groups).forEach(function(k){ exbShuffle(groups[k]); });
                    ['NB', 'TH', 'VD', 'VDC'].forEach(function(lv){
                        let w = Math.round(want * ((matrix.levels[lv] || 0) / lvTotal));
                        let g = groups[lv];
                        for (let i = 0; i < w && i < g.length; i++){ picked.push(g[i]); used[g[i].id] = 1; }
                    });
                    let have = picked.filter(function(q){ return q.type === tp && String(q.chapter) === String(ch); }).length;
                    if (have > want){ // cat bot khi lam tron vuot
                        let over = have - want;
                        for (let i = picked.length - 1; i >= 0 && over > 0; i--){
                            if (picked[i].type === tp && String(picked[i].chapter) === String(ch)){
                                delete used[picked[i].id]; picked.splice(i, 1); over--;
                            }
                        }
                        have = want;
                    }
                    if (have < want){
                        let rest = exbShuffle(cpool.filter(function(q){ return q.type === tp && !used[q.id]; }));
                        for (let i = 0; i < (want - have) && i < rest.length; i++){ picked.push(rest[i]); used[rest[i].id] = 1; }
                    }
                });
            });
            let tOrd = { mcq: 0, truefalse: 1, short: 2 };
            picked.sort(function(a, b){ return (tOrd[a.type] == null ? 9 : tOrd[a.type]) - (tOrd[b.type] == null ? 9 : tOrd[b.type]); });
            return picked;
        }

        function exbRenderPicked(picked, label){
            let pv = document.getElementById('exb-bank-preview');
            let badge = { mcq: 'bg-blue-100 text-blue-800', truefalse: 'bg-amber-100 text-amber-800', short: 'bg-emerald-100 text-emerald-800' };
            let tn = { mcq: 'TN', truefalse: 'Đ/S', short: 'TLN' };
            pv.innerHTML = '<div class="flex items-center justify-between mb-2">'
                + '<p class="text-xs font-black text-slate-700">' + label + ': ' + picked.length + ' câu</p></div>'
                + '<div class="space-y-2 max-h-72 overflow-y-auto pr-1">'
                + picked.map(function(q, i){
                    return '<div class="border border-slate-200 rounded-xl p-2.5 bg-white text-[13px]">'
                        + '<p class="font-semibold text-slate-800"><span class="text-slate-400 font-bold mr-1">' + (i+1) + '.</span>'
                        + String(q.q).replace(/</g, '&lt;').slice(0, 160) + '</p>'
                        + '<div class="flex gap-1.5 mt-1.5 text-[10px] font-bold">'
                        + '<span class="px-2 py-0.5 rounded-full ' + (badge[q.type] || 'bg-slate-100') + '">' + (tn[q.type] || q.type) + '</span>'
                        + '<span class="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">' + q.level + '</span>'
                        + '<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">chương ' + q.chapter + '</span>'
                        + '</div></div>';
                }).join('') + '</div>';
        }

        // Moi HS 1 de: xem 1 de mau boc tu bank theo ma tran
        async function exbPreviewSample(){
            let pv = document.getElementById('exb-bank-preview');
            pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang bốc đề mẫu...</p>';
            try {
                let m = exbGetMatrix();
                if (!exbBankPool.length){
                    let r = await bankApiRead(bankKey(m.subject, m.grade));
                    if (r.notFound) throw new Error('Chưa có bank. Bấm "Tải ma trận" trước.');
                    if (r.error) throw new Error(r.error);
                    exbBankPool = r.data.questions || [];
                }
                let picked = exbMatrixPick(exbBankPool, m);
                if (!picked.length) throw new Error('Không bốc được câu nào — kiểm tra ma trận.');
                exbRenderPicked(picked, 'Đề mẫu (mỗi HS sẽ bốc 1 đề khác cùng ma trận)');
            } catch(e){ pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>'; }
        }

        // Moi HS 1 de: luu file cau noi chua ma tran
        async function exbBankSave(){
            try {
                let m = exbGetMatrix();
                let title = exbBankVal('exbb-title') || ('Luyện tập ' + m.subject + ' ' + m.grade);
                let safeTitle = title.replace(/[<>&"]/g, '');
                let cfg = { subject: m.subject, grade: m.grade, matrix: m.chapters,
                            types: m.types, levels: m.levels, time_limit: m.time_limit };
                let inner = '<div class="saobay-bank-view"></div>\n'
                    + '<script type="application/json" class="saobay-bank-config">\n' + JSON.stringify(cfg) + '\n<\/script>';
                let page = bankWrapPage(safeTitle, 'Bài tập', inner);
                let folder = (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : 'data';
                let asciiBase = (typeof removeVietnameseTones === 'function' ? removeVietnameseTones(title) : title)
                    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 40);
                let path = folder + '/' + m.subject + '_' + m.grade + '_' + asciiBase + '_Bai_tap_none.html';
                await bankPushFile(path, page, 'Bank exam (moi HS 1 de): ' + safeTitle + ' [' + folder + ']');
                document.getElementById('exam-builder-modal').remove();
                if (typeof showToast === 'function') showToast('Đã lưu đề (mỗi HS 1 đề): ' + path, 'success');
                else alert('Đã lưu đề: ' + path);
                if (typeof loadFolderTreeFromGit === 'function') loadFolderTreeFromGit();
            } catch(e){ alert('Lỗi lưu đề: ' + (e.message || e)); }
        }

        // Ca lop chung 1 de: boc 1 lan, xem truoc day du
        async function exbPickClassExam(){
            let pv = document.getElementById('exb-bank-preview');
            pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang bốc đề...</p>';
            try {
                let m = exbGetMatrix();
                if (!exbBankPool.length){
                    let r = await bankApiRead(bankKey(m.subject, m.grade));
                    if (r.notFound) throw new Error('Chưa có bank. Bấm "Tải ma trận" trước.');
                    if (r.error) throw new Error(r.error);
                    exbBankPool = r.data.questions || [];
                }
                exbClassExam = exbMatrixPick(exbBankPool, m);
                if (!exbClassExam.length) throw new Error('Không bốc được câu nào — kiểm tra ma trận.');
                exbClassExam._matrix = m;
                exbRenderPicked(exbClassExam, 'Đề chung cả lớp (xem trước đầy đủ — bấm "Bốc đề & xem trước" để bốc bộ khác)');
            } catch(e){ pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>'; }
        }

        // Ca lop chung 1 de: luu de dong bang (khoa cung bo cau)
        async function exbClassSave(){
            try {
                if (!exbClassExam.length){ alert('Hãy bấm "Bốc đề & xem trước" trước khi lưu.'); return; }
                let m = exbClassExam._matrix || exbGetMatrix();
                let title = exbBankVal('exbb-title') || ('Đề chung ' + m.subject + ' ' + m.grade);
                let safeTitle = title.replace(/[<>&"]/g, '');
                let examJson = {
                    frozen_bank_exam: true,
                    shuffle_within_type: true,
                    time_limit: m.time_limit || 0,
                    meta: { title: safeTitle, subject: m.subject, grade: m.grade },
                    sets: [{ name: safeTitle, questions: exbClassExam.map(function(q){
                        return { type: q.type, level: q.level, q: q.q, options: q.options || [],
                                 statements: q.statements || [], answer: q.answer, explain: q.explain || '' };
                    }) }]
                };
                let inner = '<div class="saobay-exam10">\n'
                    + '<script type="application/json" class="saobay-exam10-data">\n' + JSON.stringify(examJson) + '\n<\/script>\n</div>\n'
                    + '<p class="text-xs text-slate-500 mt-2">Đề chung cả lớp: cùng bộ câu hỏi, thứ tự câu trộn trong từng dạng.</p>';
                let page = bankWrapPage(safeTitle, 'Bài kiểm tra', inner);
                let folder = (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : 'data';
                let asciiBase = (typeof removeVietnameseTones === 'function' ? removeVietnameseTones(title) : title)
                    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 40);
                let path = folder + '/' + m.subject + '_' + m.grade + '_' + asciiBase + '_Kiem_tra_none.html';
                await bankPushFile(path, page, 'Class exam (chung 1 de): ' + safeTitle + ' [' + folder + ']');
                document.getElementById('exam-builder-modal').remove();
                if (typeof showToast === 'function') showToast('Đã lưu đề chung cả lớp: ' + path, 'success');
                else alert('Đã lưu đề: ' + path);
                if (typeof loadFolderTreeFromGit === 'function') loadFolderTreeFromGit();
            } catch(e){ alert('Lỗi lưu đề: ' + (e.message || e)); }
        }

        async function examBuilderPreview(){
            let pv = document.getElementById('exb-preview');
            pv.innerHTML = '<p class=\"text-xs text-slate-400 italic\"><i class=\"fa-solid fa-spinner fa-spin mr-2\"></i>Đang lọc bank...</p>';
            try {
                let subject = (exbVal('exb-subject') || 'TOAN').toUpperCase();
                let grade = parseInt(exbVal('exb-grade'), 10) || 10;
                let lFrom = parseInt(exbVal('exb-lesson-from'), 10) || 0;
                let lTo = parseInt(exbVal('exb-lesson-to'), 10) || 999;
                let ratios = { NB: exbNum('exb-lv-nb', 25), TH: exbNum('exb-lv-th', 25), VD: exbNum('exb-lv-vd', 25), VDC: exbNum('exb-lv-vdc', 25) };
                let r = await bankApiRead(bankKey(subject, grade));
                if (r.notFound) throw new Error('Chưa có bank ' + subject + ' khối ' + grade);
                if (r.error) throw new Error(r.error);
                let pool = (r.data.questions || []).filter(function(q){ return q.lesson >= lFrom && q.lesson <= lTo; });
                if (!pool.length) throw new Error('Không có câu nào trong khoảng bài ' + lFrom + '\u2013' + lTo);

                let scoring = { mcq: exbNum('exb-s-mcq', 1), truefalse: exbNum('exb-s-truefalse', 1), short: exbNum('exb-s-short', 1) };
                let want = { mcq: Math.max(0, parseInt(exbVal('exb-n-mcq'), 10) || 0),
                             truefalse: Math.max(0, parseInt(exbVal('exb-n-truefalse'), 10) || 0),
                             short: Math.max(0, parseInt(exbVal('exb-n-short'), 10) || 0) };
                let picked = [], usedAll = {};
                ['mcq','truefalse','short'].forEach(function(tp){
                    if (!want[tp]) return;
                    let groups = { NB: [], TH: [], VD: [], VDC: [] };
                    pool.forEach(function(q){ if (q.type === tp && !usedAll[q.id]) (groups[q.level] || groups.NB).push(q); });
                    Object.keys(groups).forEach(function(k){ exbShuffle(groups[k]); });
                    let al = exbAllocate(groups, want[tp], ratios);
                    al.picked.forEach(function(q){ usedAll[q.id] = 1; });
                    // bù thiếu từ cùng dạng (mức độ khác)
                    if (al.picked.length < want[tp]){
                        let rest = exbShuffle(pool.filter(function(q){ return q.type === tp && !usedAll[q.id]; }));
                        while (al.picked.length < want[tp] && rest.length){ let q = rest.pop(); al.picked.push(q); usedAll[q.id] = 1; }
                    }
                    picked = picked.concat(al.picked);
                });
                exbShuffle(picked);

         let totalScore = picked.reduce(function(s, q){ return s + (scoring[q.type] || 0); }, 0);

                examBuilderState.questions = picked;
                examBuilderState.meta = {
                    title: exbVal('exb-title') || 'Đề kiểm tra', subject: subject, grade: grade,
                    lessonFrom: lFrom, lessonTo: lTo, scoring: scoring,
                    timeLimit: Math.max(1, parseInt(exbVal('exb-timelimit'), 10) || 15),
                    openFrom: exbVal('exb-open-from'), openTo: exbVal('exb-open-to'),
                    totalScore: Math.round(totalScore * 100) / 100
                };
                let badge = { mcq: 'bg-blue-100 text-blue-800', truefalse: 'bg-amber-100 text-amber-800', short: 'bg-emerald-100 text-emerald-800' };
                pv.innerHTML = '<div class="flex items-center justify-between mb-2">'
                    + '<p class="text-xs font-black text-slate-700">Đã bốc ' + picked.length + ' câu • Tổng điểm: ' + examBuilderState.meta.totalScore + '</p>'
                    + '<button onclick="examBuilderPreview()" class="text-[11px] text-indigo-600 hover:underline font-bold"><i class="fa-solid fa-dice mr-1"></i>Bốc lại</button></div>'
                    + '<div class="space-y-2 max-h-72 overflow-y-auto pr-1">'
                    + picked.map(function(q, i){
                        return '<div class="border border-slate-200 rounded-xl p-2.5 bg-white text-[13px]">'
                            + '<p class="font-semibold text-slate-800"><span class="text-slate-400 font-bold mr-1">' + (i+1) + '.</span>'
                            + String(q.q).replace(/</g, '&lt;').slice(0, 160) + '</p>'
                            + '<div class="flex gap-1.5 mt-1.5 text-[10px] font-bold">'
                            + '<span class="px-2 py-0.5 rounded-full ' + (badge[q.type] || 'bg-slate-100') + '">' + q.type + '</span>'
                            + '<span class="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">' + q.level + '</span>'
                            + '<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">' + (scoring[q.type] || 0) + 'đ • bài ' + q.lesson + '</span>'
                            + '</div></div>';
                    }).join('') + '</div>';
            } catch(e){ pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>'; }
        }

        function examBuilderExamJson(){
            let st = examBuilderState;
            if (!st.questions.length){ alert('Hãy bấm "Lọc & Xem trước" trước khi lưu đề.'); return null; }
            let m = st.meta;
            let shufEl = document.getElementById('exb-shuffle');
            return {
                exam_strict: true,
                shuffle_within_type: !!(shufEl && shufEl.checked),
                open_from: m.openFrom || '',
                open_to: m.openTo || '',
                time_limit: m.timeLimit,
                scoring: m.scoring,
                meta: { title: m.title, subject: m.subject, grade: m.grade, total: m.totalScore },
                sets: [{
                    name: m.title,
                    questions: st.questions.map(function(q){
                        return { type: q.type, level: q.level, q: q.q, options: q.options || [],
                                 statements: q.statements || [], answer: q.answer, explain: q.explain || '' };
                    })
                }]
            };
        }

        async function examBuilderSave(){
            try {
                let examJson = examBuilderExamJson();
                if (!examJson) return;
                let st = examBuilderState, m = st.meta;
                let inner = '<div class="saobay-exam10">\n'
                    + '<script type="application/json" class="saobay-exam10-data">\n' + JSON.stringify(examJson) + '\n<\/script>\n</div>\n'
                    + '<p class="text-xs text-slate-500 mt-2"><i class="fa-solid fa-lock mr-1"></i>Đề kiểm tra nghiêm túc: trong giờ làm bài không hiện đáp án; hết giờ/nộp bài mới chấm điểm.</p>';
                let safeTitle = (m.subject + ' ' + m.grade + ' - ' + m.title).replace(/[<>&"]/g, '');
                let page = bankWrapPage(safeTitle, 'Bài kiểm tra', inner);
                let folder = (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : 'data';
                let asciiBase = (typeof removeVietnameseTones === 'function' ? removeVietnameseTones(m.title) : m.title)
                    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 40);
                let path = folder + '/' + m.subject + '_' + m.grade + '_KIEM_TRA_' + asciiBase + '_Kiem_tra_none.html';
                await bankPushFile(path, page, 'Exam: ' + safeTitle + ' [' + folder + ']');
                document.getElementById('exam-builder-modal').remove();
                if (typeof showToast === 'function') showToast('Đã lưu đề kiểm tra: ' + path, 'success');
                else alert('Đã lưu đề kiểm tra: ' + path);
                if (typeof loadFolderTreeFromGit === 'function') loadFolderTreeFromGit();
            } catch(e){ alert('Lỗi lưu đề: ' + (e.message || e)); }
        }

        function exbEsc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

        function examBuilderWordHtml(){
            let st = examBuilderState;
            if (!st.questions.length){ alert('Hãy bấm "Lọc & Xem trước" trước.'); return null; }
            let m = st.meta;
            let h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">'
                + '<title>' + exbEsc(m.title) + '</title></head><body style="font-family:Times New Roman,serif;">'
                + '<h2 style="text-align:center;">' + exbEsc(m.subject + ' ' + m.grade + ' — ' + m.title) + '</h2>'
                + '<p style="text-align:center;">Thời gian: ' + m.timeLimit + ' phút • Tổng điểm: ' + m.totalScore
                + (m.openFrom ? ' • Mở từ: ' + exbEsc(m.openFrom.replace('T',' ')) : '') + '</p>'
                + '<p>Họ tên: ............................ Lớp: ..........</p><hr>';
            st.questions.forEach(function(q, i){
                h += '<p><b>Câu ' + (i+1) + ' (' + (m.scoring[q.type] || 0) + 'đ):</b> ' + exbEsc(q.q) + '</p>';
                if (q.type === 'mcq' && q.options) q.options.forEach(function(op){ h += '<p style="margin-left:24px;">' + exbEsc(op) + '</p>'; });
                if (q.type === 'truefalse' && q.statements) q.statements.forEach(function(s2, si){
                    h += '<p style="margin-left:24px;">' + String.fromCharCode(97+si) + ') ' + exbEsc(s2) + ' — Đúng / Sai</p>';
                });
                if (q.type === 'short') h += '<p style="margin-left:24px;">Trả lời: ....................</p>';
            });
            h += '<hr><h3>ĐÁP ÁN (dành cho giáo viên)</h3>';
            st.questions.forEach(function(q, i){
                let a = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
                h += '<p>Câu ' + (i+1) + ': <b>' + exbEsc(a) + '</b></p>';
            });
            h += '</body></html>';
            return h;
        }

        function examBuilderExportWord(){
            let h = examBuilderWordHtml();
            if (!h) return;
            let blob = new Blob(['﻿', h], { type: 'application/msword' });
            let a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'de-kiem-tra-' + Date.now() + '.doc';
            document.body.appendChild(a); a.click();
            setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
        }

        function examBuilderPrint(){
            let h = examBuilderWordHtml();
            if (!h) return;
            let w = window.open('', '_blank');
            if (!w){ alert('Trình duyệt chặn popup. Hãy cho phép popup rồi thử lại.'); return; }
            w.document.write(h.replace('<body', '<body onload="setTimeout(function(){window.print()},400)"'));
            w.document.close();
        }
