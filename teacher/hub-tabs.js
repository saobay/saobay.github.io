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
            let isExam = isBank || isDirect;
            let base = 'flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center ';
            let on = { theory: 'bg-blue-700 text-white shadow', exercise: 'bg-amber-500 text-white shadow', bank: 'bg-amber-500 text-white shadow', direct: 'bg-indigo-700 text-white shadow' };
            let off = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            let bT = document.getElementById('push-mode-theory');
            let bE = document.getElementById('push-mode-exercise');
            let bB = document.getElementById('push-mode-bank');
            let bD = document.getElementById('push-mode-direct');
            if (bT) bT.className = base + (mode === 'theory' ? on.theory : off);
            if (bE) bE.className = base + (mode === 'exercise' ? on.exercise : off);
            if (bB) bB.className = base + (mode === 'bank' ? on.bank : off);
            if (bD) bD.className = base + (mode === 'direct' ? on.direct : off);

            // Helper hiện/ẩn dứt khoát (2026-10-10: fix trắng trang theory/exercise)
            function setVis(id, show){
                let el = document.getElementById(id);
                if (el) el.style.display = show ? '' : 'none';
            }

            // Box prompt/AI: hiện ở exam (chứa prompt-panel-exam); form soạn (exam-form-box) đã tách ra ngoài nên luôn hiện mọi chế độ (2026-10-10)
            setVis('bo-tao-prompt-box', isExam);
            // Cây thư mục: chỉ hiện ở Đẩy Lý Thuyết / Đẩy Bài Tập (2026-10-10)
            let sb = document.getElementById('sidebar-container');
            if (sb) sb.classList.toggle('hidden', !(isTheory || isExercise));
            // Box Copy Prompt: đúng chế độ
            setVis('theory-copy-prompt-box', isTheory);
            setVis('exercise-copy-prompt-box', isExercise);

            // Tiêu đề khung đẩy nội dung đổi theo chế độ (2026-10-10)
            let upT = document.getElementById('push-upload-title');
            if (upT) upT.textContent = isExercise ? 'Đưa nội dung bài tập lên web' : (isExam ? 'Soạn & đưa đề thi lên web' : 'Đưa nội dung bài học lên web');

            // Ma trận đề: chỉ hiện ở bank (2026-10-10: gộp nút ma trận vào nút bank trên cùng)
            setVis('exam-matrix-panel', isExam);

            // Panel builder ngân hàng: mở ở bank
            let bp = document.getElementById('exam-builder-panel');
            if (bp){ bp.classList.toggle('open', isBank); bp.style.display = isBank ? '' : 'none'; }

            // Panel đẩy trực tiếp: mở ở direct
            let dp = document.getElementById('direct-panel');
            if (dp){ dp.classList.toggle('open', isDirect); dp.style.display = isDirect ? '' : 'none'; }

            // Lịch kiểm tra chống lộ đề (checkbox "Đây là ĐỀ KIỂM TRA"): cả 2 chế độ đề thi
            setVis('exam-schedule-box', isExam);

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
            if (isExam && typeof loadLessonDropdowns === 'function'){
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
            } else if (currentPushTab === 'exam') {
                btn.className = 'bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg transition flex items-center';
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-2"></i> Lưu & Đẩy Đề Thi / Bài Tập';
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
