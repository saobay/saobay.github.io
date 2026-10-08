        // ========================================================
        // KHUNG XEM TRƯỚC TRỰC QUAN & RENDER NỘI DUNG
        // ========================================================
        function renderMathPreview() {
            let rawContent = document.getElementById('item-content').value;
            let previewBox = document.getElementById('preview-container');
            if (!previewBox) return;

            if (!rawContent || !rawContent.trim()) {
                previewBox.innerHTML = `
                    <div class="text-center py-16 text-slate-400 space-y-3" contenteditable="false">
                        <i class="fa-solid fa-file-lines text-4xl text-slate-300"></i>
                        <p class="text-sm font-semibold text-slate-600">Khung soạn thảo & xem trước bài học</p>
                        <p class="text-xs text-slate-400 max-w-md mx-auto">Vui lòng tải file Word (.docx), bấm nút <b>"Dán từ NotebookLM"</b> hoặc gõ trực tiếp nội dung tại đây để bắt đầu bài học.</p>
                    </div>
                `;
                return;
            }

            let cleaned = cleanAndDecodeHtml(rawContent);
            document.getElementById('item-content').value = cleaned;

            let stylesHtml = '';
            let bodyHtml = cleaned;

            if (cleaned.includes('<html') || cleaned.includes('<!DOCTYPE') || cleaned.includes('<body')) {
                try {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(cleaned, 'text/html');
                    let styleTags = doc.querySelectorAll('style');
                    stylesHtml = Array.from(styleTags).map(s => s.outerHTML).join('\n');
                    if (doc.body) {
                        bodyHtml = doc.body.innerHTML;
                    }
                } catch(e) {}
            }

            previewBox.innerHTML = `
                <div class="preview-rendered-body space-y-4">
                    ${stylesHtml}
                    ${bodyHtml}
                </div>
            `;

            // Bọc các công thức toán học thành badge có thể click sửa trực tiếp
            wrapMathInBadges(previewBox);

            // Thực thi scripts bài tập nếu có
            try {
                let parser = new DOMParser();
                let parsedDoc = parser.parseFromString(bodyHtml, 'text/html');
                let scriptTags = parsedDoc.querySelectorAll('script');
                scriptTags.forEach(sc => {
                    if (sc.src && (sc.src.includes('tailwindcss') || sc.src.includes('mathjax'))) return;
                    if (sc.textContent && (sc.textContent.includes('MathJax') || sc.textContent.includes('mathjax'))) return;
                    if (sc.type === 'application/json') return; // dữ liệu 10 bộ đề, không thực thi
                    let s = document.createElement('script');
                    if (sc.src) s.src = sc.src;
                    else s.textContent = sc.textContent;
                    previewBox.appendChild(s);
                });
            } catch(eSc) {
                console.log('Script preview note:', eSc);
            }

            // MathJax render công thức
            if (window.MathJax) {
                try {
                    if (window.MathJax.typesetClear) window.MathJax.typesetClear([previewBox]);
                    if (window.MathJax.typesetPromise) {
                        window.MathJax.typesetPromise([previewBox]).catch(e => {
                            if (window.MathJax.typeset) window.MathJax.typeset([previewBox]);
                        });
                    } else if (window.MathJax.typeset) {
                        window.MathJax.typeset([previewBox]);
                    }
                } catch(eMj) {}
            }

            // Đồng bộ sạch sẽ
            syncVisualToItemContent();
        }

        async function pasteFromClipboard() {
            try {
                let text = '';
                if (navigator.clipboard && navigator.clipboard.readText) {
                    text = await navigator.clipboard.readText();
                }
                if (!text || !text.trim()) {
                    text = prompt("Dán mã HTML hoặc nội dung sao chép từ NotebookLM vào đây:");
                }
                if (!text || !text.trim()) return;

                let cleaned = cleanAndDecodeHtml(text);
                document.getElementById('item-content').value = cleaned;

                // Tự động nhận diện tiêu đề bài nếu ô tiêu đề đang trống
                let titleInput = document.getElementById('item-title');
                if (!titleInput.value.trim()) {
                    let matchH1 = cleaned.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                    let matchH2 = cleaned.match(/<h2[^>]*>([^<]+)<\/h2>/i);
                    if (matchH1 && matchH1[1]) {
                        titleInput.value = matchH1[1].trim();
                    } else if (matchH2 && matchH2[1]) {
                        titleInput.value = matchH2[1].trim();
                    }
                }

                renderMathPreview();
                showToast("Đã nạp nội dung từ Clipboard vào khung xem trước!", "success");
            } catch(e) {
                let text = prompt("Dán mã HTML hoặc nội dung sao chép từ NotebookLM vào đây:");
                if (text && text.trim()) {
                    let cleaned = cleanAndDecodeHtml(text);
                    document.getElementById('item-content').value = cleaned;
                    renderMathPreview();
                    showToast("Đã nạp nội dung vào khung xem trước!", "success");
                }
            }
        }
