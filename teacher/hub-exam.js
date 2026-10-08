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
                + '<p class="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 leading-relaxed"><i class="fa-solid fa-shuffle mr-1"></i><b>Mỗi học sinh 1 đề:</b> file đẩy lên chỉ chứa cấu hình — mỗi em mở ra web <b>bốc ngẫu nhiên</b> một bộ câu khác nhau từ ngân hàng theo đúng tỉ lệ bên dưới.</p>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Tên đề</label>'
                + '<input id="exbb-title" value="Luyện tập chương 1" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div class="grid grid-cols-3 gap-3">'
                + '<div><label class="text-[11px] font-bold text-slate-600">Môn</label><input id="exbb-subject" value="TOAN" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold uppercase"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Khối</label><input id="exbb-grade" type="number" value="10" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Chương</label><input id="exbb-chapter" type="number" value="1" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '</div>'
                + '<div class="grid grid-cols-2 gap-3">'
                + '<div><label class="text-[11px] font-bold text-slate-600">Số câu mỗi lượt bốc</label><input id="exbb-count" type="number" value="10" min="1" max="50" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Thời gian (phút, 0 = không tính giờ)</label><input id="exbb-timelimit" type="number" value="0" min="0" class="mt-1 w-full text-sm border rounded-lg px-3 py-2 font-bold"></div>'
                + '</div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Dạng câu</label><div class="flex gap-4 mt-1 text-xs font-semibold">'
                + '<label><input type="checkbox" class="exbb-type" value="mcq" checked> Trắc nghiệm</label>'
                + '<label><input type="checkbox" class="exbb-type" value="truefalse" checked> Đúng/Sai</label>'
                + '<label><input type="checkbox" class="exbb-type" value="short" checked> Trả lời ngắn</label>'
                + '</div></div>'
                + '<div><label class="text-[11px] font-bold text-slate-600">Tỉ lệ mức độ % — NB / TH / VD / VDC</label>'
                + '<div class="grid grid-cols-4 gap-2 mt-1">'
                + '<input id="exbb-lv-nb" type="number" value="40" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '<input id="exbb-lv-th" type="number" value="30" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '<input id="exbb-lv-vd" type="number" value="20" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '<input id="exbb-lv-vdc" type="number" value="10" class="text-sm border rounded-lg px-2 py-2 text-center font-bold">'
                + '</div></div>'
                + '<button onclick="exbBankSave()" class="w-full bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-3 rounded-xl"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Lưu đề (mỗi HS 1 đề)</button>'
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

        function exbBankVal(id){ let el = document.getElementById(id); return el ? el.value.trim() : ''; }

        // Luu de "Moi HS 1 de": file cau noi boc ngau nhien tu bank moi lan mo
        async function exbBankSave(){
            try {
                let subject = (exbBankVal('exbb-subject') || 'TOAN').toUpperCase();
                let grade = parseInt(exbBankVal('exbb-grade'), 10) || 10;
                let types = Array.prototype.slice.call(document.querySelectorAll('.exbb-type:checked')).map(function(c){ return c.value; });
                if (!types.length){ alert('Chọn ít nhất 1 dạng câu.'); return; }
                let cfg = {
                    subject: subject, grade: grade,
                    chapter: parseInt(exbBankVal('exbb-chapter'), 10) || 1,
                    count: Math.min(50, Math.max(1, parseInt(exbBankVal('exbb-count'), 10) || 10)),
                    types: types,
                    levels: { NB: parseFloat(exbBankVal('exbb-lv-nb')) || 0, TH: parseFloat(exbBankVal('exbb-lv-th')) || 0,
                              VD: parseFloat(exbBankVal('exbb-lv-vd')) || 0, VDC: parseFloat(exbBankVal('exbb-lv-vdc')) || 0 },
                    time_limit: Math.max(0, parseFloat(exbBankVal('exbb-timelimit')) || 0)
                };
                let title = exbBankVal('exbb-title') || ('Luyện tập ' + subject + ' ' + grade);
                let safeTitle = title.replace(/[<>&"]/g, '');
                let inner = '<div class="saobay-bank-view"></div>\n'
                    + '<script type="application/json" class="saobay-bank-config">\n' + JSON.stringify(cfg) + '\n<\/script>';
                let page = bankWrapPage(safeTitle, 'Bài tập', inner);
                let folder = (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : 'data';
                let asciiBase = (typeof removeVietnameseTones === 'function' ? removeVietnameseTones(title) : title)
                    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 40);
                let path = folder + '/' + subject + '_' + grade + '_' + asciiBase + '_Bai_tap_none.html';
                await bankPushFile(path, page, 'Bank exam (moi HS 1 de): ' + safeTitle + ' [' + folder + ']');
                document.getElementById('exam-builder-modal').remove();
                if (typeof showToast === 'function') showToast('Đã lưu đề (mỗi HS 1 đề): ' + path, 'success');
                else alert('Đã lưu đề: ' + path);
                if (typeof loadFolderTreeFromGit === 'function') loadFolderTreeFromGit();
            } catch(e){ alert('Lỗi lưu đề: ' + (e.message || e)); }
        }

        async function examBuilderPreview(){
            let pv = document.getElementById('exb-preview');
            pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang lọc bank...</p>';
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
                if (!pool.length) throw new Error('Không có câu nào trong khoảng bài ' + lFrom + '–' + lTo);

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
