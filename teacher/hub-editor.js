        // ========================================================
        // KHUNG SOẠN THẢO TRỰC QUAN (WYSIWYG) & QUẢN LÝ CÔNG THỨC TOÁN
        // ========================================================
        let currentEditingMathBadge = null;
        let visualChangeTimer = null;
        let mathModalTimer = null;

        // Chuyển đổi giữa 3 chế độ: Trực quan (visual), Học sinh (student), Mã HTML (code)
        function setEditorMode(mode) {
            let previewBox = document.getElementById('preview-container');
            let itemContent = document.getElementById('item-content');
            let formatToolbar = document.getElementById('visual-format-toolbar');
            let statusEl = document.getElementById('editor-status-indicator');

            let btnVisual = document.getElementById('mode-btn-visual');
            let btnStudent = document.getElementById('mode-btn-student');
            let btnCode = document.getElementById('mode-btn-code');

            [btnVisual, btnStudent, btnCode].forEach(btn => {
                if (btn) btn.className = "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center";
            });

            if (mode === 'visual') {
                btnVisual.className = "bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition flex items-center";
                previewBox.classList.remove('hidden');
                itemContent.classList.add('hidden');
                previewBox.contentEditable = "true";
                previewBox.classList.add('border-emerald-400', 'focus:ring-2', 'focus:ring-emerald-400');
                previewBox.classList.remove('border-slate-300');
                if (formatToolbar) formatToolbar.classList.remove('hidden');
                if (statusEl) {
                    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span><span>Gõ sửa trực tiếp trên màn hình</span>`;
                    statusEl.className = "inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md";
                }
            } else if (mode === 'student') {
                btnStudent.className = "bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition flex items-center";
                previewBox.classList.remove('hidden');
                itemContent.classList.add('hidden');
                previewBox.contentEditable = "false";
                previewBox.classList.remove('border-emerald-400', 'focus:ring-2', 'focus:ring-emerald-400');
                previewBox.classList.add('border-slate-300');
                if (formatToolbar) formatToolbar.classList.add('hidden');
                if (statusEl) {
                    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span><span>Xem trước (Học sinh làm thử)</span>`;
                    statusEl.className = "inline-flex items-center text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md";
                }
            } else if (mode === 'code') {
                syncVisualToItemContent();
                btnCode.className = "bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition flex items-center";
                previewBox.classList.add('hidden');
                itemContent.classList.remove('hidden');
                if (formatToolbar) formatToolbar.classList.add('hidden');
                if (statusEl) {
                    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span><span>Biên tập mã HTML thô</span>`;
                    statusEl.className = "inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md";
                }
            }
        }

        // Định dạng văn bản nhanh bằng execCommand
        function formatText(command, value = null) {
            document.execCommand(command, false, value);
            syncVisualToItemContent();
        }

        // Lắng nghe khi người dùng gõ sửa trên giao diện trực quan
        function onVisualContentChange() {
            clearTimeout(visualChangeTimer);
            visualChangeTimer = setTimeout(() => {
                syncVisualToItemContent();
            }, 300);
        }

        // Lắng nghe khi người dùng sửa trong textarea HTML thô
        function onRawHtmlChange() {
            clearTimeout(window._rawHtmlTimer);
            window._rawHtmlTimer = setTimeout(() => {
                let raw = document.getElementById('item-content').value;
                let previewBox = document.getElementById('preview-container');
                if (previewBox && raw) {
                    previewBox.innerHTML = raw;
                    wrapMathInBadges(previewBox);
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        window.MathJax.typesetPromise([previewBox]).catch(e => {});
                    }
                }
            }, 500);
        }

        // Đồng bộ từ giao diện trực quan về textarea ẩn (loại bỏ thẻ rác, khôi phục TeX nguyên bản)
        function syncVisualToItemContent() {
            let previewBox = document.getElementById('preview-container');
            let itemContent = document.getElementById('item-content');
            if (!previewBox || !itemContent) return;

            // Nếu chỉ là nội dung placeholder rỗng
            if (previewBox.querySelector('.fa-file-lines') && !previewBox.querySelector('.bai-giang-container, .question-card, h1, h2, h3, p:not(.max-w-md)')) {
                return;
            }

            let cleanHtml = getCleanHtmlFromVisual(previewBox);
            itemContent.value = cleanHtml;
        }

        // Hàm khôi phục mã HTML sạch: Chuyển badge công thức toán về $...$ hoặc $$...$$
        function getCleanHtmlFromVisual(container) {
            if (!container) return '';
            let clone = container.cloneNode(true);

            clone.querySelectorAll('.math-badge').forEach(badge => {
                let latex = badge.getAttribute('data-latex') || '';
                let isDisplay = badge.getAttribute('data-display') === 'true';
                let delimiter = isDisplay ? '$$' : '$';
                let textNode = document.createTextNode(`${delimiter}${latex}${delimiter}`);
                badge.replaceWith(textNode);
            });

            clone.querySelectorAll('mjx-container, script[type*="mathjax"], style[id*="MJX"]').forEach(el => el.remove());
            clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

            return clone.innerHTML;
        }

        // Bọc các công thức toán $...$ và $$...$$ thành thẻ badge tương tác có thể click sửa
        function wrapMathInBadges(container) {
            if (!container) return;

            let walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        let parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        let tag = parent.tagName.toLowerCase();
                        if (['script', 'style', 'textarea', 'pre', 'code'].includes(tag)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (parent.closest('.math-badge')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.nodeValue && node.nodeValue.includes('$')) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            );

            let nodesToProcess = [];
            while (walker.nextNode()) {
                nodesToProcess.push(walker.currentNode);
            }

            nodesToProcess.forEach(textNode => {
                let text = textNode.nodeValue;
                if (!text || !text.includes('$')) return;

                let regex = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/g;
                if (!regex.test(text)) return;
                regex.lastIndex = 0;

                let fragment = document.createDocumentFragment();
                let lastIdx = 0;
                let match;

                while ((match = regex.exec(text)) !== null) {
                    if (match.index > lastIdx) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
                    }

                    let isDisplay = !!match[1];
                    let latex = (isDisplay ? match[1] : match[2]).trim();

                    let badge = document.createElement('span');
                    badge.className = isDisplay 
                        ? 'math-badge math-badge-display block my-2 mx-auto text-center' 
                        : 'math-badge inline-flex items-center';
                    badge.setAttribute('contenteditable', 'false');
                    badge.setAttribute('data-latex', latex);
                    badge.setAttribute('data-display', isDisplay ? 'true' : 'false');
                    badge.setAttribute('title', 'Bấm vào để sửa công thức toán này');
                    badge.onclick = function(e) { openMathFormulaModalForElement(badge, e); };

                    let targetSpan = document.createElement('span');
                    targetSpan.className = 'math-render-target';
                    targetSpan.textContent = isDisplay ? `$$${latex}$$` : `$${latex}$`;
                    badge.appendChild(targetSpan);

                    let editIcon = document.createElement('i');
                    editIcon.className = 'fa-solid fa-pen-to-square math-edit-icon';
                    badge.appendChild(editIcon);

                    fragment.appendChild(badge);
                    lastIdx = regex.lastIndex;
                }

                if (lastIdx < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
                }

                if (textNode.parentNode) {
                    textNode.parentNode.replaceChild(fragment, textNode);
                }
            });

            container.querySelectorAll('.math-badge').forEach(badge => {
                badge.onclick = function(e) { openMathFormulaModalForElement(badge, e); };
            });
        }

        // ========================================================
        // MODAL BIÊN SOẠN & SỬA CÔNG THỨC TOÁN (MATHJAX)
        // ========================================================
        function openMathFormulaModal(initialLatex) {
            currentEditingMathBadge = null;
            let latex = initialLatex || '';

            if (!latex) {
                let selection = window.getSelection();
                if (selection && selection.toString().trim()) {
                    latex = selection.toString().trim().replace(/^\$+|\$+$/g, '');
                }
            }

            document.getElementById('math-modal-title').innerText = 'Chèn Công Thức Toán Học Mới';
            document.getElementById('math-latex-input').value = latex || '\\frac{a}{b}';
            document.getElementById('math-type-inline').checked = true;
            document.getElementById('math-delete-btn').classList.add('hidden');
            document.getElementById('math-apply-btn').innerHTML = '<i class="fa-solid fa-plus mr-1.5"></i> Chèn Vào Bài Học';

            updateMathModalPreview();
            document.getElementById('math-formula-modal').classList.remove('hidden');
        }

        function openMathFormulaModalForElement(badgeEl, event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            currentEditingMathBadge = badgeEl;
            let latex = badgeEl.getAttribute('data-latex') || '';
            let isDisplay = badgeEl.getAttribute('data-display') === 'true';

            document.getElementById('math-modal-title').innerText = 'Chỉnh Sửa Công Thức Toán Học';
            document.getElementById('math-latex-input').value = latex;
            if (isDisplay) {
                document.getElementById('math-type-display').checked = true;
            } else {
                document.getElementById('math-type-inline').checked = true;
            }
            document.getElementById('math-delete-btn').classList.remove('hidden');
            document.getElementById('math-apply-btn').innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Cập Nhật Công Thức';

            updateMathModalPreview();
            document.getElementById('math-formula-modal').classList.remove('hidden');
        }

        function closeMathFormulaModal() {
            document.getElementById('math-formula-modal').classList.add('hidden');
            currentEditingMathBadge = null;
        }

        function insertLatexSymbol(code) {
            let input = document.getElementById('math-latex-input');
            if (!input) return;
            let start = input.selectionStart || 0;
            let end = input.selectionEnd || 0;
            let val = input.value;
            input.value = val.substring(0, start) + code + val.substring(end);
            input.selectionStart = input.selectionEnd = start + code.length;
            input.focus();
            updateMathModalPreview();
        }

        function updateMathModalPreview() {
            clearTimeout(mathModalTimer);
            mathModalTimer = setTimeout(() => {
                let latex = (document.getElementById('math-latex-input').value || '').trim();
                let isDisplay = document.getElementById('math-type-display').checked;
                let pBox = document.getElementById('math-modal-preview-box');
                if (!pBox) return;

                if (!latex) {
                    pBox.innerHTML = '<span class="text-slate-400 italic text-xs">Chưa có công thức...</span>';
                    return;
                }

                pBox.innerHTML = isDisplay ? `$$${latex}$$` : `$${latex}$`;
                if (window.MathJax) {
                    try {
                        if (window.MathJax.typesetClear) window.MathJax.typesetClear([pBox]);
                        if (window.MathJax.typesetPromise) {
                            window.MathJax.typesetPromise([pBox]).catch(err => {
                                pBox.innerHTML = `<span class="text-rose-600 text-xs font-semibold">⚠️ Lỗi cú pháp: ${err.message}</span>`;
                            });
                        } else if (window.MathJax.typeset) {
                            window.MathJax.typeset([pBox]);
                        }
                    } catch(e) {
                        pBox.innerHTML = `<span class="text-rose-600 text-xs font-semibold">⚠️ Lỗi TeX: ${e.message}</span>`;
                    }
                }
            }, 120);
        }

        function applyMathFormula() {
            let latex = document.getElementById('math-latex-input').value.trim();
            if (!latex) {
                alert('Vui lòng nhập mã công thức LaTeX!');
                return;
            }
            let isDisplay = document.getElementById('math-type-display').checked;

            if (currentEditingMathBadge) {
                currentEditingMathBadge.setAttribute('data-latex', latex);
                currentEditingMathBadge.setAttribute('data-display', isDisplay ? 'true' : 'false');
                currentEditingMathBadge.className = isDisplay 
                    ? 'math-badge math-badge-display block my-2 mx-auto text-center' 
                    : 'math-badge inline-flex items-center';

                let targetSpan = currentEditingMathBadge.querySelector('.math-render-target');
                if (!targetSpan) {
                    targetSpan = document.createElement('span');
                    targetSpan.className = 'math-render-target';
                    currentEditingMathBadge.prepend(targetSpan);
                }
                targetSpan.innerHTML = isDisplay ? `$$${latex}$$` : `$${latex}$`;

                if (window.MathJax) {
                    try {
                        if (window.MathJax.typesetClear) window.MathJax.typesetClear([currentEditingMathBadge]);
                        if (window.MathJax.typesetPromise) window.MathJax.typesetPromise([currentEditingMathBadge]);
                        else if (window.MathJax.typeset) window.MathJax.typeset([currentEditingMathBadge]);
                    } catch(e) {}
                }
                showToast('Đã cập nhật công thức toán!', 'success');
            } else {
                let badge = document.createElement('span');
                badge.className = isDisplay 
                    ? 'math-badge math-badge-display block my-2 mx-auto text-center' 
                    : 'math-badge inline-flex items-center';
                badge.setAttribute('contenteditable', 'false');
                badge.setAttribute('data-latex', latex);
                badge.setAttribute('data-display', isDisplay ? 'true' : 'false');
                badge.setAttribute('title', 'Bấm vào để sửa công thức toán này');
                badge.onclick = function(e) { openMathFormulaModalForElement(badge, e); };

                let targetSpan = document.createElement('span');
                targetSpan.className = 'math-render-target';
                targetSpan.innerHTML = isDisplay ? `$$${latex}$$` : `$${latex}$`;
                badge.appendChild(targetSpan);

                let editIcon = document.createElement('i');
                editIcon.className = 'fa-solid fa-pen-to-square math-edit-icon';
                badge.appendChild(editIcon);

                let previewBox = document.getElementById('preview-container');
                insertNodeAtCursor(badge, previewBox);

                if (window.MathJax) {
                    try {
                        if (window.MathJax.typesetPromise) window.MathJax.typesetPromise([badge]);
                        else if (window.MathJax.typeset) window.MathJax.typeset([badge]);
                    } catch(e) {}
                }
                showToast('Đã chèn công thức toán vào bài!', 'success');
            }

            syncVisualToItemContent();
            closeMathFormulaModal();
        }

        function deleteCurrentMathBadge() {
            if (currentEditingMathBadge) {
                if (confirm('Bạn có chắc muốn xóa công thức toán này khỏi bài?')) {
                    currentEditingMathBadge.remove();
                    syncVisualToItemContent();
                    closeMathFormulaModal();
                    showToast('Đã xóa công thức toán!', 'info');
                }
            }
        }

        function insertNodeAtCursor(node, fallbackContainer) {
            let sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let range = sel.getRangeAt(0);
                if (fallbackContainer && fallbackContainer.contains(range.commonAncestorContainer)) {
                    range.deleteContents();
                    range.insertNode(node);
                    range.setStartAfter(node);
                    range.setEndAfter(node);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return;
                }
            }
            if (fallbackContainer) {
                fallbackContainer.appendChild(node);
            }
        }

        function refreshVisualMathJax() {
            syncVisualToItemContent();
            renderMathPreview();
            showToast('Đã làm mới công thức toán và nội dung!', 'success');
        }
