        // ========================================================
        // QUẢN LÝ MODAL QUY TẮC SOẠN ĐỀ & BỘ MÁY CHẤM ĐIỂM TƯƠNG TÁC
        // ========================================================
        const MASTER_PROMPT_TEMPLATE = `Xuất DUY NHẤT mã HTML (raw code) Đề thi chuẩn đánh giá năng lực Môn: [TÊN MÔN] - Lớp: [LỚP]. Chủ đề: "[TÊN CHỦ ĐỀ]".
YÊU CẦU:
1. Đa dạng 7 dạng bài: Trắc nghiệm 4 lựa chọn (mcq_4: <input type="radio">, data-answer="A|B|C|D"), Đúng/Sai 4 ý (true_false: data-answer="a:T|b:F|c:T|d:F"), Trả lời ngắn (short_answer), Điền khuyết (fill_blank), Nối cột (matching), Sắp xếp (ordering), Tự luận (essay kèm barem).
2. Mỗi câu là 1 block: <div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5" data-question-id="q1" data-type="..." data-level="NB|TH|VD|VDC" data-answer="...">. Có huy hiệu mức độ [NB]/[TH]/[VD]/[VDC], nút check đáp án và lời giải chi tiết.
3. Công thức Toán: Giữ nguyên 100% cú pháp TeX trong $...$ hoặc $$...$$.
4. Chỉ xuất thuần mã HTML nguyên bản, không văn bản thừa.`;

        function openExamGuidelineModal() {
            let area = document.getElementById('master-prompt-textarea');
            if (area) area.value = MASTER_PROMPT_TEMPLATE;
            switchGuidelineTab(1);
            document.getElementById('exam-guideline-modal').classList.remove('hidden');
        }

        function closeExamGuidelineModal() {
            document.getElementById('exam-guideline-modal').classList.add('hidden');
        }

        function switchGuidelineTab(tabIdx) {
            [1, 2, 3].forEach(idx => {
                let btn = document.getElementById(`guideline-tab-btn-${idx}`);
                let content = document.getElementById(`guideline-tab-content-${idx}`);
                if (btn && content) {
                    if (idx === tabIdx) {
                        btn.className = "px-4 py-2 border-b-2 border-blue-600 text-blue-800 bg-white rounded-t-lg transition flex items-center";
                        content.classList.remove('hidden');
                    } else {
                        btn.className = "px-4 py-2 border-b-2 border-transparent text-slate-600 hover:text-blue-700 rounded-t-lg transition flex items-center";
                        content.classList.add('hidden');
                    }
                }
            });
        }

        function copyMasterPromptOnly() {
            navigator.clipboard.writeText(MASTER_PROMPT_TEMPLATE).then(() => {
                showToast("Đã sao chép Prompt Master vào Clipboard!", "success");
            }).catch(() => {
                showToast("Vui lòng cấp quyền copy!", "error");
            });
        }

        async function copyExamGuidelineFull() {
            try {
                let res = await fetch('QUY_TAC_SOAN_DE.md');
                let fullText = '';
                if (res.ok) {
                    fullText = await res.text();
                } else {
                    fullText = MASTER_PROMPT_TEMPLATE;
                }
                await navigator.clipboard.writeText(fullText);
                showToast("Đã sao chép toàn bộ Quy tắc soạn đề! Dán vào Google Docs hoặc NotebookLM ngay.", "success");
            } catch(e) {
                navigator.clipboard.writeText(MASTER_PROMPT_TEMPLATE);
                showToast("Đã sao chép Prompt Quy ước vào Clipboard!", "success");
            }
        }

        // ENGINE TƯƠNG TÁC LÀM BÀI TRẮC NGHIỆM TRÊN TRÌNH DUYỆT (HỖ TRỢ TẤT CẢ 7 DẠNG BÀI TẬP)
        function toggleSolution(qid, forceOpen = null) {
            let sol = document.getElementById('solution-' + qid);
            if (!sol) {
                // Thử tìm trong card
                let card = document.querySelector(`.question-card[data-question-id="${qid}"]`);
                if (card) sol = card.querySelector('.solution-box');
            }
            if (sol) {
                if (forceOpen === true) sol.classList.remove('hidden');
                else if (forceOpen === false) sol.classList.add('hidden');
                else sol.classList.toggle('hidden');

                if (!sol.classList.contains('hidden') && window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise([sol]).catch(e => {});
                }
            }
        }

        function checkSingleQuestion(qid) {
            let card = document.querySelector(`.question-card[data-question-id="${qid}"]`);
            if (!card) {
                card = document.getElementById('card_' + qid) || document.getElementById(qid);
            }
            if (!card) return;

            let type = card.getAttribute('data-type') || 'mcq_4';
            let ans = (card.getAttribute('data-answer') || '').trim();
            let maxPoints = parseFloat(card.getAttribute('data-points')) || 0.25;
            let earnedPoints = 0;
            let isCorrect = false;

            if (type === 'mcq_4' || type === 'mc') {
                let sel = card.querySelector(`input[name="${qid}"]:checked`) || card.querySelector(`input[type="radio"]:checked`);
                if (!sel) {
                    alert('Vui lòng chọn 1 phương án trước khi kiểm tra!');
                    return;
                }
                isCorrect = (sel.value.toUpperCase() === ans.toUpperCase());
                earnedPoints = isCorrect ? maxPoints : 0;
            }
            else if (type === 'true_false') {
                let parts = ans.split('|').map(p => p.trim());
                let correctCount = 0;
                let hasUnanswered = false;

                parts.forEach(p => {
                    let [subKey, expected] = p.split(':');
                    let sel = card.querySelector(`input[name="${qid}_${subKey}"]:checked`);
                    if (!sel) hasUnanswered = true;
                    else if (sel.value.toUpperCase() === expected.toUpperCase()) correctCount++;
                });

                if (hasUnanswered) {
                    alert('Vui lòng chọn đủ Đúng/Sai cho cả 4 ý khẳng định!');
                    return;
                }

                // Thang điểm Bộ GD&ĐT 2025
                if (correctCount === 4) earnedPoints = maxPoints;
                else if (correctCount === 3) earnedPoints = maxPoints * 0.5;
                else if (correctCount === 2) earnedPoints = maxPoints * 0.25;
                else if (correctCount === 1) earnedPoints = maxPoints * 0.1;
                else earnedPoints = 0;

                isCorrect = (correctCount === 4);
            }
            else if (type === 'short_answer') {
                let inputEl = card.querySelector('.short-answer-input') || card.querySelector('input[type="text"]');
                if (!inputEl || !inputEl.value.trim()) {
                    alert('Vui lòng nhập kết quả trước khi kiểm tra!');
                    return;
                }
                let userVal = inputEl.value.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
                let accepted = ans.toLowerCase().split('|').map(s => s.trim().replace(/\s+/g, '').replace(',', '.'));
                isCorrect = accepted.includes(userVal);
                earnedPoints = isCorrect ? maxPoints : 0;
            }
            else if (type === 'fill_blank') {
                let parts = ans.split('|').map(p => p.trim());
                let correctCount = 0;
                parts.forEach(p => {
                    let [idx, expVal] = p.split(':');
                    let input = card.querySelector(`input[data-blank="${idx}"]`);
                    if (input && input.value.trim().toLowerCase() === expVal.trim().toLowerCase()) {
                        correctCount++;
                        input.className = "blank-input inline-block w-28 px-2 py-1 mx-1 text-center font-bold text-emerald-800 bg-emerald-50 border border-emerald-500 rounded-lg shadow-inner";
                    } else if (input) {
                        input.className = "blank-input inline-block w-28 px-2 py-1 mx-1 text-center font-bold text-rose-800 bg-rose-50 border border-rose-500 rounded-lg shadow-inner";
                    }
                });
                isCorrect = (correctCount === parts.length);
                earnedPoints = (correctCount / (parts.length || 1)) * maxPoints;
            }
            else if (type === 'matching') {
                let pairs = ans.split('|').map(p => p.trim().toUpperCase());
                let correctCount = 0;
                pairs.forEach(pair => {
                    let [left, right] = pair.split('-');
                    let sel = card.querySelector(`select[data-match="${left}"]`);
                    if (sel && sel.value.toUpperCase() === right) correctCount++;
                });
                isCorrect = (correctCount === pairs.length);
                earnedPoints = (correctCount / (pairs.length || 1)) * maxPoints;
            }
            else if (type === 'ordering') {
                let inputEl = card.querySelector('input[type="text"]');
                if (!inputEl || !inputEl.value.trim()) {
                    alert('Vui lòng nhập thứ tự các bước trước khi kiểm tra!');
                    return;
                }
                let userVal = inputEl.value.trim().replace(/\s+/g, '').replace(/[\rightarrow,>]/g, '-').toUpperCase();
                let expected = ans.trim().replace(/\s+/g, '').toUpperCase();
                isCorrect = (userVal === expected);
                earnedPoints = isCorrect ? maxPoints : 0;
            }
            else if (type === 'essay') {
                toggleSolution(qid, true);
                return;
            }

            // Phản hồi giao diện
            card.classList.remove('border-slate-200', 'border-emerald-500', 'border-rose-500', 'bg-emerald-50/20', 'bg-rose-50/20');
            if (isCorrect) {
                card.classList.add('border-emerald-500', 'bg-emerald-50/20');
                showToast(`Chính xác! (+${earnedPoints.toFixed(2)} điểm)`, "success");
            } else {
                card.classList.add('border-rose-500', 'bg-rose-50/20');
                showToast(`Chưa chính xác! (Đạt: ${earnedPoints.toFixed(2)}/${maxPoints} điểm)`, "error");
            }
            toggleSolution(qid, true);
        }
    