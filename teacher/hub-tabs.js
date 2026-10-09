        // ========================================================
        // 3 CHE DO DAY: Ly thuyet / Soan de tu bank / Day truc tiep (2026-10-08)
        // ========================================================
        let currentPushTab = 'theory'; // 'theory' | 'bank' | 'direct'

        function switchPushMode(mode) {
            currentPushTab = mode;
            let isExam = (mode !== 'theory');
            let base = 'flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center ';
            let on = { theory: 'bg-blue-700 text-white shadow', bank: 'bg-amber-500 text-white shadow', direct: 'bg-indigo-700 text-white shadow' };
            let off = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            let bT = document.getElementById('push-mode-theory');
            let bB = document.getElementById('push-mode-bank');
            let bD = document.getElementById('push-mode-direct');
            if (bT) bT.className = base + (mode === 'theory' ? on.theory : off);
            if (bB) bB.className = base + (mode === 'bank' ? on.bank : off);
            if (bD) bD.className = base + (mode === 'direct' ? on.direct : off);

            let panelT = document.getElementById('prompt-panel-theory');
            let panelE = document.getElementById('prompt-panel-exam');
            if (panelT) panelT.classList.toggle('hidden', isExam);
            if (panelE) panelE.classList.toggle('hidden', !isExam);
            // Panel builder (ngan hang de) mo mem o che do bank
            let bp = document.getElementById('exam-builder-panel');
            if (bp){ bp.classList.remove('hidden'); bp.classList.toggle('open', mode === 'bank'); }
            // Toggle che do con (chi hien o che do de thi)
            let subToggle = document.getElementById('exam-submode-toggle');
            if (subToggle) subToggle.classList.toggle('hidden', !isExam);
            if (isExam) {
                // Mac dinh mo che do "Tao de moi" khi vao tab de thi
                switchExamSubMode('create');
            } else {
                // Ve theory mode: dam bao form hien (reset sub-mode)
                let boxC = document.getElementById('bo-tao-prompt-box');
                let boxE = document.getElementById('exam-form-box');
                if (boxC) boxC.classList.remove('hidden');
                if (boxE) boxE.classList.remove('hidden');
                let bp = document.getElementById('exam-builder-panel');
                let dp = document.getElementById('direct-panel');
                if (bp) bp.style.display = '';
                if (dp) dp.style.display = '';
            }
            // Panel day truc tiep mo mem o che do direct
            let dp = document.getElementById('direct-panel');
            if (dp){ dp.classList.remove('hidden'); dp.classList.toggle('open', mode === 'direct'); }

            // Đồng bộ loại bài đẩy ẩn theo chế độ (đề thi luôn EXAM_LONG)
            let itemType = document.getElementById('item-type');
            if (itemType) itemType.value = isExam ? 'EXAM_LONG' : 'KNOWLEDGE';
            refreshPushSubmitBtn();
            updateScorePreview();
        }
        // ========================================================
        // 2 CHE DO CON TRONG TAB DE THI: Tao de moi / Soan tay (2026-10-09)
        // ========================================================
        let currentExamSubMode = 'create'; // 'create' | 'edit'

        function switchExamSubMode(mode) {
            currentExamSubMode = mode;
            let isCreate = (mode === 'create');
            let base = 'flex-1 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center ';
            let onC = 'bg-violet-700 text-white shadow';
            let onE = 'bg-indigo-700 text-white shadow';
            let off = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            let bC = document.getElementById('exam-submode-create');
            let bE = document.getElementById('exam-submode-edit');
            if (bC) bC.className = base + (isCreate ? onC : off);
            if (bE) bE.className = base + (isCreate ? off : onE);

            // Create mode: hiện khung tạo prompt (ma trận), ẩn form soạn
            // Edit mode: ẩn khung tạo prompt, hiện form soạn/đẩy
            let boxC = document.getElementById('bo-tao-prompt-box');
            let boxE = document.getElementById('exam-form-box');
            if (boxC) boxC.classList.toggle('hidden', !isCreate);
            if (boxE) boxE.classList.toggle('hidden', isCreate);
            // Panel builder (bank) và direct panel chỉ hiện ở chế độ edit
            let bp = document.getElementById('exam-builder-panel');
            let dp = document.getElementById('direct-panel');
            if (bp) bp.style.display = isCreate ? 'none' : '';
            if (dp) dp.style.display = isCreate ? 'none' : '';
        }

        // Alias cu (tuong thich)
        function switchPushTab(mode){ switchPushMode(mode === 'exam' ? 'direct' : 'theory'); }
        function toggleDirectPanel(){ switchPushMode('direct'); }

        // 2 dạng nhập trong panel trực tiếp: dán AI / file Word
        function switchDirectInput(mode){
            let isWord = (mode === 'word');
            let box = document.getElementById('direct-word-box');
            let hint = document.getElementById('direct-ai-hint');
            if (box) box.classList.toggle('hidden', !isWord);
            if (hint) hint.classList.toggle('hidden', isWord);
            let tA = document.getElementById('direct-tab-ai'), tW = document.getElementById('direct-tab-word');
            if (tA) tA.className = 'flex-1 px-3 py-2 rounded-lg text-xs font-bold ' + (isWord ? 'bg-white text-indigo-800 border border-indigo-200' : 'bg-indigo-700 text-white shadow');
            if (tW) tW.className = 'flex-1 px-3 py-2 rounded-lg text-xs font-bold ' + (isWord ? 'bg-indigo-700 text-white shadow' : 'bg-white text-indigo-800 border border-indigo-200');
        }


        function refreshPushSubmitBtn() {
            let btn = document.getElementById('submit-btn');
            if (!btn) return;
            btn.disabled = false;
            if (currentPushTab === 'exam') {
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
