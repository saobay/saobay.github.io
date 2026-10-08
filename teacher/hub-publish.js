        // ========================================================
        // TẠO PROMPT TỐI ƯU SIÊU GỌN CHO NOTEBOOKLM
        // ========================================================
        function generateAndCopyPrompt(type) {
            let subject = document.getElementById('prompt-subject').value.trim() || "Toán";
            let grade = document.getElementById('prompt-grade').value || "12";
            let lesson = document.getElementById('prompt-lesson').value.trim() || "Nội dung học";

            let promptText = "";

            if (type === 'KNOWLEDGE') {
                promptText = `Xuất DUY NHẤT chuỗi mã HTML (raw code) bài học Môn: ${subject} - Lớp: ${grade}. Chủ đề: "${lesson}".
YÊU CẦU:
1. Bọc trong <div class="bai-giang-container space-y-4 font-sans text-slate-800">. Thiết kế Tailwind CSS đẹp mắt, các mục I, II, III đóng khung card trắng (bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3).
2. Công thức Toán: Mọi ký hiệu toán bắt buộc kẹp trong $...$ hoặc $$...$$. Tuyệt đối không đổi sang Equation Word/Unicode.
3. Chỉ xuất thuần mã HTML nguyên bản, không văn bản thừa.`;
            } else {
                promptText = `Xuất DUY NHẤT mã HTML (raw code) Đề thi chuẩn đánh giá năng lực Môn: ${subject} - Lớp: ${grade}. Bài: "${lesson}".
YÊU CẦU:
1. Đa dạng 7 dạng bài: Trắc nghiệm 4 lựa chọn (mcq_4: <input type="radio">, data-answer="A|B|C|D"), Đúng/Sai 4 ý (true_false: data-answer="a:T|b:F|c:T|d:F"), Trả lời ngắn (short_answer), Điền khuyết (fill_blank), Nối cột (matching), Sắp xếp (ordering), Tự luận (essay kèm barem).
2. Mỗi câu là 1 block: <div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5" data-question-id="q1" data-type="..." data-level="NB|TH|VD|VDC" data-answer="...">. Có huy hiệu mức độ [NB]/[TH]/[VD]/[VDC], nút check đáp án và lời giải chi tiết.
3. Công thức Toán: Giữ nguyên 100% cú pháp TeX trong $...$ hoặc $$...$$.
4. Chỉ xuất thuần mã HTML nguyên bản, không văn bản thừa.`;
            }

            if (type === 'EXAM10') {
                // PROMPT 10 BỘ ĐỀ TRONG 1 FILE (2026-10-08): AI chỉ sinh DỮ LIỆU JSON,
                // web saobay.github.io tự render ngẫu nhiên 1 đề + nút "Đổi đề" + chấm từng câu
                promptText = `Xuất DUY NHẤT mã HTML thô (raw code, không bọc khối code markdown, không thêm chữ giải thích ngoài) cho 1 FILE BÀI TẬP gồm 10 BỘ ĐỀ của Bài: "${lesson}" - Môn: ${subject} - Lớp: ${grade}.
ĐỊNH DẠNG BẮT BUỘC (viết TIẾNG VIỆT CÓ DẤU đầy đủ trong mọi chuỗi), chỉ xuất đúng khối sau (không thêm <html>, <head>, <body>):

<div class="saobay-exam10">
<script type="application/json" class="saobay-exam10-data">
{
  "sets": [
    {
      "name": "Đề 1",
      "questions": [
        {"type":"mcq","q":"Nội dung câu hỏi 1?","options":["A. Phương án A","B. Phương án B","C. Phương án C","D. Phương án D"],"answer":"B","explain":"Giải thích ngắn gọn vì sao chọn B."},
        {"type":"truefalse","q":"Xét tính đúng sai của các ý sau:","statements":["Ý a ...","Ý b ...","Ý c ...","Ý d ..."],"answer":["T","F","T","F"],"explain":"Giải thích từng ý."},
        {"type":"short","q":"Điền đáp án: ...?","answer":"đáp án đúng","explain":"Giải thích."}
      ]
    },
    {"name":"Đề 2","questions":[ ... ]},
    {"name":"Đề 3","questions":[ ... ]},
    {"name":"Đề 4","questions":[ ... ]},
    {"name":"Đề 5","questions":[ ... ]},
    {"name":"Đề 6","questions":[ ... ]},
    {"name":"Đề 7","questions":[ ... ]},
    {"name":"Đề 8","questions":[ ... ]},
    {"name":"Đề 9","questions":[ ... ]},
    {"name":"Đề 10","questions":[ ... ]}
  ]
}
<\/script>
</div>

YÊU CẦU CHI TIẾT:
1. Đúng 10 đề, mỗi đề 8-12 câu, bao phủ toàn bộ kiến thức trọng tâm của bài "${lesson}". Các đề KHÁC NHAU rõ rệt: đảo thứ tự câu, đổi số liệu, đổi cách hỏi, không lặp nguyên câu giữa các đề.
2. Phối hợp 3 dạng câu: mcq (trắc nghiệm 4 đáp án, trường answer là ký tự A/B/C/D), truefalse (4 ý a-d, trường answer là mảng 4 giá trị "T"/"F" tương ứng), short (trả lời ngắn, answer là chuỗi đáp án chuẩn).
3. Mỗi câu bắt buộc có "explain" giải thích ngắn gọn, dễ hiểu với học sinh.
4. Công thức Toán viết bằng $...$ hoặc $$...$$, giữ nguyên 100% cú pháp TeX.
5. TUYỆT ĐỐI không dùng ký tự < > & trong chuỗi JSON (dấu nhỏ hơn viết thành \\u003c). Không để dấu phẩy thừa cuối mảng/object làm vỡ JSON.
6. Nếu nội dung quá dài cho 1 lần trả lời: chia thành nhiều lần xuất, mỗi lần ghi rõ "BỘ ĐỀ n/10", giữ nguyên cấu trúc; lần cuối gộp đủ 10 bộ.
7. Chỉ xuất thuần mã HTML theo đúng khung trên, không thêm bất kỳ văn bản nào ngoài khung.`;
            }

            if(!document.getElementById('item-title').value.trim()){
                document.getElementById('item-title').value = `[${subject} ${grade}] ${lesson}`;
            }

            navigator.clipboard.writeText(promptText).then(() => {
                showToast("Đã copy Prompt NotebookLM vào Clipboard!", "success");
            }).catch(() => {
                showToast("Vui lòng cấp quyền copy!", "error");
            });
        }

        async function handleFileUpload(event) {
            let file = event.target.files[0];
            if (!file) return;

            let fileName = file.name;
            let ext = fileName.split('.').pop().toLowerCase();

            if (!document.getElementById('item-title').value.trim()) {
                document.getElementById('item-title').value = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
            }

            if (ext === 'docx') {
                let reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        let arrayBuffer = e.target.result;

                        // 1. Trích xuất văn bản gốc thô từ Word (.docx)
                        let rawTextResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                        let rawText = (rawTextResult && rawTextResult.value) ? rawTextResult.value.trim() : '';

                        // 2. Nhận biết file Word chứa mã HTML (do dán từ NotebookLM) hay giáo án Word thông thường
                        let isPastedHtml = /<(?:div|section|article|header|table|h[1-6]|p|span|style|script)\b|class=|<!DOCTYPE/i.test(rawText) ||
                                           /&lt;\s*(?:div|section|article|header|table|h[1-6]|p|span)/i.test(rawText);

                        let finalHtml = '';
                        if (isPastedHtml) {
                            // Trích xuất trực tiếp mã HTML mà không để Mammoth bọc thẻ <p> lung tung
                            finalHtml = cleanAndDecodeHtml(rawText);
                        } else {
                            // File Word thông thường: chuyển đổi định dạng Word sang HTML chuẩn
                            let convertResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                            finalHtml = convertResult.value;
                        }

                        document.getElementById('item-content').value = finalHtml;
                        renderMathPreview();
                        showToast('Đã nạp file Word vào khung xem trước thành công!', 'success');
                    } catch (err) {
                        console.error('Lỗi đọc file Word:', err);
                        showToast('Lỗi đọc file Word: ' + err.message, 'error');
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                let reader = new FileReader();
                reader.onload = function(e) {
                    let clean = cleanAndDecodeHtml(e.target.result);
                    document.getElementById('item-content').value = clean;
                    renderMathPreview();
                    showToast('Đã nạp file vào khung xem trước thành công!', 'success');
                };
                reader.readAsText(file);
            }
        }

        function removeVietnameseTones(str) {
            if (!str) return 'bai_hoc';
            str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
            str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
            str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
            str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
            str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
            str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
            str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
            str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
            str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
            str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
            str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
            str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
            str = str.replace(/đ/g, "d");
            str = str.replace(/Đ/g, "D");
            str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            str = str.replace(/[^a-zA-Z0-9]/g, '_');
            str = str.replace(/_+/g, '_').replace(/^_|_$/g, '');
            return str || 'bai_hoc';
        }

        async function handleFormSubmit(event) {
            event.preventDefault();

            // Đảm bảo đồng bộ dữ liệu sạch mới nhất từ khung soạn thảo trực quan
            syncVisualToItemContent();

            let rawTitle = document.getElementById('item-title').value.trim();
            let contentVal = document.getElementById('item-content').value.trim();
            let itemType = document.getElementById('item-type').value;

            if (!rawTitle || !contentVal) {
                alert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài giảng / đề thi!');
                return;
            }

            let targetFolder = currentSelectedFolderId || 'data';
            // BẢO VỆ TUYỆT ĐỐI THƯ MỤC BACKUP
            if (targetFolder === 'backup' || targetFolder.startsWith('backup/')) {
                alert('LỖI: Thư mục backup là thư mục sao lưu dự phòng an toàn, tuyệt đối không được đẩy bài vào đây!');
                return;
            }

            let btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang đẩy bài lên GitHub...`;

            let fileSubType = (itemType === 'KNOWLEDGE') ? 'Ly_thuyet' : 'Bai_tap';
            let fileSubTypeDisplay = (itemType === 'KNOWLEDGE') ? 'Lý thuyết' : 'Bài tập';
            let safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "_");
            // Tên file trên Git tự động đổi sang ký tự bình thường không dấu để tương thích 100% URL Git
            let asciiTitle = removeVietnameseTones(rawTitle);
            let formattedFileName = `${asciiTitle}_${fileSubType}_none.html`;
            let targetGitPath = `${targetFolder}/${formattedFileName}`;

            // Chuẩn hóa thành file HTML hoàn chỉnh nếu người dùng chỉ dán đoạn trích
            let finalHtml = contentVal;
            if (!contentVal.toLowerCase().includes('<!doctype') && !contentVal.toLowerCase().includes('<html')) {
                finalHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <meta name="lesson-title" content="${safeTitle}">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true
            },
            svg: { fontCache: 'global' }
        };
    <\/script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
    <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; line-height: 1.6; color: #1e293b; width: 100%; margin: 0 auto; }
        .bai-giang-container { width: 100%; max-width: 100%; margin: 0 auto; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #e2e8f0; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen">
    <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mt-4 mb-8">
        <div class="border-b pb-4 mb-6">
            <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">${fileSubTypeDisplay}</span>
            <h1 class="text-2xl font-black text-slate-900 mt-1">${safeTitle}</h1>
            <p class="text-xs text-slate-400 mt-1">Tác giả: ${currentUser.name} | Thư mục: ${targetFolder}</p>
        </div>
        <div class="content-body space-y-4">
            ${contentVal}
        </div>
    </div>
</body>
</html>`;
            }

            // EXAM10 — gắn cờ BÀI KIỂM TRA TÍNH GIỜ (2026-10-08):
            // Nếu đang ở tab Đề thi và giáo viên nhập số phút -> chèn "time_limit" vào JSON saobay-exam10-data.
            // Web sẽ hiện đồng hồ đếm ngược + nút Nộp bài; hết giờ tự khóa toàn bộ và chấm điểm.
            // Để trống = bài tập thường (không tính giờ).
            try {
                let timeInput = document.getElementById('exam-time-limit');
                let minutes = timeInput ? parseFloat(timeInput.value) : 0;
                if (currentPushTab === 'exam' && minutes > 0 && minutes <= 10080 && finalHtml.indexOf('saobay-exam10-data') !== -1) {
                    finalHtml = finalHtml.replace(/(<script[^>]*class=["']saobay-exam10-data["'][^>]*>\s*)(\{[\s\S]*?\})(\s*<\/script>)/, function(m, open, jsonStr, close){
                        try {
                            let obj = JSON.parse(jsonStr);
                            obj.time_limit = minutes;
                            return open + JSON.stringify(obj) + close;
                        } catch(eJson){ return m; }
                    });
                }
            } catch(eTime){ console.log('time_limit inject note:', eTime); }

            // Lưu trước vào bộ nhớ đệm trình duyệt để index.html đọc được ngay tức thì
            try {
                localStorage.setItem('lesson_cache_' + targetGitPath, finalHtml);
            } catch(eCache) {}

            let token = getGithubToken();
            if (!token) {
                // Đẩy an toàn qua Google Apps Script Proxy (Token ẩn trên server Google)
                try {
                    let payload = {
                        type: 'PUSH_TO_GITHUB',
                        filePath: targetGitPath,
                        content: finalHtml,
                        commitMessage: `Upload ${fileSubTypeDisplay}: ${safeTitle} vào [${targetFolder}]`,
                        title: safeTitle,
                        folderName: currentSelectedFolderName,
                        folderId: currentSelectedFolderId,
                        contentType: itemType,
                        author: currentUser.name
                    };

                    let res = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(payload)
                    });
                    let result = await parseSafeResponse(res);

                    if (result.status === 'success') {
                        let isEdit = document.getElementById('edit-mode-flag').value === 'EDIT';
                        let pointsEarned = isEdit ? scoreConfig.edit : scoreConfig.knowledge;
                        if (!isEdit) {
                            if (itemType === 'EXAM_LONG') pointsEarned = scoreConfig.examLong;
                            else if (itemType === 'EXAM_SHORT') pointsEarned = scoreConfig.examShort;
                        }

                        currentUser.score += pointsEarned;
                        localStorage.setItem('user_score', currentUser.score);
                        document.getElementById('user-total-score').innerText = currentUser.score;

                        notifyChannel.postMessage({ action: 'REFRESH_LESSON_LIST', title: safeTitle, path: targetGitPath, content: finalHtml });

                        alert(`🎉 THÀNH CÔNG!\nBài "${safeTitle}" đã được đẩy trực tiếp lên GitHub qua Google Proxy!\n📁 Vị trí: ${targetGitPath}\n⭐ Điểm thưởng nhận được: +${pointsEarned}`);
                        resetFormToCreate();
                        await loadFolderTreeFromGit();
                    } else {
                        alert(`Lỗi khi đẩy bài qua Google Proxy: ${result.message || 'Không xác định'}`);
                    }
                } catch(err) {
                    alert(`Lỗi kết nối máy chủ Google Proxy: ${err.message}`);
                } finally {
                    btn.disabled = false;
                    refreshPushSubmitBtn();
                }
                return;
            }

            try {
                let encodedPath = getEncodedGitHubPath(targetGitPath);
                let apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodedPath}`;

                // 1. Kiểm tra SHA nếu file đã tồn tại trên GitHub
                let sha = undefined;
                try {
                    let checkRes = await fetch(`${apiUrl}?ref=${GITHUB_CONFIG.branch}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json'
                        }
                    });
                    if (checkRes.ok) {
                        let checkData = await checkRes.json();
                        if (checkData && checkData.sha) sha = checkData.sha;
                    }
                } catch(checkErr) {
                    console.log("Check existing file SHA:", checkErr);
                }

                // 2. Gửi request PUT ghi file lên GitHub
                let base64Content = utf8ToBase64(finalHtml);
                let putRes = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Upload ${fileSubTypeDisplay}: ${safeTitle} vào [${targetFolder}]`,
                        content: base64Content,
                        branch: GITHUB_CONFIG.branch,
                        ...(sha ? { sha } : {})
                    })
                });

                if (putRes.ok) {
                    // Tính điểm thưởng
                    let isEdit = document.getElementById('edit-mode-flag').value === 'EDIT';
                    let pointsEarned = isEdit ? scoreConfig.edit : scoreConfig.knowledge;
                    if (!isEdit) {
                        if (itemType === 'EXAM_LONG') pointsEarned = scoreConfig.examLong;
                        else if (itemType === 'EXAM_SHORT') pointsEarned = scoreConfig.examShort;
                    }

                    currentUser.score += pointsEarned;
                    localStorage.setItem('user_score', currentUser.score);
                    document.getElementById('user-total-score').innerText = currentUser.score;

                    notifyChannel.postMessage({ action: 'REFRESH_LESSON_LIST', title: safeTitle, path: targetGitPath, content: finalHtml });

                    alert(`🎉 THÀNH CÔNG!\nBài "${safeTitle}" đã được đẩy trực tiếp lên GitHub!\n📁 Vị trí: ${targetGitPath}\n⭐ Điểm thưởng nhận được: +${pointsEarned}`);
                    resetFormToCreate();
                    await loadFolderTreeFromGit();
                } else {
                    let err = await putRes.json();
                    alert(`Lỗi khi đẩy lên GitHub: ${err.message || 'Không xác định'}`);
                }
            } catch (err) {
                alert(`Lỗi kết nối khi đẩy bài: ${err.message}`);
            } finally {
                btn.disabled = false;
                refreshPushSubmitBtn();
            }
        }

        function resetFormToCreate() {
            document.getElementById('edit-mode-flag').value = 'CREATE';
            document.getElementById('editing-item-id').value = '';
            document.getElementById('item-title').value = '';
            document.getElementById('item-content').value = '';
            let fileInput = document.getElementById('word-file-input');
            if (fileInput) fileInput.value = '';
            let driveInput = document.getElementById('drive-url-input');
            if (driveInput) driveInput.value = '';
            document.getElementById('cancel-edit-btn').classList.add('hidden');
            renderMathPreview();
            updateScorePreview();
        }
