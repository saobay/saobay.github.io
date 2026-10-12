        // ========================================================
        // 4 CHẾ ĐỘ ĐẨY: Lý thuyết / Bài tập / Soạn đề từ bank / Đẩy trực tiếp (2026-10-10: tách Bài tập thành luồng riêng)
        // ========================================================
        let currentPushTab = 'theory'; // 'theory' | 'exercise' | 'bank' | 'direct'

        function switchPushMode(mode) {
            currentPushTab = mode;
            let isTheory = (mode === 'theory');
            let isExercise = (mode === 'exercise');
            let isBank = (mode === 'bank');
            let isDirect = (mode === 'direct');
            let isAi = (mode === 'ai');
            let isExam = isBank || isDirect || isAi;
            let base = 'flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center ';
            let on = { theory: 'bg-blue-700 text-white shadow', exercise: 'bg-amber-500 text-white shadow', bank: 'bg-amber-500 text-white shadow', direct: 'bg-indigo-700 text-white shadow', ai: 'bg-violet-700 text-white shadow' };
            let off = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            let bT = document.getElementById('push-mode-theory');
            let bE = document.getElementById('push-mode-exercise');
            let bB = document.getElementById('push-mode-bank');
            let bD = document.getElementById('push-mode-direct');
            if (bT) bT.className = base + (mode === 'theory' ? on.theory : off);
            if (bE) bE.className = base + (mode === 'exercise' ? on.exercise : off);
            if (bB) bB.className = base + (mode === 'bank' ? on.bank : off);
            if (bD) bD.className = base + (mode === 'direct' ? on.direct : off);
            let bA = document.getElementById('push-mode-ai');
            if (bA) bA.className = base + (mode === 'ai' ? on.ai : off);

            // Helper hiện/ẩn dứt khoát (2026-10-10: fix trắng trang theory/exercise)
            function setVis(id, show){
                let el = document.getElementById(id);
                if (el) el.style.display = show ? '' : 'none';
            }

            // Box prompt/AI: hiện ở exam (chứa prompt-panel-exam); form soạn (exam-form-box) đã tách ra ngoài nên luôn hiện mọi chế độ (2026-10-10)
            setVis('bo-tao-prompt-box', isBank); // 2026-10-11: direct chi day Word -> an khung NotebookLM
            // SB_AI_PANEL_FIX_20261012: phai go ca class 'hidden' — setVis chi xoa style inline, class hidden cua Tailwind van an panel mai
            var aiP = document.getElementById('ai-compose-panel');
            if (aiP){ aiP.classList.toggle('hidden', !isAi); aiP.style.display = isAi ? '' : 'none'; if (isAi){ try { aiRecalc(); } catch(e){} try { aiSetupV2(); } catch(e){} try { aiSetupV3(); } catch(e){} } }
            // 2026-10-11: giữ cây thư mục luôn hiện ở mọi chế độ (user yêu cầu)
            // Box Copy Prompt: đúng chế độ
            setVis('theory-copy-prompt-box', isTheory);
            setVis('exercise-copy-prompt-box', isExercise);

            // Tiêu đề khung đẩy nội dung đổi theo chế độ (2026-10-10)
            let upT = document.getElementById('push-upload-title');
            if (upT) upT.textContent = isExercise ? 'Đưa nội dung bài tập lên web' : (isExam ? 'Soạn & đưa đề thi lên web' : 'Đưa nội dung bài học lên web');

            // Ma trận đề: chỉ hiện ở bank (2026-10-10: gộp nút ma trận vào nút bank trên cùng)
            setVis('exam-matrix-panel', isBank); // 2026-10-11: direct chi day Word -> an ma tran

            // Panel builder ngân hàng: mở ở bank
            let bp = document.getElementById('exam-builder-panel');
            if (bp){ bp.classList.toggle('open', isBank); bp.style.display = isBank ? '' : 'none'; }

            // Panel đẩy trực tiếp: mở ở direct
            let dp = document.getElementById('direct-panel');
            if (dp){ dp.classList.toggle('open', isDirect); dp.style.display = isDirect ? '' : 'none'; }

            // Lịch kiểm tra chống lộ đề (checkbox "Đây là ĐỀ KIỂM TRA"): cả 2 chế độ đề thi
            setVis('exam-schedule-box', isExam);

            // 2026-10-11: an o Mon/Khoi/Chuong/Bai khi o che do de thi (bank/direct) - ma tran da co o rieng
            setVis('subject-meta-grid', isTheory || isExercise);
            // 2026-10-11: an khung "Soan & dua de thi len web" o che do direct (da co khung day Word rieng)
            setVis('push-upload-box', !isDirect);
            // 2026-10-11: an nut "Boc lai de" o che do direct (nut nay cua ma tran)
            setVis('exb-repick-wrap', isBank);

            // Panel legacy
            let panelT = document.getElementById('prompt-panel-theory');
            let panelE = document.getElementById('prompt-panel-exam');
            if (panelT) panelT.classList.toggle('hidden', !isTheory);
            if (panelE) panelE.classList.toggle('hidden', !isExam);

            // Đồng bộ loại bài đẩy ẩn theo chế độ
            // - theory → KNOWLEDGE (file *_Ly_thuyet_*.html)
            // - exercise → EXERCISE (file *_Bai_tap_*.html, vào bank data của bài học)
            // - bank/direct → EXAM_LONG (đề thi)
            let itemType = document.getElementById('item-type');
            if (itemType) itemType.value = isTheory ? 'KNOWLEDGE' : (isExercise ? 'EXERCISE' : 'EXAM_LONG');
            if (typeof refreshPushSubmitBtn === 'function') refreshPushSubmitBtn();
            if (typeof updateScorePreview === 'function') updateScorePreview();

            // Load danh sách bài cho ma trận khi vào bank
            if ((isBank || isDirect) && typeof loadLessonDropdowns === 'function'){ // ai: khong load bank
                try { loadLessonDropdowns(); } catch(e){}
            }
        }
        // ========================================================
        // 2 CHE DO CON TRONG TAB DE THI: Tao de moi / Soan tay (2026-10-09)
        // ========================================================
        let currentExamSubMode = 'create'; // 'create' | 'edit'

        // Chế độ con cũ (2026-10-09) đã bỏ 2026-10-10 — giữ stub rỗng để tương thích
        function switchExamSubMode(mode){}

        // Alias cu (tuong thich)
        function switchPushTab(mode){ switchPushMode(mode === 'exam' ? 'direct' : 'theory'); }
        function toggleDirectPanel(){ switchPushMode('direct'); }



        function refreshPushSubmitBtn() {
            let btn = document.getElementById('submit-btn');
            if (!btn) return;
            btn.disabled = false;
            if (currentPushTab === 'exercise') {
                btn.className = 'bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg transition flex items-center';
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-2"></i> Lưu & Đẩy Bài Tập';
            } else if (currentPushTab === 'exam' || currentPushTab === 'direct') {
                btn.className = 'bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg transition flex items-center';
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-2"></i> Lưu & Đẩy Đề Thi';
            } else if (currentPushTab === 'bank') {
                btn.className = 'bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg transition flex items-center';
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-2"></i> Lưu & Đẩy Đề Từ MT';
            } else {
                btn.className = 'bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg transition flex items-center';
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-2"></i> Lưu & Đẩy Bài Lý Thuyết';
            }
        }

        function showToast(message, type = 'info') {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
                document.body.appendChild(container);
            }
            let toast = document.createElement('div');
            let bgClass = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white');
            let iconClass = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
            toast.className = `${bgClass} px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center space-x-2 transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto`;
            toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.remove('translate-y-4', 'opacity-0');
            }, 10);
            
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        }

        function cleanAndDecodeHtml(raw) {
            if (!raw) return '';
            let str = raw.trim();

            // 1. Gỡ bỏ Markdown code block ```html ... ``` nếu có
            str = str.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '');
            str = str.replace(/```(?:html)?/gi, '').replace(/```/g, '');

            // 2. Giải mã HTML entities nếu bị escape bởi Word / Mammoth / Clipboard
            if (/&lt;\s*(?:!DOCTYPE|html|div|h[1-6]|p|table|span|section|article|header|main|ul|ol|li|\/div|\/h[1-6]|\/p|!--)/i.test(str)) {
                str = str.replace(/<p>\s*&lt;/gi, '<')
                         .replace(/&gt;\s*<\/p>/gi, '>')
                         .replace(/&lt;/g, '<')
                         .replace(/&gt;/g, '>')
                         .replace(/&quot;/g, '"')
                         .replace(/&#39;/g, "'")
                         .replace(/&apos;/g, "'")
                         .replace(/&amp;/g, '&');
            }

            // 3. Nếu là file HTML nguyên trang (chứa <!DOCTYPE, <html> hoặc <body>), bóc tách <style> và phần thân trong <body>
            if (str.includes('<html') || str.includes('<!DOCTYPE') || str.includes('<body')) {
                try {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(str, 'text/html');
                    let styles = Array.from(doc.querySelectorAll('style')).map(s => s.outerHTML).join('\n');
                    let bodyContent = doc.body ? doc.body.innerHTML : str;
                    str = (styles ? styles + '\n' : '') + bodyContent;
                } catch(e) {}
            }

            // 4. Dọn dẹp thẻ <p> bọc sai vị trí ngoài cùng các thẻ khối HTML
            str = str.replace(/<p>\s*(<(?:div|section|article|header|table|h[1-6]|ul|ol|li|main|nav|aside|footer|hr)[^>]*>)\s*<\/p>/gi, '$1');
            str = str.replace(/<p>\s*(<\/(?:div|section|article|header|table|h[1-6]|ul|ol|li|main|nav|aside|footer|hr)>)\s*<\/p>/gi, '$1');

            return str;
        }

        // ========================================================
        // SB_AI_MODE_20261012: SOAN DE TU AI - dung ma tran nhanh (khong load bank) -> tao 1 prompt gop:
        // Phan 1 ma de JSON dua len web + Phan 2 ma tran + Phan 3 dac ta (in an chuan BGD)
        // ========================================================
        var SB_AI_ROWS = [
            ['mcq', 'Trắc nghiệm 4 lựa chọn', 0.25, [8, 6, 3, 1]],
            ['truefalse', 'Đúng / Sai (4 ý)', 1, [1, 1, 0, 0]],
            ['short', 'Trả lời ngắn', 0.5, [1, 1, 2, 1]],
            ['essay', 'Tự luận (theo barem)', 1, [0, 0, 1, 0]]
        ];
        var SB_AI_COLS = ['nb', 'th', 'vd', 'vdc'];
        var SB_AI_COLNAMES = { nb: 'NB (Nhận biết)', th: 'TH (Thông hiểu)', vd: 'VD (Vận dụng)', vdc: 'VDC (Vận dụng cao)' };
        function aiNum(id){ var e = document.getElementById(id); var v = e ? parseFloat(e.value) : 0; return (isNaN(v) || v < 0) ? 0 : v; }
        function aiCell(r, c){ return Math.round(aiNum('ai-m-' + r + '-' + c)); }
        function aiMatrix(){
            var rows = [], totQ = 0, totP = 0, lvlP = { nb: 0, th: 0, vd: 0, vdc: 0 };
            SB_AI_ROWS.forEach(function(R){
                var cells = SB_AI_COLS.map(function(c){ return aiCell(R[0], c); });
                var pts = aiNum('ai-p-' + R[0]);
                var q = cells.reduce(function(a, b){ return a + b; }, 0);
                rows.push({ key: R[0], label: R[1], pts: pts, cells: cells, q: q, p: q * pts });
                totQ += q; totP += q * pts;
                SB_AI_COLS.forEach(function(c, i){ lvlP[c] += cells[i] * pts; });
            });
            return { rows: rows, totQ: totQ, totP: totP, lvlP: lvlP };
        }
        function aiRecalc(){
            var M = aiMatrix();
            var gt = document.getElementById('ai-grand-total'); if (gt) gt.textContent = M.totQ + ' câu'; // SB_AI_V22: tong cong tu dong
            var el = document.getElementById('ai-totals'); if (!el) return;
            var pct = function(v){ return M.totP > 0 ? Math.round(v / M.totP * 1000) / 10 : 0; };
            var totPr = Math.round(M.totP * 100) / 100;
            var warn = (Math.abs(totPr - 10) > 0.001)
                ? ' <span style="color:#dc2626;font-size:12px;">⚠ TỔNG ĐIỂM ĐANG LÀ ' + totPr + ' — khác 10 điểm chuẩn! Kiểm tra lại số câu × điểm/câu kẻo ra bài thừa/thiếu điểm.</span>' : ' <span style="color:#059669;">✓ Đúng 10 điểm</span>';
            var colQ = [0, 0, 0, 0];
            M.rows.forEach(function(r){ r.cells.forEach(function(v, i){ colQ[i] += v; }); });
            var pctQ = function(v){ return M.totQ > 0 ? Math.round(v / M.totQ * 1000) / 10 : 0; };
            el.innerHTML = '<span style="font-size:15px;">TỔNG: ' + M.totQ + ' câu — ' + totPr + ' điểm</span>' + warn
                + '<br><span style="font-weight:600;">Tỉ lệ thực tế theo SỐ CÂU: NB ' + pctQ(colQ[0]) + '% · TH ' + pctQ(colQ[1]) + '% · VD ' + pctQ(colQ[2]) + '% · VDC ' + pctQ(colQ[3]) + '% — theo ĐIỂM: NB ' + pct(M.lvlP.nb) + '% · TH ' + pct(M.lvlP.th) + '% · VD ' + pct(M.lvlP.vd) + '% · VDC ' + pct(M.lvlP.vdc) + '% (chuẩn tham khảo 40/30/20/10).</span>';
            M.rows.forEach(function(r){
                var rq = document.getElementById('ai-tq-' + r.key); if (rq) rq.textContent = r.q;
                var rp = document.getElementById('ai-tp-' + r.key); if (rp) rp.textContent = Math.round(r.p * 100) / 100;
            });
        }
        // SB_AI_BANK2SRC_20261012 (Cach A, user chot): bo o Mon/Khoi go tay trong panel AI —
        // Mon/Khoi lay tu o chon noi luu phia tren: Bank 2 (SB_BANK2) khi tick De kiem tra, khong thi Bank 1.
        function aiSubjectGrade(){
            var b2 = window.SB_BANK2;
            if (b2 && b2.grade){
                var nm = String(b2.subjectName || b2.subject || '');
                return { subject: nm.replace(/\s*\d+\s*$/, '').trim() || nm, grade: String(b2.grade) };
            }
            var gEl = document.getElementById('sb-b1-grade'), sEl = document.getElementById('sb-b1-subject');
            var g1 = gEl ? String(gEl.value || '') : '', sf = sEl ? String(sEl.value || '') : '';
            if (g1 && sf) return { subject: sf.replace(/\s*\d+\s*$/, '').trim() || sf, grade: g1 };
            return { subject: '', grade: '' };
        }
        function aiBuildPrompt(){
            var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
            var SG = aiSubjectGrade();
            var subject = SG.subject, grade = SG.grade, lessons = g('ai-lessons'),
                time = g('ai-time') || '45', title = g('ai-title'), scope = g('ai-scope');
            if (!subject){ alert('Hãy chọn Khối + Môn ở ô chọn nơi lưu phía trên trước (Bank 2 nếu là đề kiểm tra, Bank 1 nếu là lý thuyết/bài tập).'); return; }
            if (!lessons){ alert('Hãy nhập Bài/Chương trong phạm vi đề trước khi tạo prompt.'); return; }
            var M = aiMatrix();
            if (!M.totQ){ alert('Ma trận đang trống — hãy nhập số câu cho ít nhất một dạng.'); return; }
            var pct = function(v){ return M.totP > 0 ? Math.round(v / M.totP * 1000) / 10 : 0; };
            var lines = [];
            M.rows.forEach(function(r){
                if (!r.q) return;
                var parts = [];
                SB_AI_COLS.forEach(function(c, i){ if (r.cells[i]) parts.push(SB_AI_COLNAMES[c].split(' ')[0] + ': ' + r.cells[i] + ' câu'); });
                lines.push('- ' + r.label + ' (' + r.pts + ' điểm/câu): ' + parts.join(', ') + ' — tổng ' + r.q + ' câu, ' + (Math.round(r.p * 100) / 100) + ' điểm');
            });
            // SB_AI_V3_20261012: prompt dinh dang VAN BAN THUAN (giong quy uoc doc file Word) - bo JSON hay loi;
            // so bo de chon o ai-nsets (toi da 4), cac bo phai KHAC nhau ve so lieu/boi canh.
            var nsetsEl = document.getElementById('ai-nsets');
            var nsets = nsetsEl ? (parseInt(nsetsEl.value, 10) || 1) : 1;
            if (nsets < 1) nsets = 1; if (nsets > 4) nsets = 4;
            var P = [];
            P.push('Soạn đề kiểm tra GDPT 2018 (sách Kết nối tri thức) theo yêu cầu sau. Trả lời NGAY bằng 3 phần kết quả, không viết lời dẫn/giải thích ngoài 3 phần.');
            P.push('ĐỀ: Môn ' + subject + ' — Lớp ' + grade + ' — Phạm vi: ' + lessons + ' — Thời gian: ' + time + ' phút' + (title ? ' — Tên đề: ' + title : ''));
            P.push('MA TRẬN (dạng câu: số câu theo mức độ):');
            P.push(lines.join('\n'));
            P.push('Mỗi bộ đề: ' + M.totQ + ' câu, ' + (Math.round(M.totP * 100) / 100) + ' điểm.');
            P.push('NỘI DUNG CẦN BAO PHỦ: ' + (scope || 'phủ đều các đơn vị kiến thức trong phạm vi trên.'));
            var mathEl = document.getElementById('ai-math');
            if (mathEl && mathEl.checked){
                P.push('CÔNG THỨC: mọi công thức viết bằng TeX trong $...$ (không dùng ký tự Unicode như x², √, π).');
            }
            P.push('PHẦN 1 — NỘI DUNG ĐỀ: soạn ĐÚNG ' + nsets + ' bộ đề, mỗi bộ bắt đầu bằng một dòng riêng ghi "ĐỀ 1", "ĐỀ 2"... Các bộ đề phải KHÁC NHAU về nội dung, số liệu và bối cảnh (KHÔNG lặp lại cùng một đề, KHÔNG chỉ đảo thứ tự câu hay phương án). Viết mỗi bộ theo ĐÚNG quy ước văn bản thuần sau đây (không dùng bảng, không dùng JSON, không dùng ký hiệu markdown như #, **):');
            P.push('Câu trắc nghiệm 4 phương án viết thế này:\nCâu 1 [TN] [NB]\n<nội dung câu hỏi>\nA. <phương án 1>\nB. <phương án 2>\nC. <phương án 3>\nD. <phương án 4>\nĐáp án: B\nGiải thích: <lời giải NGẮN 1-2 câu>');
            P.push('Câu đúng/sai viết thế này:\nCâu 2 [ĐS] [TH]\n<nội dung câu hỏi>\na) <ý 1>\nb) <ý 2>\nc) <ý 3>\nd) <ý 4>\nĐáp án: Đ, S, Đ, S\nGiải thích: <lời giải NGẮN>');
            P.push('Câu trả lời ngắn viết thế này:\nCâu 3 [TLN] [VD]\n<nội dung câu hỏi>\nĐáp án: <đáp án ngắn>\nGiải thích: <lời giải NGẮN>');
            P.push('Câu tự luận viết thế này:\nCâu 4 [TL] [VD]\n<nội dung câu hỏi>\nBarem: <từng ý chấm kèm điểm của ý đó, tổng các ý bằng điểm/câu của dạng tự luận trong ma trận>');
            P.push('QUY TẮC BẮT BUỘC: mỗi câu mở đầu bằng đúng 1 dòng "Câu <số> [<dạng>] [<mức độ>]" — dạng chỉ dùng TN, ĐS, TLN, TL; mức độ chỉ dùng NB, TH, VD, VDC. Số câu từng dạng × mức độ khớp TUYỆT ĐỐI ma trận. Thứ tự câu trong mỗi bộ: hết TN rồi đến ĐS, TLN, TL; trong mỗi dạng xếp từ NB đến VDC. Không ghi điểm vào từng câu.');
            P.push('PHẦN 2 — MA TRẬN ĐỀ (bảng markdown để in): hàng = dạng câu, cột = NB/TH/VD/VDC, mỗi ô ghi "số câu (số điểm)", thêm cột Tổng câu/Tổng điểm và hàng tỉ lệ % điểm từng mức độ.');
            P.push('PHẦN 3 — BẢN ĐẶC TẢ (bảng markdown để in): cột STT | Đơn vị kiến thức | Mức độ | Dạng câu hỏi | Số điểm, liệt kê đủ mọi câu theo thứ tự trong đề.');
            var out = document.getElementById('ai-prompt-out');
            var text = P.join('\n');
            if (out){ out.value = text; }
            return text;
        }
        function aiCopyPrompt(){
            // SB_AI_V2: 1 nut duy nhat — bam la tu tao prompt + copy luon, toast bay 2s
            var text = '';
            try { text = aiBuildPrompt() || ''; } catch(e){}
            if (!text){ var out0 = document.getElementById('ai-prompt-out'); if (out0) text = out0.value || ''; }
            if (!text) return; // aiBuildPrompt da alert ly do (thieu Mon/Bai hoac ma tran trong)
            aiCopyText(text).then(function(){ aiFloatToast('✅ Đã copy prompt — mở NotebookLM và dán vào!'); });
        }
        function aiCopyText(text){
            if (navigator.clipboard && navigator.clipboard.writeText){
                return navigator.clipboard.writeText(text).catch(function(){ aiCopyFallback(text); });
            }
            aiCopyFallback(text);
            return Promise.resolve();
        }
        function aiCopyFallback(text){
            var ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch(e){}
            ta.remove();
        }
        function aiFloatToast(msg, isErr){
            var t = document.getElementById('sb-ai-toast');
            if (!t){
                t = document.createElement('div'); t.id = 'sb-ai-toast';
                t.style.cssText = 'position:fixed;left:50%;bottom:34px;transform:translateX(-50%) translateY(16px);z-index:9999;padding:11px 20px;border-radius:999px;color:#fff;font-size:14px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.30);opacity:0;transition:all .35s ease;pointer-events:none;white-space:nowrap;';
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.style.background = isErr ? '#dc2626' : '#059669';
            clearTimeout(t._sbH);
            requestAnimationFrame(function(){ t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
            t._sbH = setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)'; }, 2000); // bay an dan, 2s tu mat
        }

        // ========================================================
        // SB_AI_V2_20261012: thanh tren ma tran (tong cau + % sua duoc + boc tu dong),
        // giao dien gon 1 nut copy / 1 nut dan, bo doc ket qua NotebookLM CHIU LOI
        // ========================================================
        function aiLargestRemainder(total, weights){
            var sum = weights.reduce(function(a, b){ return a + b; }, 0);
            if (sum <= 0){ weights = weights.map(function(){ return 1; }); sum = weights.length; }
            var exact = weights.map(function(w){ return total * w / sum; });
            var base = exact.map(function(v){ return Math.floor(v); });
            var left = total - base.reduce(function(a, b){ return a + b; }, 0);
            var order = exact.map(function(v, i){ return [v - Math.floor(v), i]; }).sort(function(a, b){ return b[0] - a[0]; });
            for (var k = 0; k < order.length && left > 0; k++){ base[order[k][1]]++; left--; }
            return base;
        }
        function aiAutoDistribute(){
            // SB_AI_V22_20261012: tong tung dang KHOA CUNG (o ai-rt-<dang>) - chi chia noi bo tung dang theo %
            var pcts = SB_AI_COLS.map(function(c){ return aiNum('ai-pct-' + c); });
            if (pcts.reduce(function(a, b){ return a + b; }, 0) <= 0){ aiFloatToast('Hãy nhập tỉ lệ % cho các mức độ.', true); return; }
            var M0 = aiMatrix();
            var grand = 0;
            SB_AI_ROWS.forEach(function(R, ri){
                var rtEl = document.getElementById('ai-rt-' + R[0]);
                var rt = rtEl ? Math.round(aiNum('ai-rt-' + R[0])) : M0.rows[ri].q; // khong co o khoa thi lay tong hien tai cua dang
                grand += rt;
                var cells = aiLargestRemainder(rt, pcts);
                SB_AI_COLS.forEach(function(c, ci){
                    var inp = document.getElementById('ai-m-' + R[0] + '-' + c);
                    if (inp) inp.value = cells[ci];
                });
            });
            aiRecalc();
            var M = aiMatrix();
            var colQ = [0, 0, 0, 0];
            M.rows.forEach(function(r){ r.cells.forEach(function(v, ci){ colQ[ci] += v; }); });
            var actPct = colQ.map(function(v){ return M.totQ > 0 ? Math.round(v / M.totQ * 1000) / 10 : 0; });
            aiFloatToast('🎲 Đã bốc ' + grand + ' câu — tổng từng dạng giữ nguyên; thực tế: NB ' + actPct[0] + '% · TH ' + actPct[1] + '% · VD ' + actPct[2] + '% · VDC ' + actPct[3] + '% (theo số câu)');
        }
        function aiParseJsonLoose(s){
            // Thu tu thu: nguyen ban -> bao ve lenh TeX (\\frac...) -> sua gach cheo don -> + bo phay thua/dau ngoac kep thong minh
            var texFix = function(x){
                return x.replace(/(?<!\\)\\(frac|dfrac|tfrac|sqrt|text|textbf|textit|mathrm|mathbf|begin|end|left|right|sum|int|lim|infty|alpha|beta|gamma|delta|theta|lambda|pi|rho|sigma|phi|omega|times|cdot|cdots|ldots|geq|leq|neq|approx|equiv|notin|subset|cup|cap|pm|div|tan|cot|sin|cos|log|ln|bar|hat|vec|overline|underline|binom|matrix|cases|quad|qquad|boxed)\b/g, '\\\\$1');
            };
            var smart = s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
            var fixEsc = function(x){
                // Quet ky tu co trang thai: gach cheo da dung cap thi giu nguyen, gach don truoc ky tu la moi nhan doi
                var out = '', esc = false;
                for (var i = 0; i < x.length; i++){
                    var ch = x[i];
                    if (esc){ out += ch; esc = false; continue; }
                    if (ch === '\\'){
                        var nx = x[i + 1] || '';
                        if ('"\\/bfnrtu'.indexOf(nx) >= 0){ out += ch; esc = true; }
                        else out += '\\\\';
                        continue;
                    }
                    out += ch;
                }
                return out;
            };
            var t1 = texFix(smart);
            var noTrail = function(x){ return x.replace(/,(\s*[}\]])/g, '$1'); };
            var tries = [s, smart, t1, noTrail(t1), fixEsc(t1), noTrail(fixEsc(t1))];
            for (var i = 0; i < tries.length; i++){
                try { return JSON.parse(tries[i]); } catch(e){}
            }
            return null;
        }
        function aiExtractSets(raw){
            // Bo doc CHIU LOI: ten de bat ky, JSON boc ```json, phay thua, TeX 1 gach cheo, kem loi dan cua AI...
            var text = String(raw || '').replace(/```[a-zA-Z]*/g, function(m){ return ' '.repeat(m.length); });
            var found = [], seenStart = {}, spans = [];
            function acceptObj(obj, startKey){
                if (!obj || typeof obj !== 'object') return false;
                var added = false;
                if (Array.isArray(obj)){ obj.forEach(function(o){ if (acceptObj(o, startKey)) added = true; }); return added; }
                if (Array.isArray(obj.sets)){ obj.sets.forEach(function(o){ if (acceptObj(o, startKey)) added = true; }); return added; }
                if (Array.isArray(obj.questions) && obj.questions.length){
                    if (startKey != null){ if (seenStart[startKey]) return false; seenStart[startKey] = 1; }
                    found.push({ name: obj.name || '', questions: obj.questions });
                    return true;
                }
                return false;
            }
            // Ung vien 1: toan van la JSON
            if (acceptObj(aiParseJsonLoose(text.trim()), 'whole')) spans.push([0, text.length]);
            // Ung vien 2: quet tung object {...} chua "questions" (dem ngoac, biet chuoi)
            for (var s0 = 0; s0 < text.length; s0++){
                if (text[s0] !== '{') continue;
                var depth = 0, inStr = false, esc = false, end = -1;
                for (var i = s0; i < text.length; i++){
                    var ch = text[i];
                    if (inStr){ if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; }
                    else { if (ch === '"') inStr = true; else if (ch === '{') depth++; else if (ch === '}'){ depth--; if (depth === 0){ end = i; break; } } }
                }
                if (end < 0) continue;
                var cand = text.slice(s0, end + 1);
                if (cand.indexOf('"questions"') < 0) continue;
                if (acceptObj(aiParseJsonLoose(cand), s0)) spans.push([s0, end]);
                s0 = end; // nhay qua object vua doc, tranh doc trung object con
            }
            return { sets: found, spans: spans };
        }
        // ========================================================
        // SB_AI_V3_20261012: bo doc dinh dang VAN BAN THUAN — cung quy uoc voi cho day file Word len
        // (Cau N [TN] [NB] / A. B. C. D. / a) b) c) d) / Dap an: / Giai thich: / Barem:)
        // ========================================================
        function aiSplitInlineOpts(text){
            var parts = [], re = /([A-D])[\.\)]\s*/g, m, lastL = null, lastI = 0;
            while ((m = re.exec(text)) !== null){
                if (lastL !== null){ var c = text.substring(lastI, m.index).trim(); if (c) parts.push({ letter: lastL, text: c }); }
                lastL = m[1]; lastI = m.index + m[0].length;
            }
            if (lastL !== null){ var c2 = text.substring(lastI).trim(); if (c2) parts.push({ letter: lastL, text: c2 }); }
            return parts;
        }
        function aiTagToTypeLevel(rest, cur){
            var tags = rest.match(/\[[^\]]+\]/g) || [];
            tags.forEach(function(t){
                var v = t.slice(1, -1).trim().toUpperCase();
                if (v === 'TN' || v.indexOf('TRẮC NGHIỆM') >= 0 || v.indexOf('TRAC NGHIEM') >= 0) cur.type = 'mcq';
                else if (v === 'ĐS' || v === 'DS' || v.indexOf('ĐÚNG SAI') >= 0 || v.indexOf('DUNG SAI') >= 0) cur.type = 'truefalse';
                else if (v === 'TLN' || v.indexOf('TRẢ LỜI NGẮN') >= 0 || v.indexOf('TRA LOI NGAN') >= 0) cur.type = 'short';
                else if (v === 'TL' || v.indexOf('TỰ LUẬN') >= 0 || v.indexOf('TU LUAN') >= 0) cur.type = 'essay';
                else if (['NB', 'TH', 'VD', 'VDC'].indexOf(v) >= 0) cur.level = v;
            });
        }
        function aiParseTextQuestions(lines, ptsByType){
            var qs = [], cur = null;
            function finalize(){
                if (!cur.type) cur.type = cur.options.length >= 2 ? 'mcq' : (cur.statements.length >= 2 ? 'truefalse' : 'short');
                var rawA = (cur._ans || '').trim();
                if (cur.type === 'mcq'){
                    var mm = rawA.match(/[A-D]/i);
                    cur.answer = mm ? mm[0].toUpperCase() : '';
                    cur.options = cur.options.map(function(o){ return String(o).replace(/^[A-D][\.\)]\s*/, ''); });
                    delete cur.statements;
                } else if (cur.type === 'truefalse'){
                    var arr = rawA.split(/[,;\/]+/).map(function(p){
                        var v = p.trim().toUpperCase();
                        if (['Đ', 'D', 'ĐÚNG', 'DUNG', 'T', 'TRUE'].indexOf(v) >= 0) return 'T';
                        if (['S', 'SAI', 'F', 'FALSE'].indexOf(v) >= 0) return 'F';
                        return '';
                    }).filter(Boolean);
                    if (arr.length < cur.statements.length){
                        var byLetter = {}, mm2, reL = /([a-d])\s*[\.\)\:\-]\s*(Đúng|Sai|Đ|S)/gi;
                        while ((mm2 = reL.exec(rawA)) !== null) byLetter[mm2[1].toLowerCase()] = (mm2[2] === 'Đúng' || mm2[2] === 'Đ') ? 'T' : 'F';
                        var arr2 = ['a', 'b', 'c', 'd'].map(function(k){ return byLetter[k] || ''; }).filter(Boolean);
                        if (arr2.length > arr.length) arr = arr2;
                    }
                    cur.answer = arr;
                    cur.options = [];
                } else if (cur.type === 'essay'){
                    if (rawA && !cur.explain) cur.explain = rawA;
                    cur.answer = '';
                    cur.options = []; delete cur.statements;
                } else {
                    cur.answer = rawA;
                    cur.options = []; delete cur.statements;
                }
                cur.points = (cur._pts != null) ? cur._pts : (ptsByType[cur.type] != null ? ptsByType[cur.type] : 0);
                cur.q = (cur.q || '').trim();
                delete cur._ans; delete cur._pts; delete cur._mode;
            }
            function pushCur(){ if (cur && (cur.q || cur.statements.length)){ finalize(); qs.push(cur); } cur = null; }
            lines.forEach(function(rawLine){
                var line = String(rawLine || '').trim();
                if (!line) return;
                line = line.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '');
                var mCau = line.match(/^(câu|cau)\s*(\d+)\s*(.*)$/i);
                if (mCau){
                    pushCur();
                    cur = { type: null, level: 'NB', q: '', options: [], statements: [], answer: null, explain: '', _ans: '', _mode: 'q', _pts: null };
                    var rest = mCau[3] || '';
                    aiTagToTypeLevel(rest, cur);
                    var mp = rest.match(/\((\d+(?:[.,]\d+)?)\s*(?:điểm|đ)\)/i);
                    if (mp) cur._pts = parseFloat(mp[1].replace(',', '.'));
                    var qt = rest.replace(/\[[^\]]+\]/g, '').replace(/\(\d+(?:[.,]\d+)?\s*(?:điểm|đ)\)/gi, '').replace(/^[\.\)\:\s]+/, '').trim();
                    if (qt) cur.q = qt;
                    return;
                }
                if (!cur) return;
                var mAns = line.match(/^(đáp án|dap an)\s*[:：]\s*(.*)$/i);
                if (mAns){ cur._ans = mAns[2].trim(); cur._mode = 'ans'; return; }
                var mBar = line.match(/^(barem|hướng dẫn chấm|huong dan cham)\s*[:：]\s*(.*)$/i);
                if (mBar){ cur._mode = 'exp'; cur.explain = (cur.explain ? cur.explain + ' ' : '') + (mBar[2] || '').trim(); return; }
                var mExp = line.match(/^(giải thích|giai thich|lời giải|loi giai)\s*[:：]\s*(.*)$/i);
                if (mExp){ cur._mode = 'exp'; cur.explain = (cur.explain ? cur.explain + ' ' : '') + (mExp[2] || '').trim(); return; }
                if (cur._mode === 'exp'){ cur.explain += (cur.explain ? ' ' : '') + line; return; }
                if (cur._mode === 'ans'){ cur._ans += (cur._ans ? ' ' : '') + line; return; }
                var mOpt = line.match(/^([A-D])[\.\)]\s*(.*)$/);
                if (mOpt && cur.type !== 'truefalse' && cur.type !== 'essay'){
                    var inl = aiSplitInlineOpts(line);
                    if (inl.length >= 2) inl.forEach(function(io){ cur.options.push(io.text); });
                    else cur.options.push(mOpt[2].trim());
                    if (!cur.type) cur.type = 'mcq';
                    return;
                }
                var mSt = line.match(/^([a-d])[\.\)]\s*(.+)$/);
                if (mSt && cur.type !== 'mcq' && cur.type !== 'essay'){
                    cur.statements.push(mSt[2].trim());
                    if (!cur.type) cur.type = 'truefalse';
                    return;
                }
                cur.q += (cur.q ? ' ' : '') + line;
            });
            pushCur();
            qs.forEach(function(q, i){ q.id = 'c' + (i + 1); if (q.chapter == null) q.chapter = ''; });
            return qs;
        }
        function aiParseTextSets(raw){
            var text = String(raw || '');
            // Vung cau hoi = truoc PHAN 2 (ma tran) — tranh bang markdown lam nhieu parser
            var cut = text.length;
            var mCut = text.search(/phần\s*2\b/i);
            if (mCut > 0) cut = Math.min(cut, mCut);
            var region = text.slice(0, cut);
            var lines = region.split(/\r?\n/);
            var reSet = /^\s*(?:#{1,6}\s*)?(?:\*\*)?(ĐỀ|DE)\s*(?:SỐ\s*)?(\d+)\b/i;
            var hasCau = function(c){ return c.some(function(x){ return /^\s*(câu|cau)\s*\d+/i.test(x); }); };
            var chunks = [], curChunk = [];
            lines.forEach(function(ln){
                if (reSet.test(ln) && hasCau(curChunk)){ chunks.push(curChunk); curChunk = [ln]; }
                else curChunk.push(ln);
            });
            chunks.push(curChunk);
            chunks = chunks.filter(hasCau);
            if (!chunks.length) return [];
            var ptsByType = {};
            try { aiMatrix().rows.forEach(function(r){ ptsByType[r.key] = r.pts; }); } catch(e){}
            var sets = chunks.map(function(chunk, si){
                return { name: 'Đề ' + (si + 1), questions: aiParseTextQuestions(chunk, ptsByType) };
            }).filter(function(st){ return st.questions.length; });
            return sets;
        }
        function aiProcessNotebookText(raw){
            var stEl = document.getElementById('merge-sets-status');
            // SB_AI_V3: uu tien dinh dang VAN BAN; JSON cu chi la du phong tuong thich nguoc
            var sets = aiParseTextSets(raw);
            var usedText = sets.length > 0;
            var exSpans = [];
            if (!usedText){
                var ex = aiExtractSets(raw);
                sets = ex.sets; exSpans = ex.spans || [];
            }
            if (!sets.length){
                if (stEl){ stEl.textContent = 'Vẫn chưa tách được bộ đề nào — hãy copy TOÀN BỘ kết quả NotebookLM rồi bấm Dán lại.'; stEl.className = 'text-[11px] font-bold text-rose-600'; }
                aiFloatToast('❌ Chưa tìm thấy phần đề trong nội dung đã dán', true);
                return false;
            }
            // Chong trung: 1 bo JSON co the bi aiExtractSets nhan 2 lan (ung vien whole + ung vien quet)
            var seenQ = {};
            sets = sets.filter(function(st){
                var k = JSON.stringify(st.questions || []);
                if (seenQ[k]) return false;
                seenQ[k] = 1; return true;
            });
            var dropped = 0;
            if (sets.length > 4){ dropped = sets.length - 4; sets = sets.slice(0, 4); } // SB_AI_V3: toi da 4 bo de
            var canonical = sets.map(function(s2, i){ return JSON.stringify({ name: 'Đề ' + (i + 1), questions: s2.questions }); }).join('\n');
            var ta = document.getElementById('merge-sets-input');
            var splitRaw = String(raw);
            if (!usedText) exSpans.slice().sort(function(a, b){ return b[0] - a[0]; }).forEach(function(sp){ splitRaw = splitRaw.slice(0, sp[0]) + ' ' + splitRaw.slice(sp[1] + 1); });
            if (ta) ta.value = canonical + '\n\n' + splitRaw; // phan con lai (ma tran/dac ta) de tach lam Word, khoi JSON da cat tranh gop trung
            if (typeof window.mergeExamSets === 'function') window.mergeExamSets();
            setTimeout(function(){ try { aiSplitAfterMerge(); } catch(e){} }, 150); // goi thang cho chac (bo boc ngoai co the chua kip cai trong 250ms dau)
            var nq = sets.reduce(function(a, s2){ return a + s2.questions.length; }, 0);
            aiFloatToast('✅ Đã tách ' + sets.length + ' bộ đề (' + nq + ' câu) vào khung soạn' + (dropped ? ' — đã bỏ ' + dropped + ' bộ vượt quá tối đa 4 bộ' : '') + ' — bấm Tải Word để lấy bản in!');
            return true;
        }
        function aiPasteFromNotebook(){
            var done = function(txt){
                if (txt && String(txt).trim()){ aiProcessNotebookText(String(txt)); return; }
                aiShowManualPaste();
            };
            if (navigator.clipboard && navigator.clipboard.readText){
                navigator.clipboard.readText().then(done).catch(function(){ aiShowManualPaste(); });
            } else aiShowManualPaste();
        }
        function aiShowManualPaste(){
            var ta = document.getElementById('merge-sets-input');
            var stEl = document.getElementById('merge-sets-status');
            if (ta){
                ta.style.display = '';
                ta.value = '';
                ta.placeholder = 'Nhấn Ctrl+V để dán kết quả NotebookLM vào đây — hệ thống tự tách đề ngay khi dán...';
                ta.focus();
                if (!ta._sbAiPasteHook){
                    ta._sbAiPasteHook = 1;
                    ta.addEventListener('paste', function(){ setTimeout(function(){ aiProcessNotebookText(ta.value); }, 60); });
                }
            }
            if (stEl){ stEl.textContent = 'Trình duyệt chưa cho đọc clipboard trực tiếp — hãy dán (Ctrl+V) vào ô vừa hiện.'; stEl.className = 'text-[11px] font-bold text-amber-600'; }
        }
        function aiSetupV2(){
            var panel = document.getElementById('ai-compose-panel');
            if (!panel || panel._sbAiV2) return;
            panel._sbAiV2 = 1;
            // Doi huong dan dau panel
            var intro = panel.querySelector('p');
            if (intro) intro.textContent = 'Chọn Khối + Môn ở ô chọn nơi lưu phía trên, nhập Bài/Chương → nhập TỔNG SỐ CÂU + tỉ lệ % rồi bấm 🎲 Bốc tự động (hoặc nhập tay từng ô) → bấm 📋 Copy Prompt dán vào NotebookLM → khi có kết quả, bấm 📥 Dán từ NotebookLM: hệ thống tự tách phần đề vào khung soạn và chuẩn bị bản Word in ấn.';
            // Thanh tren ma tran: tong cau + % + boc tu dong
            var tableWrap = panel.querySelector('.overflow-x-auto');
            if (tableWrap && !document.getElementById('ai-topbar')){
                var bar = document.createElement('div');
                bar.id = 'ai-topbar';
                bar.className = 'flex flex-wrap items-end gap-2 bg-white border border-violet-300 rounded-lg p-2 mb-2';
                var inpCls = 'px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold';
                var labCls = 'block text-[10px] font-bold text-slate-600 mb-1';
                bar.innerHTML =
                    '<div><label class="' + labCls + '">🔒 TN 4 LỰA CHỌN — TỔNG</label><input type="number" id="ai-rt-mcq" value="18" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<div><label class="' + labCls + '">🔒 ĐÚNG/SAI — TỔNG</label><input type="number" id="ai-rt-truefalse" value="2" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<div><label class="' + labCls + '">🔒 TRẢ LỜI NGẮN — TỔNG</label><input type="number" id="ai-rt-short" value="5" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<div><label class="' + labCls + '">🔒 TỰ LUẬN — TỔNG</label><input type="number" id="ai-rt-essay" value="1" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<div><label class="' + labCls + '">TỔNG CỘNG</label><div id="ai-grand-total" class="px-2 py-1.5 font-black text-violet-800 text-sm">26 câu</div></div>'
                    + '<div><label class="' + labCls + '">NB %</label><input type="number" id="ai-pct-nb" value="40" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<div><label class="' + labCls + '">TH %</label><input type="number" id="ai-pct-th" value="30" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<div><label class="' + labCls + '">VD %</label><input type="number" id="ai-pct-vd" value="20" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<div><label class="' + labCls + '">VDC %</label><input type="number" id="ai-pct-vdc" value="10" min="0" max="100" class="' + inpCls + ' w-16"></div>'
                    + '<button type="button" id="ai-auto-btn" class="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold rounded-lg shadow-sm">🎲 Bốc tự động theo %</button>'
                    + '<span class="text-[10px] text-slate-500 pb-1">Đặt TỔNG từng dạng (khóa cứng 🔒) + tỉ lệ % rồi bấm Bốc: mỗi dạng được chia theo % mức độ, tổng từng dạng không đổi. Hoặc nhập tay từng ô trong bảng như cũ.</span>';
                tableWrap.parentNode.insertBefore(bar, tableWrap);
                document.getElementById('ai-auto-btn').addEventListener('click', aiAutoDistribute);
                var Mrt = aiMatrix(); // khoa tung dang khoi tao = tong hien tai cua tung dang trong luoi
                Mrt.rows.forEach(function(r){ var e2 = document.getElementById('ai-rt-' + r.key); if (e2) e2.value = r.q; });
            }
            // An o prompt + nut Tao prompt (chi con 1 nut Copy)
            var out = document.getElementById('ai-prompt-out'); if (out) out.style.display = 'none';
            panel.querySelectorAll('button').forEach(function(b){
                var oc = b.getAttribute('onclick') || '';
                if (oc.indexOf('aiBuildPrompt') >= 0) b.style.display = 'none';
            });
            // Khu vuc dan: an o dan + nut Gop cu, them 1 nut Dan tu NotebookLM
            var ta = document.getElementById('merge-sets-input');
            var gopBtn = null;
            panel.querySelectorAll('button').forEach(function(b){
                var oc = b.getAttribute('onclick') || '';
                if (oc.indexOf('mergeExamSets') >= 0) gopBtn = b;
            });
            if (ta) ta.style.display = 'none';
            if (gopBtn && !document.getElementById('ai-paste-btn')){
                var pb = document.createElement('button');
                pb.type = 'button'; pb.id = 'ai-paste-btn';
                pb.className = 'px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm';
                pb.innerHTML = '<i class="fa-solid fa-paste mr-1"></i> 📥 Dán từ NotebookLM & tách đề';
                pb.addEventListener('click', aiPasteFromNotebook);
                gopBtn.parentNode.insertBefore(pb, gopBtn);
                gopBtn.style.display = 'none';
                var lbl = ta ? ta.previousElementSibling : null;
                if (lbl && lbl.tagName === 'LABEL') lbl.textContent = 'Khi NotebookLM trả kết quả: copy toàn bộ rồi bấm nút Dán — hệ thống tự tách phần đề vào khung soạn bên dưới, ma trận + đặc tả dùng cho bản Word.';
            }
            try { aiRecalc(); } catch(e){}
        }

        // ========================================================
        // SB_AI_V3_20261012: o chon SO BO DE (1-4) trong thanh tren ma tran + huong dan dinh dang moi
        // ========================================================
        function aiSetupV3(){
            var panel = document.getElementById('ai-compose-panel');
            if (!panel || panel._sbAiV3) return;
            panel._sbAiV3 = 1;
            var bar = document.getElementById('ai-topbar');
            if (bar && !document.getElementById('ai-nsets')){
                var div = document.createElement('div');
                div.innerHTML = '<label class="block text-[10px] font-bold text-slate-600 mb-1">SỐ BỘ ĐỀ (tối đa 4)</label>'
                    + '<select id="ai-nsets" class="px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold">'
                    + '<option value="1" selected>1 bộ</option><option value="2">2 bộ</option><option value="3">3 bộ</option><option value="4">4 bộ</option></select>';
                var autoBtn = document.getElementById('ai-auto-btn');
                if (autoBtn) bar.insertBefore(div, autoBtn); else bar.appendChild(div);
            }
            var intro = panel.querySelector('p');
            if (intro) intro.textContent = 'Chọn Khối + Môn ở ô chọn nơi lưu phía trên, nhập Bài/Chương → khóa TỔNG từng dạng + tỉ lệ % rồi bấm 🎲 Bốc tự động (hoặc nhập tay) → chọn SỐ BỘ ĐỀ (1-4) → bấm 📋 Copy Prompt dán vào NotebookLM → khi có kết quả, bấm 📥 Dán từ NotebookLM: hệ thống tự tách đề vào khung soạn, bản Word in ra có cấu trúc Phần I/II/III/IV như đề thật.';
        }

        // ========================================================
        // SB_AI_WORD_20261012: web tu tach ket qua NotebookLM lam 2 phan:
        // (1) phan de JSON -> gop vao khung soan de day len web (mergeExamSets goc)
        // (2) phan in an -> tai xuong file Word tu web (de bai khong dap an + ma tran + dac ta + dap an/barem rieng o cuoi)
        // ========================================================
        function aiMdTableToHtml(md){
            var lines = String(md || '').split('\n'), rows = [];
            lines.forEach(function(ln){
                ln = ln.trim();
                if (ln.indexOf('|') !== 0) return;
                var cells = ln.split('|').slice(1);
                if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
                cells = cells.map(function(c){ return c.trim(); });
                if (!cells.length) return;
                if (cells.every(function(c){ return /^:?-{2,}:?$/.test(c); })) return; // dong phan cach ---
                rows.push(cells);
            });
            if (!rows.length) return '';
            var h = '<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%;font-size:12pt;">';
            rows.forEach(function(r, ri){
                h += '<tr>' + r.map(function(c){
                    var tag = ri === 0 ? 'th' : 'td';
                    return '<' + tag + ' style="border:1px solid #000;padding:4px;">' + aiWordEsc(c) + '</' + tag + '>';
                }).join('') + '</tr>';
            });
            return h + '</table>';
        }
        function aiWordEsc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
        function aiSplitAfterMerge(){
            try {
                var raw = (document.getElementById('merge-sets-input') || {}).value || '';
                var ic = (document.getElementById('item-content') || {}).value || '';
                var m = ic.match(/<script type="application\/json" class="saobay-exam10-data">([\s\S]*?)<\/script>/);
                if (!m) return;
                var data = JSON.parse(m[1]);
                var sets = data.sets || [];
                if (!sets.length) return;
                var i2 = raw.search(/phần\s*2/i), i3 = raw.search(/phần\s*3/i);
                var matrixMd = (i2 >= 0) ? raw.slice(i2, (i3 > i2) ? i3 : undefined) : '';
                var specMd = (i3 >= 0) ? raw.slice(i3) : '';
                var gv = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
                var SGW = aiSubjectGrade();
                window.SB_AI_WORD = {
                    subject: SGW.subject, grade: SGW.grade, time: gv('ai-time') || '45', title: gv('ai-title'),
                    sets: sets, matrixMd: matrixMd, specMd: specMd
                };
                var btn = document.getElementById('ai-word-btn');
                if (btn){ btn.disabled = false; btn.classList.remove('opacity-50'); }
                var st = document.getElementById('ai-word-status');
                if (st) st.textContent = 'Đã tách xong: phần đề đã vào khung soạn — bấm Tải Word để lấy bản in (đề + ma trận + đặc tả).';
            } catch(e){ /* tach loi thi chi khong co Word, phan web van chay */ }
        }
        function aiExportWord(){
            var W = window.SB_AI_WORD;
            if (!W){ alert('Hãy dán kết quả NotebookLM và bấm "Gộp đề vào khung soạn" trước — hệ thống tách xong mới tải Word được.'); return; }
            var esc = aiWordEsc;
            // SB_AI_V3_20261012: ban in NHƯ ĐỀ THẬT — chia PHẦN I/II/III/IV + ghi chú từng phần do WEB tự thêm,
            // phương án TN ngắn xếp 1 dòng (trung bình 2x2, dài mới mỗi dòng 1 phương án), điểm tính THEO TỪNG BỘ.
            var PARTS = [
                { key: 'mcq', title: 'PHẦN I. TRẮC NGHIỆM 4 PHƯƠNG ÁN', note: function(a, b){ return 'Thí sinh trả lời từ câu ' + a + ' đến câu ' + b + '. Mỗi câu hỏi thí sinh chỉ chọn một phương án.'; } },
                { key: 'truefalse', title: 'PHẦN II. TRẮC NGHIỆM ĐÚNG SAI', note: function(a, b){ return 'Thí sinh trả lời từ câu ' + a + ' đến câu ' + b + '. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.'; } },
                { key: 'short', title: 'PHẦN III. TRẢ LỜI NGẮN', note: function(a, b){ return 'Thí sinh trả lời từ câu ' + a + ' đến câu ' + b + '.'; } },
                { key: 'essay', title: 'PHẦN IV. TỰ LUẬN', note: function(){ return 'Thí sinh trình bày bài làm vào giấy thi.'; } }
            ];
            function groupByPart(qs){
                var g = { mcq: [], truefalse: [], short: [], essay: [] };
                (qs || []).forEach(function(q){ if (g[q.type]) g[q.type].push(q); else g.mcq.push(q); });
                return g;
            }
            function optsHtml(opts){
                var t = (opts || []).map(function(o){ return String(o == null ? '' : o).replace(/^[A-D][\.\)]\s*/, ''); });
                if (!t.length) return '';
                var letters = 'ABCD';
                var total = t.reduce(function(a, x){ return a + x.length; }, 0);
                var mx = Math.max.apply(null, t.map(function(x){ return x.length; }));
                if (t.length === 4 && total <= 84 && mx <= 30){
                    return '<table width="100%" cellspacing="0" cellpadding="0" style="margin:2px 0 6px 24px;"><tr>' + t.map(function(x, i){ return '<td width="25%" style="vertical-align:top;">' + letters[i] + '. ' + esc(x) + '</td>'; }).join('') + '</tr></table>';
                }
                if (t.length === 4 && mx <= 46){
                    return '<table width="100%" cellspacing="0" cellpadding="0" style="margin:2px 0 6px 24px;"><tr><td width="50%" style="vertical-align:top;padding-bottom:3px;">A. ' + esc(t[0]) + '</td><td width="50%" style="vertical-align:top;padding-bottom:3px;">B. ' + esc(t[1]) + '</td></tr><tr><td style="vertical-align:top;">C. ' + esc(t[2]) + '</td><td style="vertical-align:top;">D. ' + esc(t[3]) + '</td></tr></table>';
                }
                return t.map(function(x, i){ return '<p style="margin:0 0 2px 24px;">' + letters[i] + '. ' + esc(x) + '</p>'; }).join('');
            }
            function ptsTxt(q){ var p = parseFloat(q.points); return (!isNaN(p) && p > 0) ? ' (' + (Math.round(p * 100) / 100) + ' điểm)' : ''; }
            var setsParts = W.sets.map(function(st){ return groupByPart(st.questions); });
            var h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(W.title || 'Đề kiểm tra') + '</title></head>'
                + '<body style="font-family:Times New Roman,serif;font-size:13pt;">';
            W.sets.forEach(function(st, si){
                if (si > 0) h += '<br clear="all" style="page-break-before:always;">';
                var setPts = (st.questions || []).reduce(function(a, q){ return a + (parseFloat(q.points) || 0); }, 0);
                h += '<table width="100%" cellspacing="0" cellpadding="0"><tr>'
                    + '<td style="text-align:center;width:42%;vertical-align:top;">SỞ GD&ĐT ....................<br><b>TRƯỜNG THPT ....................</b><br>--------------------</td>'
                    + '<td style="text-align:center;width:58%;vertical-align:top;"><b>' + esc((W.title || 'ĐỀ KIỂM TRA').toUpperCase()) + '</b><br>Môn: ' + esc(W.subject || '') + (W.grade ? ' — Lớp ' + esc(W.grade) : '') + '<br><i>Thời gian làm bài: ' + esc(W.time) + ' phút, không kể thời gian phát đề</i><br>Tổng điểm: ' + (Math.round(setPts * 100) / 100) + (W.sets.length > 1 ? ' &nbsp;•&nbsp; <b>' + esc(st.name || ('Đề ' + (si + 1))) + '</b>' : '') + '</td></tr></table>';
                h += '<p style="margin-top:10px;">Họ và tên thí sinh: ...................................................... Số báo danh: ................... Lớp: ...........</p>';
                var g = setsParts[si];
                PARTS.forEach(function(P){
                    var list = g[P.key];
                    if (!list.length) return;
                    h += '<h3 style="margin:14px 0 2px;">' + P.title + '</h3><p style="margin:0 0 8px;"><i>' + P.note(1, list.length) + '</i></p>';
                    list.forEach(function(q, i){
                        h += '<p style="margin:8px 0 2px;"><b>Câu ' + (i + 1) + '.</b>' + (P.key === 'mcq' ? '' : ptsTxt(q)) + ' ' + esc(q.q) + '</p>';
                        if (P.key === 'mcq') h += optsHtml(q.options);
                        else if (P.key === 'truefalse') (q.statements || []).forEach(function(sm, smi){ h += '<p style="margin:0 0 2px 24px;">' + 'abcd'[smi] + ') ' + esc(sm) + '</p>'; });
                        else if (P.key === 'short') h += '<p style="margin:0 0 2px 24px;">Trả lời: ......................................................</p>';
                        else if (P.key === 'essay'){ for (var li = 0; li < 4; li++) h += '<p style="margin:0 0 2px 24px;">...........................................................................................................</p>'; }
                    });
                });
                h += '<p style="text-align:center;margin-top:14px;"><b>— HẾT —</b></p><p style="margin-top:4px;"><i>Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.</i></p>';
            });
            var mt = aiMdTableToHtml(W.matrixMd), sp = aiMdTableToHtml(W.specMd);
            if (mt) h += '<br clear="all" style="page-break-before:always;"><h3>MA TRẬN ĐỀ</h3>' + mt;
            if (sp) h += '<h3 style="margin-top:18px;">BẢN ĐẶC TẢ ĐỀ</h3>' + sp;
            h += '<br clear="all" style="page-break-before:always;"><h3>ĐÁP ÁN & BAREM (dành cho giáo viên)</h3>';
            W.sets.forEach(function(st, si){
                if (W.sets.length > 1) h += '<h4>' + esc(st.name || ('Đề ' + (si + 1))) + '</h4>';
                var g = setsParts[si];
                PARTS.forEach(function(P){
                    var list = g[P.key];
                    if (!list.length) return;
                    h += '<p style="margin:10px 0 4px;"><b>' + P.title + '</b></p>';
                    if (P.key === 'mcq'){
                        h += '<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;"><tr><th>Câu</th>' + list.map(function(q, i){ return '<th>' + (i + 1) + '</th>'; }).join('') + '</tr><tr><td><b>Đáp án</b></td>' + list.map(function(q){ return '<td style="text-align:center;"><b>' + esc(String(q.answer || '')) + '</b></td>'; }).join('') + '</tr></table>';
                    } else if (P.key === 'truefalse'){
                        list.forEach(function(q, i){
                            var a = q.answer;
                            var aTxt = Array.isArray(a) ? a.map(function(v, vi){ return 'abcd'[vi] + ') ' + ((v === 'T' || v === true) ? 'Đúng' : 'Sai'); }).join('; ') : String(a == null ? '' : a);
                            h += '<p style="margin:0 0 2px 24px;">Câu ' + (i + 1) + ': ' + esc(aTxt) + '</p>';
                        });
                    } else if (P.key === 'short'){
                        list.forEach(function(q, i){ h += '<p style="margin:0 0 2px 24px;">Câu ' + (i + 1) + ': <b>' + esc(String(q.answer == null ? '' : q.answer)) + '</b></p>'; });
                    } else {
                        list.forEach(function(q, i){ h += '<p style="margin:0 0 2px 24px;">Câu ' + (i + 1) + ptsTxt(q) + ': ' + esc(q.explain || '(barem — xem lời giải)') + '</p>'; });
                    }
                });
                h += '<p style="margin:10px 0 4px;"><b>Lời giải chi tiết</b></p>';
                PARTS.forEach(function(P){
                    g[P.key].forEach(function(q, i){
                        if (!q.explain) return;
                        if (P.key === 'essay') return; // tu luan: barem da o tren
                        var a = q.answer;
                        var aTxt = Array.isArray(a) ? a.map(function(v, vi){ return 'abcd'[vi] + ') ' + ((v === 'T' || v === true) ? 'Đúng' : 'Sai'); }).join('; ') : String(a == null ? '' : a);
                        h += '<p style="margin:0 0 2px 24px;">' + P.title.split('.')[0] + ' — Câu ' + (i + 1) + ' (' + esc(aTxt) + '): <i>' + esc(q.explain) + '</i></p>';
                    });
                });
            });
            h += '</body></html>';
            var blob = new Blob(['\ufeff', h], { type: 'application/msword' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = ('de-' + (W.subject || 'kiem-tra') + '-' + (W.title || 'saobay')).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '-').toLowerCase() + '.doc';
            document.body.appendChild(a); a.click();
            setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
            if (typeof showToast === 'function') showToast('Đã tải file Word (đề + ma trận + đặc tả)', 'success');
        }
        (function aiWrapMerge(){
            var tries = 0;
            var iv = setInterval(function(){
                tries++;
                if (typeof window.mergeExamSets === 'function' && !window.mergeExamSets._sbAiWrapped){
                    var orig = window.mergeExamSets;
                    var wrapped = function(){ orig(); setTimeout(aiSplitAfterMerge, 60); };
                    wrapped._sbAiWrapped = true;
                    window.mergeExamSets = wrapped;
                    clearInterval(iv);
                }
                if (tries > 40) clearInterval(iv);
            }, 250);
        })();
