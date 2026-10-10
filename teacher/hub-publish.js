        // ========================================================
        // TẠO PROMPT TỐI ƯU SIÊU GỌN CHO NOTEBOOKLM
        // ========================================================
        function generateAndCopyPrompt(type) {
            let mxS = document.getElementById('mx-subject'), mxG = document.getElementById('mx-grade'), mxT = document.getElementById('mx-topic');
            // 2026-10-10: chế độ bài tập đọc từ form item-* (Môn/Khối/Chương/Bài + Tiêu đề), fallback về mx-*
            let itS = document.getElementById('item-subject'), itG = document.getElementById('item-grade'),
                itT = document.getElementById('item-title');
            let subject = (mxS && mxS.value.trim()) || (itS && itS.value.trim()) || "Toán";
            let grade = (mxG && mxG.value) || (itG && itG.value) || "12";
            let lesson = (mxT && mxT.value.trim()) || "Nội dung học";
            // Nếu đang ở chế độ bài tập/lý thuyết và có tiêu đề riêng thì ưu tiên tiêu đề
            if ((type === 'EXERCISE' || type === 'KNOWLEDGE') && itT && itT.value.trim()) {
                // Giữ nguyên subject/grade từ form, lesson lấy từ tiêu đề (bỏ prefix [Môn Lớp] nếu có)
                let t = itT.value.trim().replace(/^\[.*?\\]\s*/, '');
                if (t) lesson = t;
            }

            let promptText = "";

            if (type === 'KNOWLEDGE') {
                promptText = `Xuất DUY NHẤT chuỗi mã HTML (raw code) bài học Môn: ${subject} - Lớp: ${grade}. Nội dung kiến thức: "${lesson}".
YÊU CẦU:
1. Bọc trong <div class="bai-giang-container space-y-4 font-sans text-slate-800">. Thiết kế Tailwind CSS đẹp mắt, các mục I, II, III đóng khung card trắng (bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3).
2. Công thức Toán: Mọi ký hiệu toán bắt buộc kẹp trong $...$ hoặc $$...$$. Tuyệt đối không đổi sang Equation Word/Unicode.
3. Chỉ xuất thuần mã HTML nguyên bản, không văn bản thừa.`;
            } else if (type === 'EXERCISE') {
                // 2026-10-10: Prompt riêng cho chế độ Đẩy Bài Tập — chứa tên bài, GV copy cho AI, AI trả code HTML dán vào form
                promptText = `Xuất DUY NHẤT mã HTML (raw code) BÀI TẬP Môn: ${subject} - Lớp: ${grade}. Bài: "${lesson}".
YÊU CẦU:
1. Soạn 10-15 câu bài tập bám sát nội dung bài "${lesson}", phân bố đều các mức độ Nhận biết / Thông hiểu / Vận dụng.
2. Đa dạng 7 dạng bài: Trắc nghiệm 4 lựa chọn (mcq_4: <input type="radio">, data-answer="A|B|C|D"), Đúng/Sai 4 ý (true_false: data-answer="a:T|b:F|c:T|d:F"), Trả lời ngắn (short_answer), Điền khuyết (fill_blank), Nối cột (matching), Sắp xếp (ordering), Tự luận (essay kèm barem).
3. Mỗi câu là 1 block: <div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5" data-question-id="q1" data-type="..." data-level="NB|TH|VD|VDC" data-answer="...">. Có huy hiệu mức độ [NB]/[TH]/[VD]/[VDC], nút check đáp án và lời giải chi tiết.
4. Công thức Toán: Giữ nguyên 100% cú pháp TeX trong $...$ hoặc $$...$$.
5. Chỉ xuất thuần mã HTML nguyên bản, không văn bản thừa.`;
            } else {
                promptText = `Xuất DUY NHẤT mã HTML (raw code) Đề thi chuẩn đánh giá năng lực Môn: ${subject} - Lớp: ${grade}. Bài: "${lesson}".
YÊU CẦU:
1. Đa dạng 7 dạng bài: Trắc nghiệm 4 lựa chọn (mcq_4: <input type="radio">, data-answer="A|B|C|D"), Đúng/Sai 4 ý (true_false: data-answer="a:T|b:F|c:T|d:F"), Trả lời ngắn (short_answer), Điền khuyết (fill_blank), Nối cột (matching), Sắp xếp (ordering), Tự luận (essay kèm barem).
2. Mỗi câu là 1 block: <div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5" data-question-id="q1" data-type="..." data-level="NB|TH|VD|VDC" data-answer="...">. Có huy hiệu mức độ [NB]/[TH]/[VD]/[VDC], nút check đáp án và lời giải chi tiết.
3. Công thức Toán: Giữ nguyên 100% cú pháp TeX trong $...$ hoặc $$...$$.
4. Chỉ xuất thuần mã HTML nguyên bản, không văn bản thừa.`;
            }

            if (type === 'EXAM10') {
                // PROMPT TẠO ĐỀ MỚI CHUẨN SÀO BÁY (2026-10-10, sửa theo test NotebookLM thật):
                // - NotebookLM KHÔNG xuất được khối HTML thô <div class="saobay-exam10"> (test 4 lần đều lỗi/trống)
                // - Đổi sang yêu cầu AI xuất JSON trong khối mã ```json — NotebookLM làm tốt dạng văn bản thuần
                // - GV copy khối JSON → dán vào ô "Dán JSON từ AI" trên hub → pasteAiJsonToComposer() bọc thành khối exam10
                promptText = `Bạn là chuyên gia biên soạn đề thi theo định hướng đánh giá năng lực của Bộ GD&ĐT.
Nhiệm vụ: soạn 1 ĐỀ THI MỚI HOÀN TOÀN (chưa từng xuất hiện ở bất kỳ đâu) cho Nội dung kiến thức: "${lesson}" - Môn: ${subject} - Lớp: ${grade}.

YÊU CẦU QUAN TRỌNG NHẤT:
1. Đề phải MỚI TINH — học sinh chưa từng thấy. Không sao chép, không biến thể nhẹ từ đề cũ.
2. Tôi sẽ cung cấp MA TRẬN CHI TIẾT ngay sau prompt này (gồm: nội dung kiến thức, số câu mỗi nội dung, phân bố mức độ NB/TH/VD/VDC, dạng câu mcq/truefalse/short/essay, thời gian làm bài).
3. Bạn phải tuân thủ 100% ma trận — không tự ý thêm, bớt, hay đổi dạng câu/mức độ.
4. Nếu ma trận chưa rõ chỗ nào, hãy hỏi lại thay vì tự đoán.

ĐỊNH DẠNG BẮT BUỘC — chỉ xuất DUY NHẤT 1 khối mã JSON đúng mẫu dưới đây (không viết thẻ HTML, không viết JavaScript, không chữ giải thích ngoài khối mã):

\`\`\`json
{
  "sets": [
    {
      "name": "Đề 1",
      "questions": [
        {"type":"mcq","level":"NB","q":"Nội dung câu hỏi?","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explain":"Giải thích ngắn gọn."},
        {"type":"truefalse","level":"TH","q":"Xét tính đúng/sai:","statements":["Ý a ...","Ý b ...","Ý c ...","Ý d ..."],"answer":["T","F","T","F"],"explain":"Giải thích từng ý."},
        {"type":"short","level":"VD","q":"Điền đáp số: ...?","answer":"24","explain":"Giải thích."},
        {"type":"essay","level":"VDC","q":"[TL] Câu tự luận: ...","explain":"Barem chấm từng ý."},
        {"type":"mcq","level":"TH","q":"Câu có hình minh họa?","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","img":"https://.../hinh1.png","explain":"Giải thích."}
      ]
    }
  ]
}
\`\`\`

LƯU Ý QUAN TRỌNG: Tôi sẽ COPY NGUYÊN khối JSON trên rồi dán vào phần mềm để tạo đề thi — vì vậy JSON của bạn phải HỢP LỆ TUYỆT ĐỐI (đúng ngoặc, đúng dấu phẩy, chuỗi trong ngoặc kép). Chỉ xuất đúng 1 khối mã, không thêm bất kỳ chữ nào ngoài khối mã.

QUY TẮC 4 DẠNG CÂU (phần mềm chỉ hiểu 4 dạng này):
1. mcq — trắc nghiệm 4 đáp án: "options" đủ 4 chuỗi bắt đầu bằng "A. "/"B. "/"C. "/"D. ", "answer" là 1 ký tự A/B/C/D.
2. truefalse — đúng/sai 4 ý a,b,c,d: "statements" đúng 4 chuỗi, "answer" là mảng 4 giá trị "T"/"F" theo thứ tự a→d. Thang điểm: đúng 1 ý=0.125, 2 ý=0.25, 3 ý=0.5, 4 ý=1.
3. short — trả lời ngắn: "answer" là chuỗi đáp số chuẩn (chỉ 1 đáp án, vd "24").
4. essay — tự luận: KHÔNG có "answer" (giáo viên chấm tay), "explain" ghi barem chấm từng ý.

QUY TẮC 4 MỨC ĐỘ (trường "level" bắt buộc mỗi câu):
- "NB" Nhận biết: nhắc lại định nghĩa, khái niệm, công thức cơ bản.
- "TH" Thông hiểu: hiểu bản chất, phân biệt khái niệm, áp dụng trực tiếp 1 công thức.
- "VD" Vận dụng: tổng hợp 2-3 kiến thức để giải bài toán thông thường.
- "VDC" Vận dụng cao: bài toán phân hóa, tư duy phức tạp, mô hình thực tiễn mới.

QUY TẮC KỸ THUẬT:
- Viết TIẾNG VIỆT CÓ DẤU đầy đủ trong mọi chuỗi.
- Công thức Toán giữ nguyên 100% cú pháp TeX trong $...$ hoặc $$...$$.
- TUYỆT ĐỐI không dùng ký tự < > & trong chuỗi JSON. Không để dấu phẩy thừa cuối mảng/object — JSON phải parse được.
- Mỗi câu bắt buộc có "explain" ngắn gọn, dễ hiểu.
- Nếu câu hỏi có hình minh họa (tôi sẽ cung cấp URL ảnh), thêm trường "img" với URL đó.
- KHÔNG viết thẻ HTML câu hỏi, KHÔNG viết JavaScript — chỉ xuất đúng 1 khối JSON trên.

MA TRẬN CỦA TÔI (bạn tuân thủ tuyệt đối):`;
            }

            if(!document.getElementById('item-title').value.trim()){
                document.getElementById('item-title').value = `[${subject} ${grade}] ${lesson}`;
            }

            navigator.clipboard.writeText(promptText).then(() => {
                if (type === 'EXAM10') {
                    showToast("Đã copy! Dán vào NotebookLM → copy khối JSON → dán vào ô 'Dán JSON' bên dưới.", "success");
                } else {
                    showToast("Đã copy Prompt NotebookLM vào Clipboard!", "success");
                }
            }).catch(() => {
                showToast("Vui lòng cấp quyền copy!", "error");
            });
        }

        // DÁN JSON TỪ AI (2026-10-10): GV copy khối ```json từ NotebookLM/Gemini → dán vào ô ai-json-input
        // → hàm này bóc JSON, kiểm tra hợp lệ, bọc thành khối <div class="saobay-exam10"> rồi nạp vào khung soạn.
        function pasteAiJsonToComposer(){
            let ta = document.getElementById('ai-json-input');
            let status = document.getElementById('ai-json-status');
            let raw = ta ? ta.value.trim() : '';
            function setStatus(msg, ok){
                if (status){
                    status.textContent = msg;
                    status.className = 'text-[11px] font-bold ' + (ok ? 'text-emerald-700' : 'text-rose-600');
                }
            }
            if (!raw){ setStatus('Chưa có JSON để nạp — hãy dán khối JSON AI trả về vào ô trên.', false); return; }
            // Bóc bỏ hàng rào ```json / ``` (AI thường bọc khối mã)
            let jsonStr = raw
                .replace(/^\s*```\s*json\s*/i, '')
                .replace(/^\s*```\s*/i, '')
                .replace(/\s*```\s*$/i, '')
                .trim();
            let obj = null;
            try { obj = JSON.parse(jsonStr); }
            catch(e1){
                // Thử tìm khối {...} lớn nhất trong văn bản (phòng khi AI chèn chữ thừa)
                let m = jsonStr.match(/\{[\s\S]*\}/);
                if (m){ try { obj = JSON.parse(m[0]); } catch(e2){} }
            }
            if (!obj || !obj.sets || !Array.isArray(obj.sets) || !obj.sets.length){
                setStatus('JSON không hợp lệ hoặc thiếu "sets". Hãy copy đúng khối JSON AI trả về.', false);
                showToast('JSON không hợp lệ!', 'error');
                return;
            }
            let qCount = 0, setCount = obj.sets.length;
            obj.sets.forEach(function(s){ qCount += ((s && s.questions) || []).length; });
            if (!qCount){
                setStatus('JSON hợp lệ nhưng không có câu hỏi nào trong "sets".', false);
                showToast('Không tìm thấy câu hỏi!', 'error');
                return;
            }
            let block = '<div class="saobay-exam10">\n<script type="application/json" class="saobay-exam10-data">\n'
                + JSON.stringify(obj) + '\n<\/script>\n</div>';
            let composer = document.getElementById('item-content');
            if (composer){
                let cur = composer.value.trim();
                composer.value = cur ? (cur + '\n\n' + block) : block;
                try { if (typeof onRawHtmlChange === 'function') onRawHtmlChange(); } catch(e){}
                try { if (typeof updatePreviewDebounced === 'function') updatePreviewDebounced(); } catch(e){}
            }
            // Tự điền tiêu đề nếu đang trống
            try {
                let titleEl = document.getElementById('item-title');
                let subj = ((document.getElementById('mx-subject')||{}).value || '').trim();
                let grd = (document.getElementById('mx-grade')||{}).value || '';
                let les = ((document.getElementById('mx-topic')||{}).value || '').trim();
                if (titleEl && !titleEl.value.trim() && (subj || grd || les)) titleEl.value = '[' + subj + ' ' + grd + '] ' + les;
            } catch(e){}
            setStatus('Đã nạp ' + setCount + ' bộ đề (' + qCount + ' câu) vào khung soạn!', true);
            showToast('Đã nạp đề vào khung soạn!', 'success');
            ta.value = '';
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

        function readBankMetaFromForm(){
            function v(id){ let el = document.getElementById(id); return el ? el.value.trim() : ''; }
            return { subject: v('item-subject'), grade: v('item-grade'), chapter: v('item-chapter'), lesson: v('item-lesson') };
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

            let targetFolder = currentSelectedFolderId || '';
            // BAT BUOC chon thu muc trong cung (khong duoc de trong, khong duoc chon thu muc cha)
            if (!targetFolder) {
                alert('Vui lòng chọn thư mục trong cùng (không có thư mục con) ở cây thư mục bên trái trước khi đẩy bài!');
                return;
            }
            if ((typeof folderHasChildren === 'function') && folderHasChildren(targetFolder)) {
                alert('Thư mục đã chọn còn có thư mục con. Vui lòng chọn thư mục trong cùng!');
                return;
            }
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
    <!-- SAOBAY-PROTECT: (c) 2026 Truong THPT Sao Bay | Nghiem cam sao chep duoi moi hinh thuc -->
    <footer class="saobay-copyright-footer" style="margin-top:2rem;padding:1rem 0.5rem 2.5rem;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#94a3b8;margin:0">© 2026 Trường THPT Sào Báy — Nền tảng học tập SAOBAY</p>
    <p style="font-size:12px;color:#94a3b8;margin:4px 0 0">Nghiêm cấm sao chép, phát tán nội dung dưới mọi hình thức khi chưa được sự cho phép bằng văn bản.</p>
    </footer>
    <script data-saobay-guard="1">(function(){try{var h=(location.hostname||"").toLowerCase();var ok=(h===""||h==="saobay.github.io"||h==="localhost"||h==="127.0.0.1"||h.slice(-17)===".saobay.github.io");if(!ok&&document.body){document.body.innerHTML="";var d=document.createElement("div");d.setAttribute("style","max-width:560px;margin:60px auto;padding:32px;text-align:center;border:1px solid #e2e8f0;border-radius:16px;background:#fff;font-family:system-ui,sans-serif");var t1=document.createElement("h2");t1.setAttribute("style","color:#0f172a");t1.textContent="(c) SAOBAY - Truong THPT Sao Bay";var t2=document.createElement("p");t2.setAttribute("style","color:#475569");t2.textContent="Noi dung nay chi duoc hien thi tai dia chi chinh thuc saobay.github.io. Vui long truy cap dung dia chi de hoc tap.";d.appendChild(t1);d.appendChild(t2);document.body.appendChild(d);}}catch(e){}})();</script>
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

            // EXAM10 — CÀI ĐIỂM (2026-10-08): gắn scoring mặc định + points riêng từng câu vào JSON saobay-exam10-data.
            try {
                if (currentPushTab === 'exam' && finalHtml.indexOf('saobay-exam10-data') !== -1){
                    let gv = function(id){ let el = document.getElementById(id); return el ? parseFloat(el.value) : NaN; };
                    let defScoring = {};
                    let vm = gv('score-mcq'); if (!isNaN(vm) && vm >= 0) defScoring.mcq = vm;
                    let vt = gv('score-tf'); if (!isNaN(vt) && vt >= 0) defScoring.truefalse = vt;
                    let vs = gv('score-short'); if (!isNaN(vs) && vs >= 0) defScoring.short = vs;
                    let ve = gv('score-essay'); if (!isNaN(ve) && ve >= 0) defScoring.essay = ve;
                    // Diem rieng tung cau tu bang perq-score-list
                    let perQ = {};
                    document.querySelectorAll('#perq-score-list input[data-pq]').forEach(function(inp){
                        let v = parseFloat(inp.value);
                        if (!isNaN(v) && v >= 0) perQ[inp.getAttribute('data-pq')] = v;
                    });
                    if (Object.keys(defScoring).length || Object.keys(perQ).length){
                        finalHtml = finalHtml.replace(/(<script[^>]*class=["']saobay-exam10-data["'][^>]*>\s*)(\{[\s\S]*?\})(\s*<\/script>)/g, function(m, open, jsonStr, close){
                            try {
                                let obj = JSON.parse(jsonStr);
                                if (Object.keys(defScoring).length) obj.scoring = Object.assign({}, obj.scoring || {}, defScoring);
                                let qi = 0;
                                (obj.sets || []).forEach(function(st){
                                    (st.questions || []).forEach(function(qq){
                                        let k = 'q' + qi;
                                        if (perQ[k] !== undefined && !qq.points) qq.points = perQ[k];
                                        qi++;
                                    });
                                });
                                return open + JSON.stringify(obj) + close;
                            } catch(eJson){ return m; }
                        });
                    }
                }
            } catch(eScore){ console.log('scoring inject note:', eScore); }

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
                        // Phase 2: tu boc cau hoi vao ngan hang (khong chan luong chinh)
                        autoSaveToBank(finalHtml, formattedFileName, targetGitPath, targetFolder, readBankMetaFromForm()).catch(function(){});
                        // Quyen so huu de thi: ai day thi la chu (khong chan luong chinh)
                        registerExamOwner(targetGitPath, safeTitle).catch(function(){});
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
                    // Phase 2: tu boc cau hoi vao ngan hang (khong chan luong chinh)
                    autoSaveToBank(finalHtml, formattedFileName, targetGitPath, targetFolder, readBankMetaFromForm()).catch(function(){});
                    // Quyen so huu de thi: ai day thi la chu (khong chan luong chinh)
                    registerExamOwner(targetGitPath, safeTitle).catch(function(){});
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

        // ========================================================
        // REGISTRY QUYEN SO HUU DE THI (2026-10-08)
        // data/exam-registry.json: { filePath: {owner_id, owner_name, title, created_at} }
        // - Ai day bai thi la chu; chi chu + admin duoc sua/xoa
        // - File cu chua co chu: giao vien van sua/xoa nhu cu + co nut "Nhan" de nhan chu
        // ========================================================
        const EXAM_REGISTRY_PATH = 'data/exam-registry.json';
        let examRegistryCache = null;

        async function getExamRegistry(force){
            if (examRegistryCache && !force) return examRegistryCache;
            let token = getGithubToken();
            try {
                if (token){
                    let apiUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                        + '/contents/' + getEncodedGitHubPath(EXAM_REGISTRY_PATH) + '?ref=' + GITHUB_CONFIG.branch;
                    let res = await fetch(apiUrl, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
                    if (res.ok){
                        let jd = await res.json();
                        let bin = atob(String(jd.content || '').replace(/\s/g, ''));
                        let bytes = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                        examRegistryCache = JSON.parse(new TextDecoder('utf-8').decode(bytes));
                        return examRegistryCache;
                    }
                } else {
                    let raw = await fetch('https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                        + '/' + GITHUB_CONFIG.branch + '/' + getEncodedGitHubPath(EXAM_REGISTRY_PATH) + '?t=' + Date.now());
                    if (raw.ok){ examRegistryCache = await raw.json(); return examRegistryCache; }
                }
            } catch(e){}
            examRegistryCache = {};
            return examRegistryCache;
        }

        async function saveExamRegistry(reg){
            let content = JSON.stringify(reg);
            let token = getGithubToken();
            if (token){
                let apiUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                    + '/contents/' + getEncodedGitHubPath(EXAM_REGISTRY_PATH);
                let sha;
                try {
                    let chk = await fetch(apiUrl + '?ref=' + GITHUB_CONFIG.branch,
                        { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
                    if (chk.ok){ let jd = await chk.json(); sha = jd.sha; }
                } catch(e){}
                let body = { message: 'Cập nhật quyền sở hữu đề thi', content: utf8ToBase64(content), branch: GITHUB_CONFIG.branch };
                if (sha) body.sha = sha;
                let res = await fetch(apiUrl, { method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(body) });
                if (!res.ok) throw new Error('GitHub API ' + res.status);
            } else {
                let res2 = await fetch(API_URL, { method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: EXAM_REGISTRY_PATH, content: content,
                        commitMessage: 'Cập nhật quyền sở hữu đề thi',
                        title: 'exam-registry', author: (typeof currentUser !== 'undefined' ? currentUser.name : '') })
                });
                let rj = await res2.json();
                if (!rj || rj.status !== 'success') throw new Error((rj && rj.message) || 'Proxy lỗi');
            }
            examRegistryCache = reg;
        }

        // Ghi nhan chu so huu sau khi day bai thanh cong (ghi de chu cu neu co)
        async function registerExamOwner(filePath, title){
            let reg = await getExamRegistry(true);
            // FIX 2026-10-10: thêm owner_tag để phân biệt GV (trường: id_tên, tự do: TD_sdt)
            let _uid = (typeof currentUser !== 'undefined' && currentUser.id) ? String(currentUser.id) : '';
            let _uname = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : '';
            let _tag = '';
            if (/^0\d{8,11}$/.test(_uid) || _uid.indexOf('@') >= 0) _tag = 'TD_' + _uid;
            else if (_uid) _tag = _uid + '_' + _uname;
            reg[filePath] = {
                owner_id: _uid,
                owner_name: _uname,
                owner_tag: _tag,
                title: title || filePath, created_at: new Date().toISOString()
            };
            await saveExamRegistry(reg);
        }

        function examOwnerOf(filePath, reg){
            let r = reg || examRegistryCache || {};
            return r[filePath] || null;
        }
        function isHubAdmin(){
            try { return (typeof currentUser !== 'undefined' && currentUser.role === 'admin'); } catch(e){ return false; }
        }
        function myHubUid(){
            try { return String((currentUser && currentUser.id) || ''); } catch(e){ return ''; }
        }
        // Quy tắc: admin luôn được; chủ được; file cũ chưa có chủ thì giáo viên vẫn được (như cũ)
        function canManageExam(filePath, reg){
            if (isHubAdmin()) return true;
            let o = examOwnerOf(filePath, reg);
            if (!o) return true; // file cũ chưa đăng ký chủ
            return String(o.owner_id || '') === myHubUid() && myHubUid() !== '';
        }
        // Nhan chu so huu cho file cu
        async function claimExamOwner(filePath, title){
            if (!confirm('Nhận quyền sở hữu "' + title + '"?\nSau này chỉ bạn và admin được sửa/xoá đề này.')) return;
            try {
                await registerExamOwner(filePath, title);
                if (typeof showToast === 'function') showToast('Đã nhận quyền sở hữu đề này', 'success');
                if (typeof renderManageList === 'function') renderManageList();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }

        // Cai diem tung cau (2026-10-08): doc JSON tu khung soan, liet ke de GV nhap diem rieng
        function togglePerQScore(){
            let box = document.getElementById('perq-score-box');
            if (!box) return;
            box.classList.toggle('hidden');
            if (box.classList.contains('hidden')) return;
            let list = document.getElementById('perq-score-list');
            let ta = document.getElementById('item-content');
            let html = '';
            try {
                let val = ta ? ta.value : '';
                let m = val.match(/<script[^>]*class=["']saobay-exam10-data["'][^>]*>([\s\S]*?)<\/script>/);
                if (!m) throw new Error('no data');
                let obj = JSON.parse(m[1]);
                let qi = 0;
                (obj.sets || []).forEach(function(st){
                    (st.questions || []).forEach(function(qq){
                        let tname = {mcq:'TN', truefalse:'Đ/S', short:'TLN', essay:'TL'}[qq.type] || qq.type;
                        let cur = (qq.points !== undefined && qq.points !== null) ? qq.points : '';
                        html += '<div class="flex items-center gap-2 text-[11px]">'
                            + '<span class="w-6 font-bold text-slate-500">' + (qi + 1) + '</span>'
                            + '<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">' + tname + '</span>'
                            + '<span class="flex-1 truncate text-slate-700">' + String(qq.q || '').replace(/</g,'&lt;').slice(0, 60) + '</span>'
                            + '<input type="number" step="0.05" min="0" data-pq="q' + qi + '" value="' + cur + '" placeholder="—" class="text-xs border border-sky-300 rounded px-1.5 py-1 w-16 font-semibold">'
                            + '</div>';
                        qi++;
                    });
                });
                if (!qi) html = '<p class="text-[11px] text-slate-400">Chưa có câu hỏi nào trong nội dung.</p>';
            } catch(e){ html = '<p class="text-[11px] text-rose-600">Chưa đọc được đề thi từ khung soạn. Hãy nạp đề (Word/AI) trước.</p>'; }
            list.innerHTML = html;
        }
