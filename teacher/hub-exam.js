        // ========================================================
        // TRÌNH SOẠN ĐỀ KIỂM TRA (Phase 4, 2026-10-08)

        // Gop nhieu bo de roi rac thanh 1 file 10 bo (2026-10-08)
        function mergeExamSets(){
            let statusEl = document.getElementById('merge-sets-status');
            let setStatus = function(msg, ok){ if (statusEl){ statusEl.textContent = msg; statusEl.className = 'text-[11px] font-bold ' + (ok ? 'text-emerald-700' : 'text-rose-600'); } };
            try {
                let raw = document.getElementById('merge-sets-input').value || '';
                if (!raw.trim()){ setStatus('Hãy dán nội dung AI trả về vào ô trên.', false); return; }
                // Tach cac object {"name":"Đề N","questions":[...]} bang dem ngoac nhon
                let sets = [];
                let re = /"name"\s*:\s*"((?:Đề|De)\s*\d+)"/gi;
                let m;
                while ((m = re.exec(raw)) !== null){
                    let nameStart = m.index;
                    // Tim dau { mo object chua "name" nay (lui lai)
                    let objStart = raw.lastIndexOf('{', nameStart);
                    if (objStart < 0) continue;
                    // Dem ngoac de tim dau } dong
                    let depth = 0, inStr = false, esc = false, i;
                    for (i = objStart; i < raw.length; i++){
                        let ch = raw[i];
                        if (inStr){
                            if (esc) esc = false;
                            else if (ch === '\\') esc = true;
                            else if (ch === '"') inStr = false;
                        } else {
                            if (ch === '"') inStr = true;
                            else if (ch === '{') depth++;
                            else if (ch === '}'){ depth--; if (depth === 0) break; }
                        }
                    }
                    if (depth !== 0) continue;
                    let objStr = raw.substring(objStart, i + 1);
                    try {
                        let obj = JSON.parse(objStr);
                        if (obj && obj.name && Array.isArray(obj.questions) && obj.questions.length){
                            sets.push(obj);
                        }
                    } catch(e){}
                }
                if (!sets.length){ setStatus('Không tìm thấy bộ đề nào. Hãy dán đúng khối AI trả về.', false); return; }
                // Loai trung theo ten, giu cai dau tien
                let seen = {}, uniq = [];
                sets.forEach(function(st){
                    let key = String(st.name).replace(/\s+/g, ' ').trim().toLowerCase();
                    if (!seen[key]){ seen[key] = 1; uniq.push(st); }
                });
                // Sap xep theo so de
                uniq.sort(function(a, b){
                    let na = parseInt(String(a.name).replace(/\D/g, ''), 10) || 0;
                    let nb = parseInt(String(b.name).replace(/\D/g, ''), 10) || 0;
                    return na - nb;
                });
                // Danh lai ten cho chuan
                uniq.forEach(function(st, i){ st.name = 'Đề ' + (i + 1); });
                let finalHtml = '<div class="saobay-exam10">\n<script type="application/json" class="saobay-exam10-data">\n'
                    + JSON.stringify({ sets: uniq }) + '\n<\/script>\n</div>';
                let editor = document.getElementById('item-content');
                if (editor){
                    editor.value = finalHtml;
                    if (typeof renderMathPreview === 'function') renderMathPreview();
                    if (typeof updateScorePreview === 'function') updateScorePreview();
                }
                let totalQ = uniq.reduce(function(s2, st){ return s2 + st.questions.length; }, 0);
                setStatus('Đã gộp ' + uniq.length + ' bộ đề (' + totalQ + ' câu) vào khung soạn thảo bên dưới!', true);
                if (typeof showToast === 'function') showToast('Đã gộp ' + uniq.length + ' bộ đề!', 'success');
            } catch(e){
                setStatus('Lỗi: ' + (e.message || e), false);
            }
        }

        // - Lọc bank theo môn/khối/bài/chương, bốc câu theo tỉ lệ mức độ
        // - Thang điểm từng dạng, khóa giờ mở, chế độ nghiêm túc (ẩn đáp án)
        // - Lưu đề "đóng băng" + xuất Word / In PDF
        // ========================================================

        let examBuilderState = { questions: [], meta: null };

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
        function exbSourceApproved(src){
            let fn = String(src || '');
            let slash = fn.lastIndexOf('/');
            if (slash >= 0) fn = fn.substring(slash + 1);
            fn = fn.replace(/\.html$/i, '');
            if (/_id\d+|_gv\w+/i.test(fn)) return true;
            if (/^unit\d+|^test\d+/i.test(fn)) return true;
            return false;
        }
        function exbApplyApprovedFilter(questions){
            let cb = document.getElementById('exbb-only-approved');
            let onlyApproved = !cb || cb.checked;
            if (!onlyApproved) return questions;
            return (questions || []).filter(function(q){ return exbSourceApproved(q.source); });
        }
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
                exbBankPool = exbApplyApprovedFilter(r.data.questions || []);
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
            } catch(e){
                let msg = String(e.message || e);
                if (msg === 'no-token') msg = 'Chưa có token GitHub — hãy đăng nhập GitHub rồi đẩy 1 bài bất kỳ bằng form chính trước (để lưu token), sau đó bấm lại "Tải ma trận".';
                mx.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + msg.replace(/</g,'&lt;') + '</p>';
            }
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
                         short: Math.max(0, parseInt(exbBankVal('exbb-n-short'), 10) || 0),
                         essay: Math.max(0, parseInt(exbBankVal('exbb-n-essay'), 10) || 0),
                         listening: Math.max(0, parseInt(exbBankVal('exbb-n-listening'), 10) || 0),
                         speaking: Math.max(0, parseInt(exbBankVal('exbb-n-speaking'), 10) || 0),
                         matching: Math.max(0, parseInt(exbBankVal('exbb-n-matching'), 10) || 0),
                         ordering: Math.max(0, parseInt(exbBankVal('exbb-n-ordering'), 10) || 0) },
                scores: { mcq: exbBankNum('exbb-s-mcq', 0.25), truefalse: exbBankNum('exbb-s-tf', 1),
                          short: exbBankNum('exbb-s-short', 0.5), essay: exbBankNum('exbb-s-essay', 0),
                          listening: exbBankNum('exbb-s-listening', 1), speaking: exbBankNum('exbb-s-speaking', 1),
                          matching: exbBankNum('exbb-s-matching', 1), ordering: exbBankNum('exbb-s-ordering', 1) },
                levels: { NB: exbBankNum('exbb-lv-nb', 25), TH: exbBankNum('exbb-lv-th', 25),
                          VD: exbBankNum('exbb-lv-vd', 25), VDC: exbBankNum('exbb-lv-vdc', 25) },
                time_limit: Math.max(0, exbBankNum('exbb-timelimit', 0))
            };
        }

        // Boc cau theo ma tran: moi chuong -> phan bo theo dang -> phan bo theo muc do
        function exbMatrixPick(pool, matrix){
            let picked = [], used = {};
            let typeTotal = (matrix.types.mcq || 0) + (matrix.types.truefalse || 0) + (matrix.types.short || 0) + (matrix.types.essay || 0);
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
                ['mcq', 'truefalse', 'short', 'essay'].forEach(function(tp){
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
            let tOrd = { mcq: 0, truefalse: 1, short: 2, essay: 3 };
            picked.sort(function(a, b){ return (tOrd[a.type] == null ? 9 : tOrd[a.type]) - (tOrd[b.type] == null ? 9 : tOrd[b.type]); });
            return picked;
        }

        // Re-render MathJax cho nội dung preview inject động (2026-10-09)
        function exbTypesetMath(el){
            try {
                if (window.MathJax && window.MathJax.typesetPromise){
                    let target = el || document.getElementById('exb-bank-preview') || document.getElementById('exb-preview');
                    if (target) window.MathJax.typesetPromise([target]).catch(function(){});
                }
            } catch(e){}
        }

        function exbRenderPicked(picked, label){
            let pv = document.getElementById('exb-bank-preview');
            let badge = { mcq: 'bg-blue-100 text-blue-800', truefalse: 'bg-amber-100 text-amber-800', short: 'bg-emerald-100 text-emerald-800', essay: 'bg-violet-100 text-violet-800' };
            let tn = { mcq: 'TN', truefalse: 'Đ/S', short: 'TLN', essay: 'Tự luận' };
            pv.innerHTML = '<div class="flex items-center justify-between mb-2">'
                + '<p class="text-xs font-black text-slate-700">' + label + ': ' + picked.length + ' câu</p></div>'
                + '<div class="space-y-2 max-h-96 overflow-y-auto pr-1">'
                + picked.map(function(q, i){
                    let h = '<div class="border border-slate-200 rounded-xl p-2.5 bg-white text-[13px]">'
                        + '<p class="font-semibold text-slate-800"><span class="text-slate-400 font-bold mr-1">' + (i+1) + '.</span>'
                        + String(q.q).replace(/</g, '&lt;') + '</p>';
                    if (q.options && q.options.length){
                        h += '<div class="mt-1.5 space-y-0.5">' + q.options.map(function(op){
                            return '<p class="text-[12px] text-slate-600 pl-4">' + String(op).replace(/</g, '&lt;') + '</p>';
                        }).join('') + '</div>';
                    }
                    if (q.statements && q.statements.length){
                        h += '<div class="mt-1.5 space-y-0.5">' + q.statements.map(function(st, si){
                            return '<p class="text-[12px] text-slate-600 pl-4"><b>' + 'abcd'[si] + ')</b> '
                                + String(st.s != null ? st.s : st).replace(/</g, '&lt;') + '</p>';
                        }).join('') + '</div>';
                    }
                    if (q.answer){
                        h += '<p class="mt-1.5 text-[12px] font-bold text-emerald-700">Đáp án: '
                            + String(q.answer).replace(/</g, '&lt;') + '</p>';
                    }
                    if (q.explain){
                        h += '<p class="mt-1 text-[12px] text-slate-500"><b>Hướng dẫn:</b> '
                            + String(q.explain).replace(/</g, '&lt;') + '</p>';
                    }
                    h += '<div class="flex gap-1.5 mt-1.5 text-[10px] font-bold">'
                        + '<span class="px-2 py-0.5 rounded-full ' + (badge[q.type] || 'bg-slate-100') + '">' + (tn[q.type] || q.type) + '</span>'
                        + '<span class="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">' + q.level + '</span>'
                        + '<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">chương ' + q.chapter + '</span>'
                        + '</div></div>';
                    return h;
                }).join('') + '</div>';
            exbTypesetMath(pv);
        }

        // Day de tu bank ra khung soan (2026-10-10): boc cau theo ma tran -> dua vao WYSIWYG de xem/sua roi moi day cho HS
        async function exbPushToComposer(){
            try {
                let m = exbGetMatrix();
                if (!exbBankPool.length){
                    let r = await bankApiRead(bankKey(m.subject, m.grade));
                    if (r.notFound) throw new Error('Chưa có bank. Bấm "Tải ma trận" trước.');
                    if (r.error) throw new Error(r.error);
                    exbBankPool = exbApplyApprovedFilter(r.data.questions || []);
                }
                let picked = exbMatrixPick(exbBankPool, m);
                if (!picked.length) throw new Error('Không bốc được câu nào — kiểm tra ma trận.');
                let examJson = { time_limit: m.time_limit || 0, sets: [{ name: 'Đề', questions: picked.map(function(q){
                    let o = { type: q.type, level: q.level, q: q.q, options: q.options || [],
                             statements: q.statements || [], answer: q.answer, explain: q.explain || '' };
                    if (q.img) o.img = q.img;
                    return o;
                }) }] };
                let frag = '<div class="saobay-exam10">\n'
                    + '<script type="application/json" class="saobay-exam10-data">\n' + JSON.stringify(examJson) + '\n<\/script>\n</div>';
                let ta = document.getElementById('item-content');
                if (!ta){ alert('Không tìm thấy khung soạn thảo.'); return; }
                ta.value = frag;
                if (typeof renderMathPreview === 'function'){ try { renderMathPreview(); } catch(e){} }
                // Cuộn xuống khung soạn để user xem ngay
                let pw = document.getElementById('preview-wrapper');
                if (pw) pw.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (typeof showToast === 'function') showToast('Đã đẩy ' + picked.length + ' câu ra khung soạn. Xem/sửa rồi bấm Đẩy bài.', 'success');
            } catch(e){
                if (typeof showToast === 'function') showToast('Lỗi: ' + (e.message || e), 'error');
                else alert('Lỗi: ' + (e.message || e));
            }
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
                    exbBankPool = exbApplyApprovedFilter(r.data.questions || []);
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
                            types: m.types, levels: m.levels, time_limit: m.time_limit,
                            scoring: m.scores };
                let inner = '<div class="saobay-bank-view"></div>\n'
                    + '<script type="application/json" class="saobay-bank-config">\n' + JSON.stringify(cfg) + '\n<\/script>';
                let page = bankWrapPage(safeTitle, 'Bài tập', inner);
                let folder = (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : '';
                if (!folder) { alert('Vui lòng chọn thư mục trong cùng ở cây thư mục bên trái trước khi lưu đề!'); return; }
                if ((typeof folderHasChildren === 'function') && folderHasChildren(folder)) { alert('Vui lòng chọn thư mục trong cùng (không có thư mục con)!'); return; }
                let asciiBase = (typeof removeVietnameseTones === 'function' ? removeVietnameseTones(title) : title)
                    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 40);
                let path = folder + '/' + m.subject + '_' + m.grade + '_' + asciiBase + '_Bai_tap_none.html';
                await bankPushFile(path, page, 'Bank exam (moi HS 1 de): ' + safeTitle + ' [' + folder + ']');
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
                    exbBankPool = exbApplyApprovedFilter(r.data.questions || []);
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
                    scoring: m.scores || {},
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
                let folder = (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : '';
                if (!folder) { alert('Vui lòng chọn thư mục trong cùng ở cây thư mục bên trái trước khi lưu đề!'); return; }
                if ((typeof folderHasChildren === 'function') && folderHasChildren(folder)) { alert('Vui lòng chọn thư mục trong cùng (không có thư mục con)!'); return; }
                let asciiBase = (typeof removeVietnameseTones === 'function' ? removeVietnameseTones(title) : title)
                    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 40);
                let path = folder + '/' + m.subject + '_' + m.grade + '_' + asciiBase + '_Kiem_tra_none.html';
                await bankPushFile(path, page, 'Class exam (chung 1 de): ' + safeTitle + ' [' + folder + ']');
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
                exbTypesetMath(pv);
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
                let folder = (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : '';
                if (!folder) { alert('Vui lòng chọn thư mục trong cùng ở cây thư mục bên trái trước khi lưu đề!'); return; }
                if ((typeof folderHasChildren === 'function') && folderHasChildren(folder)) { alert('Vui lòng chọn thư mục trong cùng (không có thư mục con)!'); return; }
                let asciiBase = (typeof removeVietnameseTones === 'function' ? removeVietnameseTones(m.title) : m.title)
                    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 40);
                let path = folder + '/' + m.subject + '_' + m.grade + '_KIEM_TRA_' + asciiBase + '_Kiem_tra_none.html';
                await bankPushFile(path, page, 'Exam: ' + safeTitle + ' [' + folder + ']');
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
