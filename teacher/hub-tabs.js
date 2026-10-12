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
            setVis('ai-compose-panel', isAi); // SB_AI_MODE_20261012: panel soan de tu AI chi hien o mode ai
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
            var el = document.getElementById('ai-totals'); if (!el) return;
            var pct = function(v){ return M.totP > 0 ? Math.round(v / M.totP * 1000) / 10 : 0; };
            el.textContent = 'Tổng: ' + M.totQ + ' câu — ' + (Math.round(M.totP * 100) / 100) + ' điểm. Tỉ lệ điểm theo mức độ: NB ' + pct(M.lvlP.nb) + '% · TH ' + pct(M.lvlP.th) + '% · VD ' + pct(M.lvlP.vd) + '% · VDC ' + pct(M.lvlP.vdc) + '% (chuẩn tham khảo 40/30/20/10).';
            M.rows.forEach(function(r){
                var rq = document.getElementById('ai-tq-' + r.key); if (rq) rq.textContent = r.q;
                var rp = document.getElementById('ai-tp-' + r.key); if (rp) rp.textContent = Math.round(r.p * 100) / 100;
            });
        }
        function aiBuildPrompt(){
            var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
            var subject = g('ai-subject'), grade = g('ai-grade'), lessons = g('ai-lessons'),
                time = g('ai-time') || '45', title = g('ai-title'), scope = g('ai-scope');
            if (!subject || !lessons){ alert('Hãy nhập Môn và Bài/Chương (gõ nhanh) trước khi tạo prompt.'); return; }
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
            var P = [];
            P.push('Bạn là chuyên gia ra đề kiểm tra theo chương trình GDPT 2018 (sách giáo khoa Kết nối tri thức với cuộc sống). Hãy soạn MỘT đề kiểm tra hoàn chỉnh theo đúng yêu cầu dưới đây.');
            P.push('');
            P.push('THÔNG TIN ĐỀ:');
            P.push('- Môn: ' + subject + ' — Lớp: ' + grade);
            P.push('- Phạm vi kiến thức: ' + lessons);
            P.push('- Thời gian làm bài: ' + time + ' phút');
            if (title) P.push('- Tên đề: ' + title);
            P.push('');
            P.push('MA TRẬN ĐỀ (số câu theo dạng × mức độ; NB = Nhận biết, TH = Thông hiểu, VD = Vận dụng, VDC = Vận dụng cao):');
            P.push(lines.join('\n'));
            P.push('Tổng cộng: ' + M.totQ + ' câu — ' + (Math.round(M.totP * 100) / 100) + ' điểm. Tỉ lệ điểm theo mức độ: NB ' + pct(M.lvlP.nb) + '%, TH ' + pct(M.lvlP.th) + '%, VD ' + pct(M.lvlP.vd) + '%, VDC ' + pct(M.lvlP.vdc) + '%.');
            P.push('');
            P.push('NỘI DUNG KIẾN THỨC CẦN BAO PHỦ:');
            P.push(scope || '(Theo phạm vi kiến thức ở trên; phủ đều các đơn vị kiến thức trong phạm vi.)');
            var mathEl = document.getElementById('ai-math');
            if (mathEl && mathEl.checked){
                P.push('');
                P.push('YÊU CẦU ĐẶC BIỆT — ĐỀ CÓ CÔNG THỨC TOÁN HỌC:');
                P.push('- MỌI công thức, biểu thức, ký hiệu toán/lý/hóa trong CẢ 3 phần kết quả đều PHẢI viết bằng cú pháp TeX đặt trong $...$ (công thức trong dòng) hoặc $$...$$ (công thức riêng dòng) — định dạng markdown math.');
                P.push('- TUYỆT ĐỐI không dùng ký tự Unicode thay cho công thức (không viết x², √, π, α trực tiếp), không mô tả công thức bằng lời, không chèn ảnh công thức.');
                P.push('- QUAN TRỌNG để máy đọc được: trong phần JSON, mọi dấu gạch chéo ngược của lệnh TeX phải viết GẤP ĐÔI, ví dụ \\\\frac{1}{2}, \\\\sqrt{x}, \\\\pi — để chuỗi JSON hợp lệ.');
            }
            P.push('');
            P.push('CÁCH TRẢ KẾT QUẢ — trả về ĐÚNG 3 phần theo thứ tự sau, không thêm lời dẫn hay kết luận:');
            P.push('');
            P.push('===== PHẦN 1: MÃ ĐỀ CHO WEB =====');
            P.push('Xuất mã JSON thuần (không bọc trong khối markdown), gồm các object bộ đề liên tiếp, mỗi bộ đúng cấu trúc:');
            P.push('{"name":"Đề 1","questions":[ ... ]}');
            P.push('Mỗi câu trong "questions" là 1 object như mẫu:');
            P.push('{"id":"c1","type":"mcq","q":"nội dung câu hỏi","options":["lựa chọn 1","lựa chọn 2","lựa chọn 3","lựa chọn 4"],"answer":"A","explain":"lời giải chi tiết","points":0.25,"level":"NB","chapter":"tên bài/chương của câu"}');
            P.push('Quy tắc theo dạng câu:');
            P.push('- "mcq": options có đúng 4 lựa chọn (không ghi tiền tố A. B. C. D. vào nội dung lựa chọn); answer là 1 chữ cái "A", "B", "C" hoặc "D".');
            P.push('- "truefalse": q là một câu lệnh gồm 4 ý a) b) c) d); answer là object {"a":true,"b":false,"c":true,"d":false} (đúng = true, sai = false); points là điểm của cả câu.');
            P.push('- "short": answer là đáp án ngắn dạng chuỗi (số hoặc cụm từ ngắn).');
            P.push('- "essay": không có options và answer; trường "explain" PHẢI chứa barem chấm: từng ý cần đạt kèm số điểm của ý đó, tổng các ý bằng points.');
            P.push('- Mọi câu đều phải có explain (lời giải chi tiết hoặc barem), points đúng thang điểm trong ma trận, level đúng mức độ của câu, chapter là bài/chương câu hỏi thuộc về.');
            P.push('- Số câu của từng dạng × mức độ phải khớp TUYỆT ĐỐI với ma trận ở trên; các câu sắp xếp theo thứ tự: hết Nhận biết đến Vận dụng cao, trong mỗi mức độ xếp theo dạng câu.');
            P.push('- Công thức Toán/Lý/Hóa giữ nguyên cú pháp TeX trong $...$ hoặc $$...$$.');
            P.push('');
            P.push('===== PHẦN 2: MA TRẬN ĐỀ (để in) =====');
            P.push('Xuất bảng markdown: hàng là dạng câu hỏi, cột là các mức độ NB/TH/VD/VDC; mỗi ô ghi "số câu (số điểm)"; thêm cột Tổng câu và Tổng điểm, cùng một hàng Tỉ lệ % điểm của từng mức độ.');
            P.push('');
            P.push('===== PHẦN 3: BẢN ĐẶC TẢ ĐỀ (để in) =====');
            P.push('Xuất bảng markdown với các cột: STT | Đơn vị kiến thức | Mức độ | Dạng câu hỏi | Số điểm — liệt kê đủ mọi câu theo đúng thứ tự câu trong đề.');
            var out = document.getElementById('ai-prompt-out');
            if (out){ out.value = P.join('\n'); out.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            if (typeof showToast === 'function') showToast('Đã tạo prompt — bấm Sao chép rồi dán vào NotebookLM', 'success');
        }
        function aiCopyPrompt(){
            var out = document.getElementById('ai-prompt-out');
            if (!out || !out.value){ alert('Hãy bấm "Tạo prompt" trước.'); return; }
            out.select();
            navigator.clipboard.writeText(out.value).then(function(){
                if (typeof showToast === 'function') showToast('Đã sao chép prompt!', 'success');
            });
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
                window.SB_AI_WORD = {
                    subject: gv('ai-subject'), grade: gv('ai-grade'), time: gv('ai-time') || '45', title: gv('ai-title'),
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
            var totP = 0;
            W.sets.forEach(function(st){ (st.questions || []).forEach(function(q){ totP += parseFloat(q.points) || 0; }); });
            var h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(W.title || 'Đề kiểm tra') + '</title></head>'
                + '<body style="font-family:Times New Roman,serif;font-size:13pt;">'
                + '<h2 style="text-align:center;">' + esc((W.subject + ' ' + W.grade + ' — ' + (W.title || 'ĐỀ KIỂM TRA')).toUpperCase()) + '</h2>'
                + '<p style="text-align:center;">Thời gian làm bài: ' + esc(W.time) + ' phút • Tổng điểm: ' + (Math.round(totP * 100) / 100) + '</p>'
                + '<p>Họ và tên: ............................ Lớp: ..........</p><hr>';
            W.sets.forEach(function(st, si){
                if (W.sets.length > 1) h += '<h3>' + esc(st.name || ('Đề ' + (si + 1))) + '</h3>';
                (st.questions || []).forEach(function(q, i){
                    h += '<p><b>Câu ' + (i + 1) + ' (' + (q.points != null ? q.points : '') + 'đ):</b> ' + esc(q.q) + '</p>';
                    if (q.type === 'mcq' && q.options) q.options.forEach(function(op, oi){ h += '<p style="margin-left:24px;">' + 'ABCD'[oi] + '. ' + esc(op) + '</p>'; });
                    if (q.type === 'short') h += '<p style="margin-left:24px;">Trả lời: ....................</p>';
                    if (q.type === 'essay') h += '<p style="margin-left:24px;">............................................................................................</p><p style="margin-left:24px;">............................................................................................</p>';
                });
            });
            var mt = aiMdTableToHtml(W.matrixMd), sp = aiMdTableToHtml(W.specMd);
            if (mt) h += '<br clear="all" style="page-break-before:always;"><h3>MA TRẬN ĐỀ</h3>' + mt;
            if (sp) h += '<h3 style="margin-top:18px;">BẢN ĐẶC TẢ ĐỀ</h3>' + sp;
            h += '<br clear="all" style="page-break-before:always;"><h3>ĐÁP ÁN & BAREM (dành cho giáo viên)</h3>';
            W.sets.forEach(function(st){
                (st.questions || []).forEach(function(q, i){
                    var a = q.answer;
                    var aTxt = (a == null) ? '(tự luận — barem ở dưới)' : (typeof a === 'object' ? Object.keys(a).map(function(k){ return k + ': ' + (a[k] ? 'Đúng' : 'Sai'); }).join('; ') : String(a));
                    h += '<p><b>Câu ' + (i + 1) + ':</b> ' + esc(aTxt) + (q.explain ? '<br><i>' + esc(q.explain) + '</i>' : '') + '</p>';
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
