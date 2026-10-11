        // ========================================================
        // KHUNG XEM TRƯỚC TRỰC QUAN & RENDER NỘI DUNG
        // ========================================================
        // 2026-10-11: Render dang HOC SINH LAM BAI (khong hien dap an, co radio de chon)
        function renderStudentPreview() {
            let rawContent = document.getElementById('item-content').value;
            let previewBox = document.getElementById('preview-container');
            if (!previewBox) return;
            let esc = function(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
            try {
                let m = rawContent.match(/<script[^>]*class=["']saobay-exam10-data["'][^>]*>([\s\S]*?)<\/script>/);
                if (!m){
                    previewBox.innerHTML = '<p class="text-center text-slate-400 py-10">Chưa có đề thi để xem. Hãy đưa câu hỏi vào khung soạn trước.</p>';
                    return;
                }
                let examJson = JSON.parse(m[1]);
                let questions = (examJson.sets && examJson.sets[0] && examJson.sets[0].questions) || [];
                if (!questions.length){
                    previewBox.innerHTML = '<p class="text-center text-slate-400 py-10">Chưa có câu hỏi nào.</p>';
                    return;
                }
                let h = '<div class="max-w-3xl mx-auto space-y-4 p-2">';
                h += '<div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center"><p class="font-black text-blue-900">ĐỀ KIỂM TRA</p><p class="text-xs text-blue-700">' + questions.length + ' câu — Học sinh làm bài</p></div>';
                questions.forEach(function(q, i){
                    h += '<div class="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">';
                    h += '<p class="font-bold text-slate-800 mb-2"><span class="text-blue-600 mr-1">Câu ' + (i+1) + ':</span>' + esc(q.q) + '</p>';
                    if (q.img){
                        h += '<img src="' + q.img + '" class="max-w-full rounded-lg my-2" style="max-height:300px"/>';
                    }
                    let opts = q.options || [];
                    if (opts.length){
                        h += '<div class="space-y-1.5 mt-2">';
                        opts.forEach(function(op, oi){
                            let letter = String.fromCharCode(65 + oi);
                            h += '<label class="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:bg-blue-50 cursor-pointer">'
                                + '<input type="radio" name="sq' + i + '" class="mt-1"/>'
                                + '<span class="font-bold text-slate-700">' + letter + '.</span>'
                                + '<span class="text-slate-700">' + esc(op) + '</span></label>';
                        });
                        h += '</div>';
                    }
                    let sts = q.statements || [];
                    if (sts.length){
                        h += '<div class="space-y-1.5 mt-2">';
                        sts.forEach(function(st, si){
                            let txt = (st && typeof st === 'object') ? (st.s || '') : st;
                            h += '<div class="flex items-center gap-2 p-2 rounded-lg border border-slate-200">'
                                + '<span class="font-bold">' + 'abcd'[si] + ')</span><span class="flex-1">' + esc(txt) + '</span>'
                                + '<label class="flex items-center gap-1 text-xs"><input type="radio" name="st' + i + '_' + si + '"/> Đúng</label>'
                                + '<label class="flex items-center gap-1 text-xs"><input type="radio" name="st' + i + '_' + si + '"/> Sai</label></div>';
                        });
                        h += '</div>';
                    }
                    if ((q.type === 'short' || q.type === 'essay') && !opts.length && !sts.length){
                        h += '<input type="text" placeholder="Nhập câu trả lời..." class="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"/>';
                    }
                    h += '</div>';
                });
                h += '<div class="text-center py-4"><button class="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Nộp bài</button></div>';
                h += '</div>';
                previewBox.innerHTML = h;
            } catch(e){
                previewBox.innerHTML = '<p class="text-center text-rose-500 py-10">Lỗi render: ' + esc(e.message) + '</p>';
            }
        }
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
