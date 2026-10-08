        // ========================================================
        // TAB TÁCH GIAO DIỆN ĐẨY BÀI: Lý thuyết / Đề thi-Bài tập (2026-10-08)
        // ========================================================
        let currentPushTab = 'theory'; // 'theory' | 'exam'

        function switchPushTab(mode) {
            currentPushTab = mode;
            let isExam = (mode === 'exam');

            let tabT = document.getElementById('push-tab-theory');
            let tabE = document.getElementById('push-tab-exam');
            if (tabT) tabT.className = 'flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center ' + (isExam ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-700 text-white shadow');
            if (tabE) tabE.className = 'flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center ' + (isExam ? 'bg-indigo-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200');

            let panelT = document.getElementById('prompt-panel-theory');
            let panelE = document.getElementById('prompt-panel-exam');
            if (panelT) panelT.classList.toggle('hidden', isExam);
            if (panelE) panelE.classList.toggle('hidden', !isExam);

            // Đồng bộ loại bài đẩy ẩn theo tab
            let itemType = document.getElementById('item-type');
            if (itemType) {
                if (isExam) {
                    let lenSel = document.getElementById('exam-length');
                    itemType.value = lenSel ? lenSel.value : 'EXAM_LONG';
                } else {
                    itemType.value = 'KNOWLEDGE';
                }
            }
            refreshPushSubmitBtn();
            updateScorePreview();
        }

        function syncExamLength() {
            let lenSel = document.getElementById('exam-length');
            let itemType = document.getElementById('item-type');
            if (lenSel && itemType && currentPushTab === 'exam') {
                itemType.value = lenSel.value;
                updateScorePreview();
            }
        }

        // Chon nguon de khi day: "fixed" = giu nguyen noi dung dan vao;
        // "bank" = noi dung dan vao van luu bank, file day len la file cau noi
        function syncExamSource() {
            let sel = document.getElementById('exam-source');
            let cfg = document.getElementById('bank-source-config');
            if (!sel || !cfg) return;
            let isBank = sel.value === 'bank';
            cfg.classList.toggle('hidden', !isBank);
            cfg.classList.toggle('flex', isBank);
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
