        // ========================================================
        // SOẠN ĐỀ TỪ FILE WORD (2026-10-08)
        // - Đọc .docx qua mammoth.js, parse theo QUY CÁCH chuẩn
        // - Chuyển thành exam10 JSON, đưa vào khung soạn để đẩy như thường
        // ========================================================

        const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
        const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        function ensureJsZip(){
            return new Promise(function(resolve, reject){
                if (window.JSZip) return resolve();
                let sc = document.createElement('script');
                sc.src = JSZIP_CDN;
                sc.onload = function(){ resolve(); };
                sc.onerror = function(){ reject(new Error('Không tải được thư viện JSZip.')); };
                document.head.appendChild(sc);
            });
        }
        // Doc dinh dang dap an tu document.xml: chu do / gach chan / in dam
        // 2026-10-10: them dinh dang cua CHU CAI DAU TIEN (firstU/firstRed/firstBold)
        // de nhan dien dap an dung theo cach don gian: gach chan chu cai dau (a/b/c/d)
        async function detectAnswerFormatting(arrayBuffer){
            let marks = []; // [{text, red, underline, bold, firstU, firstRed, firstBold}]
            try {
                await ensureJsZip();
                let zip = await window.JSZip.loadAsync(arrayBuffer);
                let docXml = await zip.file('word/document.xml').async('text');
                let parser = new DOMParser();
                let xml = parser.parseFromString(docXml, 'text/xml');
                let paras = xml.getElementsByTagName('w:p');
                for (let pi = 0; pi < paras.length; pi++){
                    let p = paras[pi];
                    let runs = p.getElementsByTagName('w:r');
                    let pText = '', pRed = false, pU = false, pB = false;
                    let runList = [];
                    for (let ri = 0; ri < runs.length; ri++){
                        let r = runs[ri];
                        let tEls = r.getElementsByTagName('w:t');
                        let rText = '';
                        for (let ti = 0; ti < tEls.length; ti++) rText += tEls[ti].textContent;
                        let rPr = r.getElementsByTagName('w:rPr')[0];
                        let red = false, u = false, b = false;
                        if (rPr){
                            let color = rPr.getElementsByTagName('w:color')[0];
                            if (color){
                                let val = (color.getAttribute('w:val') || '').toUpperCase();
                                if (val === 'FF0000' || val === 'RED' || val === 'C00000') red = true;
                            }
                            // gach chan: <w:u> mac dinh la single; w:val="none" = KHONG gach
                            let uEl = rPr.getElementsByTagName('w:u')[0];
                            if (uEl){
                                let uVal = (uEl.getAttribute('w:val') || 'single').toLowerCase();
                                if (uVal !== 'none') u = true;
                            }
                            // in dam: <w:b> mac dinh la true; w:val=false/0/off = KHONG dam
                            let bEl = rPr.getElementsByTagName('w:b')[0];
                            if (bEl){
                                let bVal = (bEl.getAttribute('w:val') || 'true').toLowerCase();
                                if (bVal !== 'false' && bVal !== '0' && bVal !== 'off' && bVal !== 'none') b = true;
                            }
                        }
                        if (!rText.trim()) continue;
                        runList.push({ text: rText, red: red, underline: u, bold: b });
                        pText += rText;
                        if (red) pRed = true;
                        if (u) pU = true;
                        if (b) pB = true;
                    }
                    // dinh dang cua ky tu nhin thay dau tien trong doan (thuong la chu cai a/b/c/d)
                    let firstU = false, firstRed = false, firstB = false;
                    for (let ri = 0; ri < runList.length; ri++){
                        if (runList[ri].text.replace(/^\s+/, '')){
                            firstU = runList[ri].underline;
                            firstRed = runList[ri].red;
                            firstB = runList[ri].bold;
                            break;
                        }
                    }
                    pText = pText.replace(/\s+/g, ' ').trim();
                    if (pText) marks.push({ text: pText, red: pRed, underline: pU, bold: pB,
                        firstU: firstU, firstRed: firstRed, firstBold: firstB });
                }
            } catch(e){ console.warn('detectAnswerFormatting:', e); }
            return marks;
        }
        // ========================================================
        // DOC BANG DAP AN TU document.xml (2026-10-11)
        // - Nhan dien bang dap an TN: hang [Câu, 1, 2, ...] + hang [Đáp án/Đ.án/Đ/án, A, B, ...]
        // - Nhan dien bang D/S: dap an la Đ/S hoac True/False
        // - Tra ve [{nums:[1,2,...], answers:['B','C',...], kind:'mcq'|'truefalse'}] theo thu tu xuat hien
        // ========================================================
        function parseAnswerTable(grid){
            if (!grid || grid.length < 2) return null;
            for (let hi = 0; hi < grid.length; hi++){
                let row = grid[hi];
                if (!row || !row.length) continue;
                let first = (row[0] || '').trim().toLowerCase();
                if (first !== 'câu' && first !== 'cau') continue;
                let nums = [], numKeys = [];
                for (let ci = 1; ci < row.length; ci++){
                    let cell = (row[ci] || '').trim();
                    // Ho tro dang "1a", "1b" (dap an cho tung y cua cau D/S)
                    let mSub = cell.match(/^(\d+)\s*([a-d])$/i);
                    if (mSub){ nums.push(parseInt(mSub[1], 10)); numKeys.push(mSub[1] + mSub[2].toLowerCase()); continue; }
                    let n = parseInt(cell, 10);
                    if (isNaN(n)) break;
                    nums.push(n); numKeys.push(String(n));
                }
                if (nums.length < 2) continue;
                for (let ai = hi + 1; ai < grid.length; ai++){
                    let arow = grid[ai];
                    if (!arow || !arow.length) continue;
                    let afirst = (arow[0] || '').toLowerCase().replace(/[\.\/\s]/g, '');
                    if (['đápán','dapan','đán','dan'].indexOf(afirst) < 0) continue;
                    let answers = [], subAnswers = {}, kind = 'mcq';
                    for (let ci = 1; ci < arow.length && (answers.length + Object.keys(subAnswers).length) < nums.length; ci++){
                        let v = (arow[ci] || '').trim();
                        let vu = v.toUpperCase();
                        let key = numKeys[answers.length + Object.keys(subAnswers).length] || '';
                        let mQ = key.match(/^(\d+)([a-d])$/);
                        if (/^[A-D]$/.test(vu)){ 
                            if (mQ){ subAnswers[mQ[1]] = subAnswers[mQ[1]] || []; subAnswers[mQ[1]].push(vu); }
                            else answers.push(vu);
                        }
                        else if (['Đ','D','ĐÚNG','DUNG','TRUE','T'].indexOf(vu) >= 0){
                            if (mQ){ subAnswers[mQ[1]] = subAnswers[mQ[1]] || []; subAnswers[mQ[1]].push('T'); }
                            else answers.push('T');
                            kind = 'truefalse';
                        }
                        else if (['S','SAI','FALSE','F'].indexOf(vu) >= 0){
                            if (mQ){ subAnswers[mQ[1]] = subAnswers[mQ[1]] || []; subAnswers[mQ[1]].push('F'); }
                            else answers.push('F');
                            kind = 'truefalse';
                        }
                        else if (v && v.indexOf(',') >= 0){
                            // O chua "Đ, S, Đ, S" -> dap an cho 1 cau D/S
                            let parts = v.split(/[,;\/\s]+/).filter(Boolean).map(function(p){
                                let pu = p.trim().toUpperCase();
                                if (['Đ','D','ĐÚNG','DUNG','TRUE','T'].indexOf(pu) >= 0) return 'T';
                                if (['S','SAI','FALSE','F'].indexOf(pu) >= 0) return 'F';
                                if (/^[A-D]$/.test(pu)) return pu;
                                return '';
                            }).filter(Boolean);
                            if (parts.length){ answers.push(parts.length === 1 ? parts[0] : parts); if (parts[0] === 'T' || parts[0] === 'F') kind = 'truefalse'; }
                            else answers.push('');
                        }
                        else answers.push('');
                    }
                    if (!answers.length && !Object.keys(subAnswers).length) continue;
                    let hasABCD = answers.some(function(a){ return /^[A-D]$/.test(a); });
                    let hasTF = answers.some(function(a){ return a === 'T' || a === 'F' || Array.isArray(a); });
                    if (hasABCD && !hasTF) kind = 'mcq';
                    else if (hasTF && !hasABCD) kind = 'truefalse';
                    return { nums: nums.slice(0, Math.max(answers.length, Object.keys(subAnswers).length)), 
                             answers: answers, subAnswers: subAnswers, kind: kind };
                }
            }
            return null;
        }

        async function extractAnswerTables(arrayBuffer){
            let tables = [];
            try {
                await ensureJsZip();
                let zip = await window.JSZip.loadAsync(arrayBuffer);
                let docXml = await zip.file('word/document.xml').async('text');
                let parser = new DOMParser();
                let xml = parser.parseFromString(docXml, 'text/xml');
                let tbls = xml.getElementsByTagName('w:tbl');
                for (let ti = 0; ti < tbls.length; ti++){
                    let rows = tbls[ti].getElementsByTagName('w:tr');
                    let grid = [];
                    for (let ri = 0; ri < rows.length; ri++){
                        let cells = rows[ri].getElementsByTagName('w:tc');
                        let row = [];
                        for (let ci = 0; ci < cells.length; ci++){
                            let ts = cells[ci].getElementsByTagName('w:t');
                            let txt = '';
                            for (let k = 0; k < ts.length; k++) txt += ts[k].textContent;
                            row.push(txt.replace(/\s+/g, ' ').trim());
                        }
                        grid.push(row);
                    }
                    let at = parseAnswerTable(grid);
                    if (at){ at.order = tables.length; tables.push(at); }
                }
            } catch(e){ console.warn('extractAnswerTables:', e); }
            return tables;
        }

        // Map dap an tu bang vao cau hoi (2026-10-11)
        // - Moi bang ung voi 1 de thi (theo thu tu xuat hien)
        // - Cau hoi duoc danh dau examIdx khi gap "I. TRAC NGHIEM" / "PHAN I"
        function applyAnswerTables(qs, tables){
            if (!tables || !tables.length || !qs || !qs.length) return 0;
            let mapped = 0;
            // Nhom cau hoi theo exam
            let exams = {};
            qs.forEach(function(q){
                let e = (q.examIdx == null ? 0 : q.examIdx);
                if (!exams[e]) exams[e] = [];
                exams[e].push(q);
            });
            let examKeys = Object.keys(exams).map(Number).sort(function(a,b){return a-b;});
            let posMappedSet = new Set(); // 2026-10-11: tranh map trung vi tri
            tables.forEach(function(tb, ti){
                let ek = examKeys[Math.min(ti, examKeys.length - 1)];
                let qlist = exams[ek] || [];
                let mcqList = qlist.filter(function(q){ return q.type === 'mcq' && !q.answer; });
                let tfList = qlist.filter(function(q){ return q.type === 'truefalse' && (!q.answer || !q.answer.length); });
                // Map theo so cau
                tb.nums.forEach(function(num, ni){
                    let ans = tb.answers[ni];
                    if (ans === undefined || ans === '') return;
                    let done = false;
                    // Tim cau khop: type phu hop + num khop + chua co dap an
                    for (let qi = 0; qi < qlist.length && !done; qi++){
                        let q = qlist[qi];
                        if (q.num !== num) continue;
                        if (tb.kind === 'mcq' && q.type === 'mcq' && !q.answer){
                            q.answer = ans; mapped++; done = true;
                        }
                        else if (tb.kind === 'truefalse' && q.type === 'truefalse' && (!q.answer || !q.answer.length)){
                            q.answer = Array.isArray(ans) ? ans : [ans]; mapped++; done = true;
                        }
                    }
                    // 2026-10-11: fallback theo vi tri (vd: cau danh so 19-30, bang ghi 1-12)
                    if (!done && ni < (tb.kind === 'mcq' ? mcqList.length : tfList.length)){
                        let q = tb.kind === 'mcq' ? mcqList[ni] : tfList[ni];
                        // Chi fallback khi so luong cau khop so cot bang
                        let targetList = tb.kind === 'mcq' ? qlist.filter(function(x){ return x.type === 'mcq'; }) : tfList;
                        if (targetList.length === tb.nums.length && q && !posMappedSet.has(q)){
                            if (tb.kind === 'mcq'){ q.answer = ans; }
                            else { q.answer = Array.isArray(ans) ? ans : [ans]; }
                            posMappedSet.add(q); mapped++;
                        }
                    }
                });
                // Map sub-answers (1a, 1b, 1c, 1d) cho cau D/S
                Object.keys(tb.subAnswers || {}).forEach(function(qnum){
                    let sa = tb.subAnswers[qnum];
                    for (let qi = 0; qi < qlist.length; qi++){
                        let q = qlist[qi];
                        if (q.num === parseInt(qnum, 10) && q.type === 'truefalse' && (!q.answer || !q.answer.length)){
                            q.answer = sa; mapped++; break;
                        }
                    }
                });
            });
            return mapped;
        }

        let wordState = { questions: [], fileName: '', extractedImages: [] };

        function ensureMammoth(){
            return new Promise(function(resolve, reject){
                if (window.mammoth) return resolve();
                let sc = document.createElement('script');
                sc.src = MAMMOTH_CDN;
                sc.onload = function(){ resolve(); };
                sc.onerror = function(){ reject(new Error('Không tải được thư viện đọc Word. Kiểm tra mạng rồi thử lại.')); };
                document.head.appendChild(sc);
            });
        }

        function wordGuideHtml(){
            return '<p class="font-black text-indigo-900 mb-1"><i class="fa-solid fa-list-check mr-1"></i>QUY CÁCH SOẠN FILE WORD (.docx)</p>'
            + '<p class="mb-1">Soạn <b>dạng text thuần</b> theo đúng cấu trúc bên dưới (không dán mã HTML của AI). Mỗi câu gồm các dòng:</p>'
            + '<div class="bg-slate-50 border rounded-lg p-2 font-mono text-[11px] whitespace-pre-wrap mb-2">Câu 1 [TN] [NB]\nNội dung câu hỏi viết ở đây...\na. Phương án A\n<u>b</u>. Phương án B\nc. Phương án C\nd. Phương án D\nGiải thích: Lời giải (không bắt buộc)...\n\nCâu 2 [ĐS] [TH]\nPhát biểu sau đúng hay sai?\n<u>a</u>) Mệnh đề a\nb) Mệnh đề b\n<u>c</u>) Mệnh đề c\nd) Mệnh đề d\n\nCâu 3 [TLN] [VD]\nNội dung câu hỏi...\nĐáp án: 42</div>'
            + '<ul class="list-disc ml-4 space-y-0.5">'
            + '<li><b>Câu N</b>: bắt đầu một câu mới (N là số thứ tự).</li>'
            + '<li><b>[TN]</b> = trắc nghiệm 4 đáp án &nbsp; <b>[ĐS]</b> = đúng/sai &nbsp; <b>[TLN]</b> = trả lời ngắn &nbsp; <b>[TL]</b> = tự luận (GV chấm tay).</li>'
            + '<li><b>[NB]</b> nhận biết &nbsp; <b>[TH]</b> thông hiểu &nbsp; <b>[VD]</b> vận dụng &nbsp; <b>[VDC]</b> vận dụng cao (mặc định NB).</li>'
            + '<li>Trắc nghiệm: phương án viết <b>a. b. c. d.</b> (chữ thường cũng được) — Đúng/Sai: mệnh đề viết <b>a) b) c) d)</b>.</li>'
            + '<li><b class="text-rose-700">⭐ ƯU TIÊN — ghi rõ dòng <b>Đáp án:</b></b> (hình thức <b>nên dùng</b>, chính xác nhất, không phụ thuộc định dạng chữ): TN ghi chữ cái (vd: <b>Đáp án: C</b>) • Đ/S ghi Đ,S cách nhau dấu phẩy (vd: Đáp án: Đ, S, Đ, S) • TLN ghi nội dung (vd: Đáp án: 42).</li>'
            + '<li><b class="text-emerald-700">Cách 2 — GẠCH CHÂN chữ cái đầu</b> của đáp án đúng (vd: gạch chân chữ <u>b</u>). Câu Đúng/Sai: gạch chân chữ cái của mệnh đề <b>ĐÚNG</b> (vd: a, c đúng thì gạch chân a và c).</li>'
            + '<li><b>Cách 3</b> — bôi đỏ hoặc gạch chân <b>cả dòng đáp án</b> đúng (vẫn được chấp nhận).</li>'
            + '<li>Công thức Toán viết dạng text (vd: x^2, \\(x^2\\)).</li>'
            + '</ul>';
        }

        function toggleWordGuide(){
            let g = document.getElementById('word-guide');
            if (!g) return;
            if (g.classList.contains('hidden') && !g.innerHTML) g.innerHTML = wordGuideHtml();
            g.classList.toggle('hidden');
        }

        async function handleWordExamFile(input){
            let f = input.files && input.files[0];
            let pv = document.getElementById('word-preview');
            if (!f){ return; }
            pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang đọc file Word...</p>';
            try {
                await ensureMammoth();
                let buf = await f.arrayBuffer();
                wordState.extractedImages = [];
                let result = await window.mammoth.convertToHtml({ arrayBuffer: buf }, {
                    convertImage: window.mammoth.images.imgElement(function(image){
                        var ct = String(image.contentType || '').toLowerCase();
                        if (ct.indexOf('wmf') >= 0 || ct.indexOf('emf') >= 0) return [];
                        return image.read('base64').then(function(b64){
                            var idx = wordState.extractedImages.length;
                            wordState.extractedImages.push({ b64: b64, contentType: image.contentType, idx: idx });
                            return { src: 'data:' + image.contentType + ';base64,' + b64 };
                        });
                    })
                });
                let doc = new DOMParser().parseFromString(result.value || '', 'text/html');
                let lines = [];
                // Theo dõi vị trí ảnh so với câu hỏi để tự động gán
                let imgPositions = []; // [{imgIdx, lineIdx}]
                let els = doc.querySelectorAll('p, li, h1, h2, h3, h4, tr');
                els.forEach(function(el){
                    let t = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    // Kiểm tra xem element này có chứa ảnh không
                    let imgs = el.querySelectorAll('img');
                    if (t) lines.push(t);
                    if (imgs.length){
                        // Ghi nhận ảnh ở vị trí dòng hiện tại
                        for (let k = 0; k < imgs.length; k++){
                            imgPositions.push({ lineIdx: lines.length - 1, el: el });
                        }
                    }
                });
                wordState.rawText = lines.join('\n');
                let qs = parseWordExam(lines);
                // Tự động gán ảnh vào câu hỏi dựa trên vị trí
                // Ảnh nằm sau câu hỏi nào thì gán vào câu đó
                try {
                    if (wordState.extractedImages && wordState.extractedImages.length && imgPositions.length){
                        // Map từng ảnh theo thứ tự xuất hiện
                        wordState.extractedImages.forEach(function(im, imgIdx){
                            if (imgIdx < imgPositions.length){
                                let pos = imgPositions[imgIdx];
                                // Tìm câu hỏi gần nhất trước vị trí ảnh
                                let bestQi = -1;
                                let qLineMap = {}; // ánh xạ câu hỏi -> dòng bắt đầu
                                // Đơn giản: ảnh thứ imgIdx -> ước lượng câu hỏi
                                // Dùng heuristic: tìm câu hỏi có text xuất hiện gần vị trí ảnh nhất
                                let lineText = lines[pos.lineIdx] || '';
                                for (let qi = 0; qi < qs.length; qi++){
                                    let qText = (qs[qi].q || '').substring(0, 30);
                                    if (qText && lineText.indexOf(qText.substring(0, 20)) >= 0){
                                        bestQi = qi;
                                        break;
                                    }
                                }
                                // Fallback: chia đều theo tỷ lệ
                                if (bestQi < 0 && qs.length > 0){
                                    bestQi = Math.min(qs.length - 1, Math.floor((imgIdx + 1) * qs.length / (wordState.extractedImages.length + 1)));
                                }
                                if (bestQi >= 0) im.questionIdx = bestQi;
                            }
                        });
                    }
                } catch(eAuto){ console.warn('auto map img:', eAuto); }
                // Doc bang dap an tu document.xml va map vao cau hoi (2026-10-11)
                try {
                    let ansTables = await extractAnswerTables(buf);
                    if (ansTables && ansTables.length){
                        let nMapped = applyAnswerTables(qs, ansTables);
                        wordState.answerTables = ansTables;
                        console.log('Bang dap an:', ansTables.length, 'da map:', nMapped);
                    }
                } catch(eTbl){ console.warn('answer table:', eTbl); }
                // Nhan dien dap an tu dinh dang (2026-10-10):
                // - Cach moi (uu tien): GACH CHAN chu cai dau tien cua phuong an (a/b/c/d) -> dap an dung
                // - Cach cu (tuong thich nguoc): ca dong chu do / gach chan
                // - Cau Dung/Sai: gach chan chu cai cua menh de DUNG
                try {
                    let marks = await detectAnswerFormatting(buf);
                    let markIdx = 0;
                    qs.forEach(function(q){
                        // Tim doan text cua cau hoi trong marks
                        let qStart = -1;
                        for (let mi = markIdx; mi < marks.length; mi++){
                            if (marks[mi].text.indexOf(q.q.slice(0, 20)) >= 0){ qStart = mi; break; }
                        }
                        if (qStart < 0) return;
                        let tfStates = []; // cho cau Dung/Sai: [{letter, isTrue}]
                        // Quet cac phuong an trong marks sau cau hoi
                        for (let mi = qStart + 1; mi < Math.min(qStart + 12, marks.length); mi++){
                            let mt = marks[mi].text;
                            let mk = marks[mi];
                            // Gap cau moi thi dung
                            if (/^câu\s*\d+/i.test(mt)) break;
                            let firstMarked = mk.firstU || mk.firstRed;
                            let wholeMarked = mk.red || mk.underline;
                            if (q.type === 'mcq' && !q.answer){
                                let om = mt.match(/^([A-Da-d])\s*[\.\)\:]/);
                                if (om && (firstMarked || wholeMarked)){
                                    q.answer = om[1].toUpperCase();
                                }
                            } else if (q.type === 'truefalse'){
                                let sm = mt.match(/^([a-d])\s*[\)\.\:]/i);
                                if (sm){
                                    tfStates.push({ letter: sm[1].toLowerCase(),
                                        isTrue: firstMarked || wholeMarked });
                                }
                            }
                        }
                        // Cau Dung/Sai: neu co it nhat 1 menh de duoc gach chan chu cai
                        // va chua co dap an tu dong "Dap an:", dung dinh dang de xac dinh D/S
                        if (q.type === 'truefalse' && (!q.answer || !q.answer.length)
                            && tfStates.length && tfStates.length === (q.statements || []).length
                            && tfStates.some(function(s){ return s.isTrue; })){
                            q.answer = tfStates.map(function(s){ return s.isTrue ? 'T' : 'F'; });
                        }
                        markIdx = qStart + 1;
                    });
                } catch(eFmt){ console.warn('answer format detect:', eFmt); }
                wordState.questions = qs;
                wordState.fileName = f.name;
                if (!qs.length){
                    pv.innerHTML = '<p class="text-xs text-rose-600">Không nhận diện được câu hỏi nào. Hãy soạn đúng <b>quy cách</b> (bấm "Xem quy cách soạn Word").</p>';
                    return;
                }
                let badge = { mcq: 'bg-blue-100 text-blue-800', truefalse: 'bg-amber-100 text-amber-800', short: 'bg-emerald-100 text-emerald-800' };
                let typeName = { mcq: 'TN', truefalse: 'Đ/S', short: 'TLN', essay: 'TL' };
                let nAnsTable = (wordState.answerTables || []).length;
                let nMappedAns = qs.filter(function(q){ return q.answer && (typeof q.answer === 'string' ? q.answer : q.answer.length); }).length;
                let h = '<div class="bg-white border border-indigo-200 rounded-xl p-3">'
                    + '<p class="text-xs font-black text-slate-800 mb-2"><i class="fa-solid fa-check-circle text-emerald-600 mr-1"></i>Đã đọc ' + qs.length + ' câu từ "' + String(f.name).replace(/</g,'&lt;') + '"'
                    + (nAnsTable ? ' <span class="text-[10px] font-normal text-emerald-700">(' + nAnsTable + ' bảng đáp án → ' + nMappedAns + ' câu có đáp án)</span>' : '') + '</p>'
                    + '<div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">'
                    + qs.map(function(q, i){
                        return '<div class="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px]">'
                            + '<span class="font-bold text-slate-400 mr-1">' + (i+1) + '.</span>'
                            + '<span class="font-semibold">' + String(q.q).replace(/</g,'&lt;').slice(0, 120) + '</span> '
                            + '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ' + (badge[q.type] || 'bg-slate-100') + '">' + (typeName[q.type] || q.type) + '</span>'
                            + '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800">' + q.level + '</span>'
                            + '</div>';
                    }).join('') + '</div>'
                    + '</div>';
                // UI gan anh vao cau hoi (neu co anh trich xuat) — 2026-10-10: thu gon mac dinh, mo ra khi can de do roi
                if (wordState.extractedImages && wordState.extractedImages.length){
                    h += '<details class="mt-2 bg-white border border-amber-200 rounded-xl" open>'
                        + '<summary class="px-3 py-2.5 cursor-pointer text-xs font-black text-slate-800 flex items-center select-none">'
                        + '<i class="fa-solid fa-images text-amber-600 mr-2"></i>Gán ảnh vào câu hỏi (' + wordState.extractedImages.length + ' ảnh)'
                        + '<span class="ml-auto text-[10px] text-slate-400 font-normal">bấm để mở rộng nếu cần chèn ảnh</span>'
                        + '</summary>'
                        + '<div class="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto pr-1">'
                        + wordState.extractedImages.map(function(im, ii){
                            // Tự động đoán câu hỏi: ảnh thường nằm ngay sau câu hỏi của nó
                            // Dùng vị trí ước lượng: ảnh thứ ii -> câu hỏi gần nhất
                            var autoQi = '';
                            if (im.questionIdx !== undefined && im.questionIdx !== null && im.questionIdx >= 0 && im.questionIdx < qs.length){
                                autoQi = im.questionIdx;
                            }
                            var opts = '<option value="">-- Không gán --</option>' + qs.map(function(q, qi){
                                var sel = (String(qi) === String(autoQi)) ? ' selected' : '';
                                return '<option value="' + qi + '"' + sel + '>Câu ' + (qi+1) + '</option>';
                            }).join('');
                            return '<div class="flex items-center gap-2 border border-slate-200 rounded-lg p-2">'
                                + '<img src="data:' + im.contentType + ';base64,' + im.b64 + '" onclick="wordImgZoom(this)" class="w-16 h-16 object-contain rounded border border-slate-200 bg-slate-50 cursor-zoom-in hover:opacity-80" title="Bấm để phóng to">'
                                + '<div class="flex-1"><p class="text-[11px] font-bold text-slate-600 mb-1">Ảnh ' + (ii+1) + '</p>'
                                + '<select id="img-map-' + ii + '" class="w-full text-xs border rounded-lg px-2 py-1">' + opts + '</select></div>'
                                + '</div>';
                        }).join('') + '</div></details>';
                }
                // Nút đưa vào khung soạn đặt DƯỚI phần gán ảnh
                h += '<button onclick="sendWordToEditor()" class="mt-2 w-full bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-arrow-down mr-1"></i>Đưa ' + qs.length + ' câu vào khung soạn để đẩy</button>';
                pv.innerHTML = h;
                try { mountWordEditor(); } catch(eEd){ console.warn('word editor:', eEd); }
            } catch(e){
                pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi đọc file: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>';
            }
            input.value = '';
        }

        // Phóng to ảnh khi bấm (để xem đúng câu)
        function wordImgZoom(imgEl){
            var src = imgEl.src;
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px';
            overlay.onclick = function(){ document.body.removeChild(overlay); };
            var img = document.createElement('img');
            img.src = src;
            img.style.cssText = 'max-width:90%;max-height:90%;border-radius:12px;box-shadow:0 0 40px rgba(255,255,255,0.2)';
            overlay.appendChild(img);
            document.body.appendChild(overlay);
        }

        // Tach phuong an inline: "A. IX B. X C. XI D. XIX" -> [{letter:'A',text:'IX'},...]
        function splitInlineOptions(text){
            let parts = [], re = /([A-Da-d])[\.\)]\s*/g, m;
            let lastLetter = null, lastIdx = 0;
            while ((m = re.exec(text)) !== null){
                if (lastLetter !== null){
                    let content = text.substring(lastIdx, m.index).trim();
                    if (content) parts.push({ letter: lastLetter, text: content });
                }
                lastLetter = m[1].toUpperCase();
                lastIdx = m.index + m[0].length;
            }
            if (lastLetter !== null){
                let content = text.substring(lastIdx).trim();
                if (content) parts.push({ letter: lastLetter, text: content });
            }
            return parts;
        }

        function parseWordExam(lines){
            let questions = [], cur = null, examIdx = 0, inTN = false;
            let pushCur = function(){ if (cur && cur.q) questions.push(cur); cur = null; };
            lines.forEach(function(raw){
                let line = String(raw || '').trim();
                if (!line) return;
                // 2026-10-11: bo qua hang bang dap an ("Câu 1 2 3..." / "Đáp án A B...")
                // (fix 2026-10-11: khong skip dong "Đáp án: X" co dau hai cham)
                if (/^(câu|cau)\s*(\d+\s*)+$/i.test(line)) return;
                if (/^(đáp án|đ\.án|đ\/án)\b(?!\s*:)/i.test(line)) return;
                // Phat hien de thi moi qua marker "ĐỀ N" (2026-10-11: de map bang dap an dung de)
                // VD: "MÔN TOÁN 6-ĐỀ 1", "ĐỀ 2"
                if (/^(ĐỀ\s*\d+|MÔN\s+.*[\s-]ĐỀ\s*\d+)/i.test(line)){
                    if (questions.length > 0 || cur) examIdx++;
                    inTN = false; return;
                }
                // Dau phan TN/TL (khong tang examIdx - tranh nham voi HUONG DAN CHAM)
                if (/TRẮC NGHIỆM|TRAC NGHIEM/i.test(line) && /^(I|PHẦN I|PHAN I)\b/i.test(line)){
                    inTN = true; return;
                }
                if (/^(II|PHẦN II|PHAN II)\b/i.test(line)){ inTN = false; return; }
                let mCau = line.match(/^(câu|cau)\s*(\d+)\s*(.*)$/i);
                if (mCau){
                    pushCur();
                    cur = { type: null, level: 'NB', q: '', options: [], statements: [], answer: null, explain: '',
                            num: parseInt(mCau[2], 10), examIdx: examIdx, inTN: inTN };
                    let rest = mCau[3] || '';
                    let tags = rest.match(/\[[^\]]+\]/g) || [];
                    tags.forEach(function(t){
                        let v = t.slice(1, -1).trim().toUpperCase();
                        if (v === 'TN' || v.indexOf('TRẮC NGHIỆM') >= 0 || v.indexOf('TRAC NGHIEM') >= 0) cur.type = 'mcq';
                        else if (v === 'ĐS' || v === 'DS' || v.indexOf('ĐÚNG') >= 0 || v.indexOf('DUNG') >= 0) cur.type = 'truefalse';
                        else if (v === 'TLN' || v.indexOf('TRẢ LỜI NGẮN') >= 0 || v.indexOf('TRA LOI NGAN') >= 0) cur.type = 'short';
                        else if (v === 'TL' || v.indexOf('TỰ LUẬN') >= 0 || v.indexOf('TU LUAN') >= 0) cur.type = 'essay';
                        else if (['NB','TH','VD','VDC'].indexOf(v) >= 0) cur.level = v;
                    });
                    let qtext = rest.replace(/\[[^\]]+\]/g, '').replace(/^[\.\)\:\s]+/, '').trim();
                    if (qtext) cur.q = qtext;
                    return;
                }
                if (!cur) return;
                let mAns = line.match(/^(đáp án|dap an)\s*:\s*(.+)$/i);
                if (mAns){ cur._ansRaw = mAns[2].trim(); cur._inExplain = false; return; }
                let mExp = line.match(/^(giải thích|giai thich)\s*:\s*(.*)$/i);
                if (mExp){ cur._inExplain = true; cur.explain = (mExp[2] || '').trim(); return; }
                let mOpt = line.match(/^([A-Da-d])[\.\)]\s*(.*)$/);
                if (mOpt && cur.type !== 'truefalse' && cur.type !== 'essay'){
                    // chu thuong a-d: chi coi la dap an TN khi da co tag [TN];
                    // neu chua co tag, chu thuong = menh de Dung/Sai (giu cach doan cu)
                    if (mOpt[1] === mOpt[1].toUpperCase() || cur.type === 'mcq'){
                        cur.type = cur.type || 'mcq';
                        // 2026-10-11: tach phuong an inline "A. IX B. X C. XI D. XIX"
                        let inlines = splitInlineOptions(line);
                        if (inlines.length >= 2){
                            inlines.forEach(function(io){
                                cur.options.push(io.letter + '. ' + io.text);
                            });
                        } else {
                            cur.options.push(mOpt[1].toUpperCase() + '. ' + mOpt[2].trim());
                        }
                        return;
                    }
                }
                let mSt = line.match(/^([a-d])[\.\)]\s*(.+)$/);
                if (mSt && cur.type !== 'mcq' && cur.type !== 'essay'){
                    // 2026-10-11: cau trong phan TU LUAN co cac y a/b/c/d la cau hoi con, KHONG phai menh de D/S
                    if (cur.inTN === false && cur.type !== 'truefalse'){ cur.q += (cur.q ? ' ' : '') + line; return; } // SB_PDF_V1_20261012: cau [ĐS] luon tach menh de
                    cur.type = cur.type || 'truefalse'; cur.statements.push(mSt[2].trim()); return; }
                if (cur._inExplain){ cur.explain += (cur.explain ? ' ' : '') + line; }
                else cur.q += (cur.q ? ' ' : '') + line;
            });
            pushCur();
            questions.forEach(function(q){
                if (!q.type){
                    if (q.options.length) q.type = 'mcq';
                    else if (q.statements.length) q.type = 'truefalse';
                    else if (q.inTN) q.type = 'mcq'; // 2026-10-11: cau trong phan TN mac dinh la TN
                    else q.type = 'short';
                }
                let raw = (q._ansRaw || '').trim();
                if (q.type === 'mcq'){
                    let m = raw.match(/[A-D]/i);
                    q.answer = m ? m[0].toUpperCase() : '';
                } else if (q.type === 'truefalse'){
                    q.answer = raw.split(/[,;\/\s]+/).filter(Boolean).map(function(p){
                        let v = p.trim().toUpperCase();
                        if (['Đ','D','ĐÚNG','DUNG','T','TRUE'].indexOf(v) >= 0) return 'T';
                        if (['S','SAI','F','FALSE'].indexOf(v) >= 0) return 'F';
                        return '';
                    }).filter(Boolean);
                } else if (q.type === 'essay') {
                    q.answer = '';
                } else {
                    q.answer = raw;
                }
                delete q._ansRaw; delete q._inExplain; delete q.inTN;
            });
            return questions;
        }

        function sendWordToEditor(){
            let qs = wordState.questions || [];
            if (!qs.length){ alert('Chưa có câu hỏi nào để chuyển.'); return; }
            // 2026-10-11: GIỮ base64 trong JSON, KHÔNG upload ở đây
            // Ảnh chỉ upload khi GV bấm "Đẩy bài" thật sự (trong hub-publish.js)
            // -> không bao giờ có ảnh mồ côi
            let imgMap = {};
            (wordState.extractedImages || []).forEach(function(im, ii){
                let sel = document.getElementById('img-map-' + ii);
                if (sel && sel.value !== ''){
                    let qi = parseInt(sel.value, 10);
                    if (!isNaN(qi) && qs[qi]) imgMap[qi] = 'data:' + im.contentType + ';base64,' + im.b64;
                }
            });
            let examJson = { time_limit: 0, sets: [{ name: 'Đề', questions: qs.map(function(q, qi){
                let o = { type: q.type, level: q.level, q: q.q, options: q.options || [],
                         statements: q.statements || [], answer: q.answer, explain: q.explain || '' };
                if (q._imgData) o.img = q._imgData; else if (imgMap[qi]) o.img = imgMap[qi]; // SB_WED_20261012: anh gan/dan tung cau
                return o;
            }) }] };
            let frag = '<div class="saobay-exam10">\n'
                + '<script type="application/json" class="saobay-exam10-data">\n' + JSON.stringify(examJson) + '\n<\/script>\n</div>';
            let ta = document.getElementById('item-content');
            if (!ta){ alert('Không tìm thấy khung soạn thảo.'); return; }
            ta.value = frag;
            // Hiển thị câu hỏi trong khung WYSIWYG (bản siêu đơn giản - không ảnh)
            try {
                var pvBox = document.getElementById('preview-container');
                if (pvBox){
                    var qList = (examJson.sets && examJson.sets[0] && examJson.sets[0].questions) || [];
                    var html = '<div style="padding:10px">';
                    html += '<p style="font-weight:bold;color:#1e40af;margin-bottom:10px">Đã chuyển ' + qList.length + ' câu vào khung soạn:</p>';
                    for (var qi = 0; qi < qList.length; qi++){
                        var q = qList[qi] || {};
                        var qText = String(q.q || '').substring(0, 100);
                        // Escape HTML đơn giản inline
                        qText = qText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                        html += '<div style="border:1px solid #ddd;border-radius:8px;padding:8px;margin-bottom:8px;background:#fff">';
                        html += '<p style="font-weight:bold;margin:0;font-size:14px">Câu ' + (qi+1) + ': ' + qText + (String(q.q||'').length > 100 ? '...' : '') + '</p>';
                        var opts = q.options || [];
                        for (var oi = 0; oi < opts.length && oi < 4; oi++){
                            var letter = String.fromCharCode(65 + oi);
                            var optText = String(opts[oi] || '').substring(0, 60).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                            var isAns = String(q.answer || '').toUpperCase() === letter;
                            html += '<p style="margin:2px 0 2px 16px;font-size:13px;' + (isAns ? 'color:#15803d;font-weight:bold' : 'color:#475569') + '">' + letter + '. ' + optText + (isAns ? ' ✓' : '') + '</p>';
                        }
                        if (q.img){
                            // 2026-10-11: chi hien placeholder, KHONG nhet base64 vao preview (tranh trang man hinh)
                            // Anh that se upload khi GV bam "Day bai"
                            if (String(q.img).indexOf('data:image') === 0){
                                html += '<p style="font-size:12px;color:#7c3aed;margin:4px 0 0 16px">📷 Có ảnh minh họa (sẽ tải lên khi Đẩy bài)</p>';
                            } else {
                                html += '<img src="' + q.img + '" style="max-width:100%;max-height:200px;margin-top:8px;border-radius:8px;border:1px solid #e2e8f0" loading="lazy"/>';
                            }
                        }
                        html += '</div>';
                    }
                    html += '</div>';
                    // JSON ẩn để đẩy bài (đặt riêng, không lẫn với visible)
                    html += '<div class="saobay-exam10" style="display:none"><script type="application/json" class="saobay-exam10-data">' + JSON.stringify(examJson).split('<').join('\\u003c') + '<\/script></div>';
                    pvBox.innerHTML = html;
                } else {
                    console.error('preview-container not found');
                }
            } catch(eRender){ 
                console.error('render failed:', eRender);
                try {
                    var pvBox2 = document.getElementById('preview-container');
                    if (pvBox2) pvBox2.innerHTML = '<p style="color:red;padding:20px">Lỗi hiển thị: ' + String(eRender.message || eRender) + '</p>';
                } catch(e2){}
            }
            // 2026-10-11: KHONG goi renderMathPreview o day vi no ghi de lam trang khung
            if (typeof showToast === 'function') showToast('Đã chuyển ' + qs.length + ' câu vào khung soạn. Nhập tiêu đề rồi bấm Đẩy bài.', 'success');
            else alert('Đã chuyển ' + qs.length + ' câu vào khung soạn.');
            let titleInput = document.getElementById('item-title');
            if (titleInput && !titleInput.value.trim()){
                let base = (wordState.fileName || '').replace(/\.docx$/i, '');
                if (base) titleInput.value = base.replace(/[_-]+/g, ' ');
            }
        }

// ========================================================
// ĐỀ NGUYÊN BẢN TỪ WORD (2026-10-08)
// "Đẩy đề giữ nguyên bố cục" — cho đề thi có công thức toán + hình vẽ.
// Hai đường vào, cùng cho ra 1 mảnh HTML <div class="saobay-paper">:
//  A. Tải file .docx (mammoth.js): nhanh, 1 click. KHÔNG đọc được công
//     thức MathType kiểu cũ (lưu dạng WMF/EMF) -> sẽ báo số công thức bị bỏ.
//  B. Dán từ Word (copy trong Word rồi dán): chính Word render công thức
//     MathType ra ảnh PNG nên giữ được cả đề cũ.
// Mảnh HTML được đưa vào khung soạn thảo, rồi Đẩy bài như thường
// (file ..._Bai_tap_none.html -> tab "Làm Bài Tập & Đề Thi", web tự hiện).
// ========================================================
var PAPER_CSS = '.saobay-paper{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1e293b;line-height:1.75;font-size:16px;overflow-wrap:break-word}'
+ '.saobay-paper p{margin:0 0 8px}'
+ '.saobay-paper img{max-width:100%;height:auto;vertical-align:middle;border-radius:6px}'
+ '.saobay-paper figure{margin:12px 0;text-align:center}'
+ '.saobay-paper table{border-collapse:collapse;margin:10px 0;display:block;overflow-x:auto;max-width:100%}'
+ '.saobay-paper td,.saobay-paper th{border:1px solid #94a3b8;padding:6px 10px;font-size:14px;vertical-align:top}'
+ '.saobay-paper h2.paper-phan{background:#eff6ff;border-left:4px solid #2563eb;padding:8px 12px;font-size:16px;font-weight:800;color:#1d4ed8;margin:20px 0 10px;border-radius:0 8px 8px 0}'
+ '.saobay-paper div.paper-cau{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin:8px 0}'
+ '@media print{.saobay-paper div.paper-cau{break-inside:avoid}}';

var paperWordState = { html: '', imgCount: 0, wmfSkipped: 0, fileName: '', kind: '' };

// Bọc các câu "Câu N." / "PHẦN ..." thành thẻ riêng cho dễ đọc
function structurePaperHtml(html){
    var doc;
    try { doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html'); }
    catch(e){ return html; }
    var root = doc.body ? doc.body.firstChild : null;
    if (!root) return html;
    var out = doc.createElement('div');
    var curCau = null;
    function closeCau(){ if (curCau){ out.appendChild(curCau); curCau = null; } }
    Array.prototype.slice.call(root.childNodes).forEach(function(node){
        if (node.nodeType === 1 && /^p$/i.test(node.tagName)){
            var t = (node.textContent || '').trim();
            if (/^PHẦN\s+[IVX]+/i.test(t)){
                closeCau();
                var h = doc.createElement('h2'); h.className = 'paper-phan';
                h.innerHTML = node.innerHTML; out.appendChild(h); return;
            }
            if (/^Câu\s+\d+/i.test(t)){
                closeCau();
                curCau = doc.createElement('div'); curCau.className = 'paper-cau';
                node.innerHTML = node.innerHTML.replace(/^(\s*Câu\s+\d+\s*[\.\)]?)/i, '<b>$1</b>');
                curCau.appendChild(node); return;
            }
        }
        if (curCau) curCau.appendChild(node);
        else out.appendChild(node);
    });
    closeCau();
    return out.innerHTML;
}

function buildPaperFragment(inner){
    return '<style>\n' + PAPER_CSS + '\n</style>\n<div class="saobay-paper">\n'
        + structurePaperHtml(inner) + '\n</div>';
}

function sendPaperToEditor(){
    var st = paperWordState;
    if (!st.html){ alert('Chưa có nội dung đề nguyên bản.'); return; }
    var ta = document.getElementById('item-content');
    if (!ta){ alert('Không tìm thấy khung soạn thảo.'); return; }
    ta.value = buildPaperFragment(st.html);
    if (typeof renderMathPreview === 'function'){ try { renderMathPreview(); } catch(e){} }
    var titleInput = document.getElementById('item-title');
    if (titleInput && !titleInput.value.trim() && st.fileName){
        titleInput.value = String(st.fileName).replace(/\.docx$/i, '').replace(/[_-]+/g, ' ').trim();
    }
    if (typeof showToast === 'function') showToast('Đã đưa đề nguyên bản vào khung soạn. Nhập tiêu đề rồi bấm Đẩy bài.', 'success');
    else alert('Đã đưa đề nguyên bản vào khung soạn.');
}

function renderPaperPreview(){
    var st = paperWordState, pv = document.getElementById('paper-preview');
    if (!pv) return;
    var sizeKB = 0;
    try { sizeKB = Math.round(encodeURIComponent(st.html).length / 1024); } catch(e){}
    var warn = '';
    if (st.wmfSkipped > 0){
        warn = '<div class="mt-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-2 text-[11px]">'
            + '<i class="fa-solid fa-triangle-exclamation mr-1"></i><b>' + st.wmfSkipped
            + ' công thức/hình vẽ kiểu MathType cũ không đọc được</b> (định dạng WMF/EMF, trình duyệt không hiển thị được). '
            + 'Hãy dùng <b>Cách 2: Dán từ Word</b> — mở file trong Word, Ctrl+A &#8594; Ctrl+C, dán vào khung, Word sẽ tự render công thức ra ảnh.'
            + '</div>';
    }
    var tmp = document.createElement('div'); tmp.innerHTML = st.html;
    var text = (tmp.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 220);
    pv.innerHTML = '<div class="bg-white border border-emerald-200 rounded-xl p-3">'
        + '<p class="text-xs font-black text-slate-800 mb-1"><i class="fa-solid fa-check-circle text-emerald-600 mr-1"></i>Đã đọc xong "' + String(st.fileName).replace(/</g, '&lt;') + '"'
        + ' <span class="font-normal text-slate-500">(' + st.imgCount + ' ảnh &bull; ' + sizeKB + ' KB)</span></p>'
        + '<p class="text-[11px] text-slate-500 italic mb-1">' + text.replace(/</g, '&lt;') + '&hellip;</p>'
        + warn
        + '<button type="button" onclick="sendPaperToEditor()" class="mt-2 w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-arrow-down mr-1"></i>Đưa đề nguyên bản vào khung soạn để đẩy</button>'
        + '</div>';
}

// ---- Cách 1: tải file .docx (mammoth) ----
async function handlePaperDocxFile(input){
    var f = input.files && input.files[0];
    var pv = document.getElementById('paper-preview');
    if (!f){ return; }
    if (pv) pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang đọc file Word...</p>';
    paperWordState = { html: '', imgCount: 0, wmfSkipped: 0, fileName: f.name, kind: 'docx' };
    try {
        await ensureMammoth();
        var buf = await f.arrayBuffer();
        var st = paperWordState;
        var result = await window.mammoth.convertToHtml({ arrayBuffer: buf }, {
            convertImage: window.mammoth.images.imgElement(function(image){
                var ct = String(image.contentType || '').toLowerCase();
                if (ct.indexOf('wmf') >= 0 || ct.indexOf('emf') >= 0){
                    st.wmfSkipped++;
                    return []; // công thức MathType cũ: trình duyệt không hiển thị được
                }
                return image.read('base64').then(function(b64){
                    st.imgCount++;
                    return { src: 'data:' + image.contentType + ';base64,' + b64 };
                });
            })
        });
        var html = (result.value || '').trim();
        if (!html){
            if (pv) pv.innerHTML = '<p class="text-xs text-rose-600">File Word không có nội dung đọc được.</p>';
            return;
        }
        st.html = html;
        renderPaperPreview();
    } catch(e){
        if (pv) pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi đọc file: ' + String((e && e.message) || e).replace(/</g, '&lt;') + '</p>';
    }
    input.value = '';
}


        // ---- AI DOC DE: Gemini API truc tiep (2026-10-08) ----
        function getGeminiKey(){ try { return localStorage.getItem('saobay_gemini_key') || ''; } catch(e){ return ''; } }
        function setGeminiKey(k){ try { localStorage.setItem('saobay_gemini_key', k || ''); } catch(e){} }
        function saveGeminiKeyUI(){
            let inp = document.getElementById('gemini-key-input');
            let st = document.getElementById('gemini-key-status');
            let k = inp ? inp.value.trim() : '';
            if (!k){ if (st){ st.textContent = 'Hãy dán key vào ô trên.'; st.className = 'text-[10px] text-rose-600'; } return; }
            setGeminiKey(k);
            if (inp) inp.value = '';
            if (st){ st.textContent = 'Đã lưu key (chỉ lưu trên trình duyệt này).'; st.className = 'text-[10px] text-emerald-700'; }
            if (typeof showToast === 'function') showToast('Đã lưu Gemini API key!', 'success');
        }
        function copyNotebookLMPrompt(){
            let rawText = (typeof wordState !== 'undefined' && wordState.rawText) ? wordState.rawText : '';
            if (!rawText){ alert('Hãy tải file Word lên trước (nút "Tải file .docx").'); return; }
            let prompt = 'Bạn là chuyên gia biên soạn đề thi. Dưới đây là nội dung thô của 1 đề thi trích từ file Word (có thể lộn xộn).\n\n'
                + 'NHIỆM VỤ: Nhận diện TẤT CẢ câu hỏi, phân loại dạng, tìm đáp án đúng, xuất ra JSON theo đúng cấu trúc SAOBAY.\n\n'
                + 'CẤU TRÚC JSON (mỗi câu 1 object):\n'
                + '- {"type":"mcq","level":"NB","q":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explain":"...","points":0.25} (trắc nghiệm)\n'
                + '- {"type":"truefalse","level":"TH","q":"...","statements":["ý a","ý b","ý c","ý d"],"answer":["T","F","T","F"],"explain":"...","points":1} (đúng/sai)\n'
                + '- {"type":"short","level":"VD","q":"...","answer":"đáp số","explain":"...","points":0.5} (trả lời ngắn)\n'
                + '- {"type":"essay","level":"VDC","q":"...","explain":"barem","points":0} (tự luận)\n'
                + 'CHỈ xuất JSON thuần: {"sets":[{"name":"Đề","questions":[...]}]} bọc trong:\n'
                + '<div class="saobay-exam10">\n<script type="application/json" class="saobay-exam10-data">\n[JSON]\n<\/script>\n</div>\n\n'
                + 'NỘI DUNG ĐỀ:\n' + rawText.slice(0, 50000);
            navigator.clipboard.writeText(prompt).then(function(){
                if (typeof showToast === 'function') showToast('Đã copy! Dán vào NotebookLM.', 'success');
                else alert('Đã copy! Dán vào NotebookLM.');
            }).catch(function(){ alert('Không copy được.'); });
        }
        async function aiParseExam(){
            let pv = document.getElementById('word-preview');
            let key = getGeminiKey();
            if (!key){ alert('Chưa có API key. Mở mục "AI đọc đề", dán key vào ô rồi bấm Lưu key.'); return; }
            let rawText = wordState.rawText || '';
            if (!rawText){ alert('Hãy tải file Word lên trước (nút "Tải file .docx").'); return; }
            if (pv) pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>AI đang đọc và cấu trúc đề thi... (có thể mất 30-60 giây)</p>';
            try {
                let prompt = 'Bạn là chuyên gia biên soạn đề thi. Dưới đây là nội dung thô của 1 đề thi trích từ file Word (có thể lộn xộn, thiếu cấu trúc).\n\n'
                    + 'NHIỆM VỤ: Nhận diện TẤT CẢ câu hỏi, phân loại dạng, tìm đáp án đúng, và xuất ra JSON theo đúng cấu trúc SAOBAY.\n\n'
                    + 'CẤU TRÚC JSON BẮT BUỘC (mỗi câu 1 object):\n'
                    + '- {"type":"mcq","level":"NB","q":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explain":"...","points":0.25} (trắc nghiệm)\n'
                    + '- {"type":"truefalse","level":"TH","q":"...","statements":["ý a","ý b","ý c","ý d"],"answer":["T","F","T","F"],"explain":"...","points":1} (đúng/sai 4 ý)\n'
                    + '- {"type":"short","level":"VD","q":"...","answer":"đáp số","explain":"...","points":0.5} (trả lời ngắn)\n'
                    + '- {"type":"essay","level":"VDC","q":"...","explain":"barem"} (tự luận, không có answer)\n'
                    + 'level: NB (nhận biết), TH (thông hiểu), VD (vận dụng), VDC (vận dụng cao).\n'
                    + '"points" là điểm của câu đó: mặc định TN=0.25, Đ/S=1, TLN=0.5, tự luận=0. Nếu đề gốc ghi điểm khác (vd "Câu 1 (2 điểm)") thì dùng điểm đó.\n'
                    + 'CHỈ xuất JSON thuần: {"sets":[{"name":"Đề","questions":[...]}]} — không thêm chữ giải thích ngoài.\n\n'
                    + 'NỘI DUNG ĐỀ:\n' + rawText.slice(0, 60000);
                let url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(key);
                let resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 16000 } }) });
                if (!resp.ok){ let et = await resp.text(); throw new Error('Gemini API lỗi ' + resp.status + ': ' + et.slice(0, 200)); }
                let jr = await resp.json();
                let outText = ((((jr.candidates || [])[0] || {}).content || {}).parts || []).map(function(pt){ return pt.text || ''; }).join('');
                outText = outText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                let jStart = outText.indexOf('{'), jEnd = outText.lastIndexOf('}');
                if (jStart < 0) throw new Error('AI không trả về JSON.');
                let examJson = JSON.parse(outText.substring(jStart, jEnd + 1));
                let sets = examJson.sets || [];
                if (!sets.length) throw new Error('JSON không có bộ đề nào.');
                let frag = '<div class="saobay-exam10">\n<script type="application/json" class="saobay-exam10-data">\n'
                    + JSON.stringify(examJson) + '\n<\/script>\n</div>';
                let ta = document.getElementById('item-content');
                if (ta){ ta.value = frag; if (typeof renderMathPreview === 'function'){ try { renderMathPreview(); } catch(e){} } }
                let nQ = sets.reduce(function(s2, st){ return s2 + (st.questions || []).length; }, 0);
                if (pv) pv.innerHTML = '<div class="bg-white border border-emerald-200 rounded-xl p-3"><p class="text-xs font-black text-slate-800">'
                    + '<i class="fa-solid fa-robot text-emerald-600 mr-1"></i>AI đã cấu trúc ' + nQ + ' câu hỏi.</p>'
                    + '<p class="text-[11px] text-slate-500 mt-1">Đã nạp vào khung soạn thảo — <b>kiểm tra lại đáp án</b> rồi nhập tiêu đề, bấm Đẩy bài.</p></div>';
                if (typeof showToast === 'function') showToast('AI đã đọc xong ' + nQ + ' câu!', 'success');
            } catch(e){
                if (pv) pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi AI: ' + String(e.message || e).replace(/</g,'&lt;')
                    + '<br><button onclick="setGeminiKey(\'\');aiParseExam()" class="mt-1 text-blue-600 underline">Nhập lại API key</button></p>';
            }
        }

// ---- Cách 2: dán từ Word ----
function togglePaperPaste(){
    var w = document.getElementById('paper-paste-wrap');
    if (!w) return;
    w.classList.toggle('hidden');
    var box = document.getElementById('paper-paste-box');
    if (box && !w.classList.contains('hidden')) box.focus();
}

function cleanWordPastedHtml(html){
    var s = String(html || '');
    s = s.replace(/<!--[\s\S]*?-->/g, '');          // comment Word
    s = s.replace(/<\?xml[\s\S]*?\?>/gi, '');
    // VML imagedata -> img thường (giữ ảnh data: và base64, bỏ ảnh trỏ file ngoài)
    s = s.replace(/<v:imagedata\b[^>]*src="([^"]+)"[^>]*\/?>/gi, function(m, src){
        if (/^data:/i.test(src)) return '<img src="' + src + '">';
        return '<!-- anh vml bi bo: ' + src.slice(0, 60) + ' -->';
    });
    // Giữ thẻ <img> có src là data: (base64), bỏ img trỏ file tạm ngoài
    s = s.replace(/<img\b[^>]*>/gi, function(m){
        var sm = m.match(/src="([^"]+)"/i);
        var src = sm ? sm[1] : '';
        if (/^data:image\//i.test(src)) return '<img src="' + src + '">';
        return '<!-- anh img bi bo -->';
    });
    // Bỏ thẻ namespace rác, giữ text bên trong
    s = s.replace(/<\/?(?:o|w|m|st1):[a-z0-9]+(?:\s[^>]*)?\/?>/gi, '');
    s = s.replace(/<\/?v:(?:shape|shapetype|stroke|fill|path|formulas|f|imagedata|textpath)[^>]*>/gi, '');
    s = s.replace(/<\/?o:p[^>]*>/gi, '');
    // Bỏ khai báo mso-* trong style, giữ các thuộc tính CSS thường
    s = s.replace(/\sstyle="([^"]*)"/gi, function(m, decls){
        var kept = String(decls).split(';').map(function(d){ return d.trim(); })
            .filter(function(d){ return d && !/^mso-/i.test(d); });
        return kept.length ? ' style="' + kept.join('; ') + '"' : '';
    });
    s = s.replace(/\sclass="Mso[^"]*"/gi, '');       // class MsoNormal...
    s = s.replace(/\slang="[^"]*"/gi, '');
    s = s.replace(/<span>\s*<\/span>/gi, '');
    return s.trim();
}

function onPaperPaste(e){
    e.preventDefault();
    var cd = e.clipboardData || window.clipboardData;
    var html = '';
    try { html = cd.getData('text/html'); } catch(err){}
    var pv = document.getElementById('paper-preview');
    var box = document.getElementById('paper-paste-box');
    if (!html){
        if (pv) pv.innerHTML = '<p class="text-xs text-amber-700">Không nhận được định dạng Word. Hãy mở file trong Word, bôi đen toàn bộ (<b>Ctrl+A</b>), copy (<b>Ctrl+C</b>) rồi dán lại vào khung.</p>';
        return;
    }
    if (pv) pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang xử lý nội dung dán...</p>';
    setTimeout(function(){
        try {
            var cleaned = cleanWordPastedHtml(html);
            var imgCount = (cleaned.match(/<img\b/gi) || []).length;
            var sizeKB = Math.round(encodeURIComponent(cleaned).length / 1024);
            if (sizeKB > 12288){
                if (pv) pv.innerHTML = '<p class="text-xs text-amber-700">Nội dung dán quá nặng (' + sizeKB + ' KB, giới hạn ~12MB). Hãy chia đề thành 2-3 phần, dán và đẩy từng phần.</p>';
                return;
            }
            paperWordState = { html: cleaned, imgCount: imgCount, wmfSkipped: 0, fileName: 'De dan tu Word', kind: 'paste' };
            if (box) box.innerHTML = '<p class="text-emerald-700 text-[11px]"><i class="fa-solid fa-check mr-1"></i>Đã nhận nội dung (' + imgCount + ' ảnh) — xem kết quả bên dưới.</p>';
            renderPaperPreview();
            if (typeof showToast === 'function') showToast('Đã nhận nội dung dán từ Word (' + imgCount + ' ảnh).', 'success');
        } catch(err){
            if (pv) pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi xử lý: ' + String((err && err.message) || err).replace(/</g, '&lt;') + '</p>';
        }
    }, 30);
}

/* ===== SB_PDF_V1_20261012: Đọc đề từ file PDF (pdf.js) — dùng chung bộ tách câu parseWordExam với Word =====
   PDF -> boc chu theo dong (toa do) -> lines[] -> parseWordExam(lines) -> wordState -> sendWordToEditor().
   Chi doc duoc PDF co chu (xuat tu Word/Google Docs/LaTeX); PDF scan/anh se bao ro la khong doc duoc. */
function ensurePdfJs(){
    return new Promise(function(resolve, reject){
        if (window.pdfjsLib){ resolve(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
        s.onload = function(){
            try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'; } catch(e){}
            resolve();
        };
        s.onerror = function(){ reject(new Error('Không tải được thư viện đọc PDF (pdf.js) — kiểm tra kết nối mạng rồi thử lại.')); };
        document.head.appendChild(s);
    });
}
function pdfItemsToLines(items){
    var rows = [];
    (items || []).forEach(function(it){
        if (!it || typeof it.str !== 'string') return;
        var y = it.transform[5], x = it.transform[4];
        var row = null;
        for (var i = 0; i < rows.length; i++){ if (Math.abs(rows[i].y - y) <= 2.5){ row = rows[i]; break; } }
        if (!row){ row = { y: y, parts: [] }; rows.push(row); }
        row.parts.push({ x: x, w: it.width || 0, h: it.height || 10, str: it.str });
    });
    rows.sort(function(a, b){ return b.y - a.y; });
    return rows.map(function(row){
        row.parts.sort(function(a, b){ return a.x - b.x; });
        var out = '', prevEnd = null, prevH = 10;
        row.parts.forEach(function(p){
            if (prevEnd !== null && p.x - prevEnd > Math.max(2, prevH * 0.35) && !/\s$/.test(out) && !/^\s/.test(p.str)) out += ' ';
            out += p.str;
            prevEnd = p.x + p.w; if (p.h) prevH = p.h;
        });
        return out.replace(/\s+/g, ' ').trim();
    }).filter(function(s){ return !!s; });
}
async function handlePdfExamFile(input){
    var f = input.files && input.files[0];
    var pv = document.getElementById('word-preview');
    if (!f || !pv) return;
    pv.innerHTML = '<p class="text-xs text-slate-400 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang đọc file PDF...</p>';
    try {
        await ensurePdfJs();
        var buf = await f.arrayBuffer();
        var pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
        var lines = [];
        for (var p = 1; p <= pdf.numPages; p++){
            var page = await pdf.getPage(p);
            var tc = await page.getTextContent();
            lines = lines.concat(pdfItemsToLines(tc.items));
        }
        var allText = lines.join('\n');
        if (allText.replace(/\s/g, '').length < 50){
            pv.innerHTML = '<p class="text-xs text-rose-600">File PDF này gần như <b>không có chữ</b> — có thể là bản scan/ảnh chụp nên web chưa đọc được. Hãy dùng file PDF xuất từ Word/Google Docs, hoặc tải file .docx.</p>';
            input.value = '';
            return;
        }
        wordState.extractedImages = [];
        wordState.answerTables = [];
        wordState.rawText = allText;
        // Bo cac dong tieu de PHAN II/III/IV... (giu PHAN I de parser bat co phan TN):
        // cac dong nay neu de lai se bi dinh vao noi dung cau truoc trong parseWordExam.
        var parseLines = lines.filter(function(l){ return !/^PHẦN\s+(II|III|IV|V)\b/i.test(l); });
        var qs = parseWordExam(parseLines);
        wordState.questions = qs;
        wordState.fileName = f.name;
        if (!qs.length){
            pv.innerHTML = '<p class="text-xs text-rose-600">Không nhận diện được câu hỏi nào trong PDF. Hãy soạn đúng <b>quy cách</b> (bấm "Hướng dẫn + File mẫu" — quy cách áp dụng chung cho cả PDF).</p>';
            input.value = '';
            return;
        }
        var badge = { mcq: 'bg-blue-100 text-blue-800', truefalse: 'bg-amber-100 text-amber-800', short: 'bg-emerald-100 text-emerald-800' };
        var typeName = { mcq: 'TN', truefalse: 'Đ/S', short: 'TLN', essay: 'TL' };
        var h = '<div class="bg-white border border-rose-200 rounded-xl p-3">'
            + '<p class="text-xs font-black text-slate-800 mb-2"><i class="fa-solid fa-check-circle text-emerald-600 mr-1"></i>Đã đọc ' + qs.length + ' câu từ PDF "' + String(f.name).replace(/</g, '&lt;') + '" (' + pdf.numPages + ' trang)</p>'
            + '<p class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mb-2">PDF chỉ lấy được phần chữ — hình vẽ và công thức phức tạp có thể bị vỡ, đáp án in dạng bảng ngang có thể không khớp. Kiểm tra kỹ từng câu trong khung soạn trước khi đẩy; thiếu hình thì gán ảnh như thường.</p>'
            + '<div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">'
            + qs.map(function(q, i){
                return '<div class="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px]">'
                    + '<span class="font-bold text-slate-400 mr-1">' + (i + 1) + '.</span>'
                    + '<span class="font-semibold">' + String(q.q).replace(/</g, '&lt;').slice(0, 120) + '</span> '
                    + '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ' + (badge[q.type] || 'bg-slate-100') + '">' + (typeName[q.type] || q.type) + '</span>'
                    + '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800">' + q.level + '</span>'
                    + '</div>';
            }).join('') + '</div></div>'
            + '<button onclick="sendWordToEditor()" class="mt-2 w-full bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-arrow-down mr-1"></i>Đưa ' + qs.length + ' câu vào khung soạn để đẩy</button>';
        pv.innerHTML = h;
        try { mountWordEditor(); } catch(eEd){ console.warn('word editor:', eEd); }
    } catch(e){
        pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi đọc file PDF: ' + String((e && e.message) || e).replace(/</g, '&lt;') + '</p>';
    }
    input.value = '';
}
window.handlePdfExamFile = handlePdfExamFile;
/* ===== HẾT SB_PDF_V1_20261012 ===== */

/* ===== SB_WED_20261012_V2: KHUNG SUA CAU HOI sau khi doc Word/PDF =====
   Danh sach cau trong #word-preview tro thanh dung de SUA truc tiep (wordState.questions la nguon su that):
   - Bam chu cai phuong an de DAT DAP AN (TN); cau TLN co o nhap dap an; cau D/S bam tung y de doi Dung/Sai.
   - Muc do NB/TH/VD/VDC la cac nut MAU rieng, bam de doi.
   - Doi DANG cau (TN / D-S / TLN / TL) bang nut dang.
   - Moi cau co KHUNG ANH co dinh o ben phai: bam vao khung de KICH HOAT (khung nhap nhay cho dan),
     roi Ctrl+V la anh vao khung do. Bam vao khung KHONG bat hop chon file; muon chon file thi bam
     nut nho "Chon file" trong khung (hoac bam dup vao khung). Anh luu vao cau (q._imgData),
     khi Day bai se tu upload theo (sendWordToEditor doc q._imgData). */
var WED_LV = [
    { k: 'NB', name: 'NB', cls: 'background:#059669;color:#fff;' },
    { k: 'TH', name: 'TH', cls: 'background:#0284c7;color:#fff;' },
    { k: 'VD', name: 'VD', cls: 'background:#d97706;color:#fff;' },
    { k: 'VDC', name: 'VDC', cls: 'background:#e11d48;color:#fff;' }
];
var WED_TYPES = [
    { k: 'mcq', name: 'TN 4 đáp án' },
    { k: 'truefalse', name: 'Đúng/Sai' },
    { k: 'short', name: 'Trả lời ngắn' },
    { k: 'essay', name: 'Tự luận' }
];
var __wedActiveQi = -1;
function wedEsc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function wedStripOpt(o){ return String(o || '').replace(/^[A-Da-d]\s*[\.\)]\s*/, ''); }
function wedEnsureStyle(){
    if (document.getElementById('wed-style')) return;
    var st = document.createElement('style');
    st.id = 'wed-style';
    st.textContent =
      '.wed-imgframe{border:2px dashed #c4b5fd;background:#f5f3ff;border-radius:10px;min-height:128px;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px;cursor:pointer;outline:none;text-align:center;}'
      + '.wed-imgframe.wed-active{border:2px solid #7c3aed;background:#ede9fe;animation:wedPulse 1.1s ease-in-out infinite;}'
      + '@keyframes wedPulse{0%,100%{box-shadow:0 0 0 2px rgba(124,58,237,.45)}50%{box-shadow:0 0 0 7px rgba(124,58,237,.10)}}'
      + '.wed-caret{display:inline-block;width:2px;height:13px;background:#7c3aed;vertical-align:-2px;margin-left:2px;animation:wedBlink 1s steps(1) infinite;}'
      + '@keyframes wedBlink{50%{opacity:0}}'
      + '.wed-imgframe .wed-hint-active{display:none;}'
      + '.wed-imgframe.wed-active .wed-hint-active{display:block;}'
      + '.wed-imgframe.wed-active .wed-hint-idle{display:none;}';
    document.head.appendChild(st);
}
function wedImgFrame(qi, q){
    var active = (__wedActiveQi === qi) ? ' wed-active' : '';
    var inner;
    if (q._imgData){
        inner = '<img src="' + q._imgData + '" class="max-w-full max-h-36 object-contain rounded border border-violet-200 bg-white">'
            + '<span class="text-[9px] font-bold text-violet-700">Đã có ảnh — dán ảnh mới để thay</span>'
            + '<span class="flex gap-1">'
            + '<button type="button" onclick="event.stopPropagation();wedImgPick(' + qi + ')" class="text-[9px] font-bold px-2 py-1 rounded-full bg-white border border-violet-300 text-violet-700">📁 Đổi file</button>'
            + '<button type="button" onclick="event.stopPropagation();wedImgRemove(' + qi + ')" class="text-[9px] font-bold px-2 py-1 rounded-full bg-rose-100 text-rose-600">✕ Bỏ ảnh</button>'
            + '</span>';
    } else {
        inner = '<i class="fa-regular fa-image text-violet-400" style="font-size:20px"></i>'
            + '<span class="wed-hint-idle text-[10px] font-bold text-violet-600 leading-tight">KHUNG ẢNH<br>Bấm vào đây rồi dán ảnh (Ctrl+V)</span>'
            + '<span class="wed-hint-active text-[10px] font-black text-violet-800 leading-tight">Đang chờ dán ảnh…<span class="wed-caret"></span><br><span class="font-bold">Nhấn Ctrl+V ngay</span></span>'
            + '<button type="button" onclick="event.stopPropagation();wedImgPick(' + qi + ')" class="text-[9px] font-bold px-2 py-1 rounded-full bg-white border border-violet-300 text-violet-700">📁 hoặc chọn file</button>';
    }
    return '<div class="wed-imgframe' + active + '" data-wed-imgbox="' + qi + '" tabindex="0" role="button" aria-label="Khung ảnh câu ' + (qi + 1) + '" '
        + 'onclick="wedImgFocus(' + qi + ',this)" ondblclick="wedImgPick(' + qi + ')" '
        + 'title="Bấm để chọn khung này rồi dán ảnh bằng Ctrl+V. Bấm đúp (hoặc nút Chọn file) để tải ảnh từ máy.">' + inner + '</div>';
}
function wedCard(qi){
    var q = wordState.questions[qi];
    if (!q) return '';
    var type = q.type || 'short';
    var m = '';
    // Hang 1: so cau + dang cau + xoa
    m += '<div class="flex flex-wrap items-center gap-1.5 mb-1.5">'
        + '<span class="text-xs font-black text-slate-700 mr-1">Câu ' + (qi + 1) + '</span>'
        + WED_TYPES.map(function(t){
            var on = type === t.k;
            return '<button type="button" onclick="wedSetType(' + qi + ',\'' + t.k + '\')" class="text-[10px] font-bold px-2 py-1 rounded-full border" style="' + (on ? 'background:#4f46e5;color:#fff;border-color:#4f46e5;' : 'background:#eef2ff;color:#4338ca;border-color:#c7d2fe;') + '">' + t.name + '</button>';
        }).join('')
        + '<button type="button" onclick="wedDel(' + qi + ')" title="Xoá câu này" class="ml-auto text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">🗑 Xoá</button>'
        + '</div>';
    // Hang 2: muc do dang nut mau
    m += '<div class="flex flex-wrap items-center gap-1.5 mb-2"><span class="text-[10px] font-bold text-slate-400">Mức độ:</span>'
        + WED_LV.map(function(lv){
            var on = (q.level || 'NB') === lv.k;
            return '<button type="button" data-wed-lv="' + lv.k + '" onclick="wedSetLevel(' + qi + ',\'' + lv.k + '\')" class="text-[10px] font-black px-2.5 py-1 rounded-full border" style="' + (on ? lv.cls + 'border-color:transparent;box-shadow:0 0 0 2px #1e293b inset;' : 'background:#f1f5f9;color:#64748b;border-color:#e2e8f0;') + '">' + lv.name + '</button>';
        }).join('') + '</div>';
    // Noi dung cau hoi
    m += '<textarea rows="2" oninput="wedText(' + qi + ',\'q\',this.value)" class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-800" placeholder="Nội dung câu hỏi...">' + wedEsc(q.q || '') + '</textarea>';
    // Phan dap an theo dang
    if (type === 'mcq'){
        var opts = (q.options || []).slice(0, 4);
        while (opts.length < 4) opts.push('');
        m += '<div class="mt-1.5 space-y-1">' + opts.map(function(o, oi){
            var letter = 'ABCD'[oi];
            var isAns = String(q.answer || '').toUpperCase() === letter;
            return '<div class="flex items-center gap-1.5">'
                + '<button type="button" data-wed-ans="' + letter + '" onclick="wedSetAnswer(' + qi + ',\'' + letter + '\')" title="Bấm để đặt làm đáp án đúng" class="shrink-0 w-7 h-7 rounded-full text-[11px] font-black border" style="' + (isAns ? 'background:#16a34a;color:#fff;border-color:#16a34a;' : 'background:#f1f5f9;color:#64748b;border-color:#cbd5e1;') + '">' + letter + '</button>'
                + '<input type="text" value="' + wedEsc(wedStripOpt(o)) + '" oninput="wedOptText(' + qi + ',' + oi + ',this.value)" class="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5" placeholder="Phương án ' + letter + '...">'
                + (isAns ? '<span class="text-[9px] font-black text-emerald-600 shrink-0">ĐÁP ÁN</span>' : '')
                + '</div>';
        }).join('') + '</div>'
        + '<p class="text-[9px] text-slate-400 mt-1">Bấm vào vòng tròn chữ cái để chọn đáp án đúng.</p>';
    } else if (type === 'truefalse'){
        var stmts = (q.statements || []).slice();
        while (stmts.length < 4) stmts.push('');
        var ans = Array.isArray(q.answer) ? q.answer : [];
        m += '<div class="mt-1.5 space-y-1">' + stmts.map(function(s, si){
            var v = String(ans[si] || '').toUpperCase();
            var lbl = v === 'T' ? 'ĐÚNG' : (v === 'F' ? 'SAI' : 'CHƯA ĐẶT');
            var st = v === 'T' ? 'background:#16a34a;color:#fff;border-color:#16a34a;' : (v === 'F' ? 'background:#e11d48;color:#fff;border-color:#e11d48;' : 'background:#f1f5f9;color:#94a3b8;border-color:#cbd5e1;');
            return '<div class="flex items-center gap-1.5">'
                + '<span class="shrink-0 text-[11px] font-black text-slate-500 w-5 text-center">' + 'abcd'[si] + ')</span>'
                + '<input type="text" value="' + wedEsc(s) + '" oninput="wedStmtText(' + qi + ',' + si + ',this.value)" class="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5" placeholder="Mệnh đề ' + 'abcd'[si] + '...">'
                + '<button type="button" data-wed-tf="' + si + '" onclick="wedToggleTF(' + qi + ',' + si + ')" title="Bấm để đổi Đúng/Sai" class="shrink-0 text-[10px] font-black px-2.5 py-1.5 rounded-full border" style="' + st + '">' + lbl + '</button>'
                + '</div>';
        }).join('') + '</div>'
        + '<p class="text-[9px] text-slate-400 mt-1">Bấm nút bên phải từng mệnh đề để đổi Đúng/Sai.</p>';
    } else if (type === 'short'){
        m += '<div class="flex items-center gap-1.5 mt-1.5"><span class="text-[10px] font-bold text-slate-500 shrink-0">Đáp án:</span>'
            + '<input type="text" value="' + wedEsc(typeof q.answer === 'string' ? q.answer : '') + '" oninput="wedAnsText(' + qi + ',this.value)" class="flex-1 text-xs border border-emerald-300 rounded-lg px-2 py-1.5 font-semibold" placeholder="Nhập đáp án đúng (vd: 42 hoặc x = 7)..."></div>';
    } else {
        m += '<div class="mt-1.5"><span class="text-[10px] font-bold text-slate-500">Barem / gợi ý chấm:</span>'
            + '<textarea rows="2" oninput="wedText(' + qi + ',\'explain\',this.value)" class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 mt-0.5" placeholder="Barem điểm từng ý...">' + wedEsc(q.explain || '') + '</textarea></div>';
    }
    if (type !== 'essay'){
        m += '<input type="text" value="' + wedEsc(q.explain || '') + '" oninput="wedText(' + qi + ',\'explain\',this.value)" class="w-full text-[11px] border border-dashed border-slate-200 rounded-lg px-2 py-1 mt-1.5 text-slate-500" placeholder="Giải thích (không bắt buộc)...">';
    }
    return '<div class="border border-slate-300 rounded-xl p-2.5 bg-white" data-wed-qi="' + qi + '">'
        + '<div class="flex flex-wrap gap-2 items-stretch">'
        + '<div class="flex-1 min-w-[250px]">' + m + '</div>'
        + '<div class="shrink-0 w-[168px] max-w-full">' + wedImgFrame(qi, q) + '</div>'
        + '</div></div>';
}
function mountWordEditor(){
    var pv = document.getElementById('word-preview');
    if (!pv) return;
    var list = pv.querySelector('.max-h-56');
    if (!list) return;
    wedEnsureStyle();
    var keepScroll = list.scrollTop || 0;
    list.classList.remove('max-h-56');
    list.classList.add('max-h-[75vh]');
    var qs = wordState.questions || [];
    list.innerHTML = '<p class="text-[11px] font-black text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-2">✏️ Sửa câu hỏi (' + qs.length + ' câu) — đặt <b>đáp án</b>, đổi <b>mức độ</b> bằng nút màu, đổi <b>dạng câu</b>; cần ảnh thì bấm vào <b>khung ảnh bên phải</b> từng câu rồi dán (Ctrl+V). Sửa xong bấm nút "Đưa vào khung soạn" ở dưới.</p>'
        + '<div class="space-y-2 mt-2">' + qs.map(function(q, i){ return wedCard(i); }).join('') + '</div>';
    list.scrollTop = keepScroll;
    wedBindPasteOnce();
}
function wedRefreshCard(qi){
    var pv = document.getElementById('word-preview');
    if (!pv) return;
    var card = pv.querySelector('[data-wed-qi="' + qi + '"]');
    if (card) card.outerHTML = wedCard(qi);
}
function wedSetType(qi, t){
    var q = wordState.questions[qi]; if (!q) return;
    var old = q.type || 'short';
    if (old === t) return;
    if (t === 'mcq'){
        var base = (q.options && q.options.length) ? q.options.slice() : (q.statements || []).map(function(s){ return s; });
        while (base.length < 4) base.push('');
        q.options = base.slice(0, 4).map(function(o, i){ return 'ABCD'[i] + '. ' + wedStripOpt(o); });
        q.statements = [];
        if (typeof q.answer !== 'string' || !/^[A-D]$/i.test(q.answer)) q.answer = '';
    } else if (t === 'truefalse'){
        var st = (q.statements && q.statements.length) ? q.statements.slice() : (q.options || []).map(function(o){ return wedStripOpt(o); });
        while (st.length < 4) st.push('');
        q.statements = st.slice(0, 4);
        q.options = [];
        var prev = Array.isArray(q.answer) ? q.answer : [];
        q.answer = q.statements.map(function(_, i){ return prev[i] === 'T' || prev[i] === 'F' ? prev[i] : ''; });
    } else if (t === 'short'){
        q.options = q.options || []; q.statements = q.statements || [];
        if (typeof q.answer !== 'string') q.answer = '';
    } else if (t === 'essay'){
        q.answer = '';
    }
    q.type = t;
    mountWordEditor();
}
function wedSetLevel(qi, lv){
    var q = wordState.questions[qi]; if (!q) return;
    q.level = lv;
    var pv = document.getElementById('word-preview');
    var card = pv && pv.querySelector('[data-wed-qi="' + qi + '"]');
    if (card) card.querySelectorAll('[data-wed-lv]').forEach(function(b){
        var on = b.getAttribute('data-wed-lv') === lv;
        var meta = WED_LV.filter(function(x){ return x.k === b.getAttribute('data-wed-lv'); })[0];
        b.setAttribute('style', on ? meta.cls + 'border-color:transparent;box-shadow:0 0 0 2px #1e293b inset;' : 'background:#f1f5f9;color:#64748b;border-color:#e2e8f0;');
    });
}
function wedSetAnswer(qi, letter){
    var q = wordState.questions[qi]; if (!q) return;
    q.answer = letter;
    wedRefreshCard(qi);
}
function wedToggleTF(qi, si){
    var q = wordState.questions[qi]; if (!q) return;
    if (!Array.isArray(q.answer)) q.answer = [];
    var cur = String(q.answer[si] || '').toUpperCase();
    q.answer[si] = cur === 'T' ? 'F' : 'T';
    wedRefreshCard(qi);
}
function wedText(qi, field, val){ var q = wordState.questions[qi]; if (q) q[field] = val; }
function wedOptText(qi, oi, val){
    var q = wordState.questions[qi]; if (!q) return;
    q.options = q.options || [];
    q.options[oi] = 'ABCD'[oi] + '. ' + val;
}
function wedStmtText(qi, si, val){ var q = wordState.questions[qi]; if (q){ q.statements = q.statements || []; q.statements[si] = val; } }
function wedAnsText(qi, val){ var q = wordState.questions[qi]; if (q) q.answer = val; }
function wedDel(qi){
    if (!confirm('Xoá câu ' + (qi + 1) + ' khỏi danh sách?')) return;
    wordState.questions.splice(qi, 1);
    if (__wedActiveQi === qi) __wedActiveQi = -1;
    else if (__wedActiveQi > qi) __wedActiveQi -= 1;
    var pv = document.getElementById('word-preview');
    if (pv){
        var btn = pv.querySelector('button[onclick="sendWordToEditor()"]');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-arrow-down mr-1"></i>Đưa ' + wordState.questions.length + ' câu vào khung soạn để đẩy';
    }
    mountWordEditor();
}
function wedImgFocus(qi, el){
    __wedActiveQi = qi;
    var pv = document.getElementById('word-preview');
    if (pv) pv.querySelectorAll('.wed-imgframe').forEach(function(f){ f.classList.remove('wed-active'); });
    if (el) { el.classList.add('wed-active'); try { el.focus({ preventScroll: true }); } catch(e){ try { el.focus(); } catch(e2){} } }
}
var _wedImgTarget = -1;
function wedImgPick(qi){
    _wedImgTarget = qi;
    var inp = document.getElementById('wed-img-input');
    if (!inp){
        inp = document.createElement('input');
        inp.type = 'file'; inp.id = 'wed-img-input'; inp.accept = 'image/*'; inp.style.display = 'none';
        inp.addEventListener('change', function(){
            var f = inp.files && inp.files[0];
            if (f && _wedImgTarget >= 0) wedProcessImage(_wedImgTarget, f);
            inp.value = '';
        });
        document.body.appendChild(inp);
    }
    inp.click();
}
function wedImgRemove(qi){
    var q = wordState.questions[qi]; if (!q) return;
    delete q._imgData;
    wedRefreshCard(qi);
}
function wedProcessImage(qi, file){
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function(){
        var dataUrl = rd.result;
        var img = new Image();
        img.onload = function(){
            try {
                var max = 1200, w = img.width || 0, h = img.height || 0;
                var sc = Math.min(1, max / Math.max(w, h));
                if (sc < 1 && w && h){
                    var cv = document.createElement('canvas');
                    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
                    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                    dataUrl = cv.toDataURL('image/jpeg', 0.85);
                }
            } catch(e){}
            var q = wordState.questions[qi];
            if (q){ q._imgData = dataUrl; __wedActiveQi = qi; wedRefreshCard(qi); if (typeof showToast === 'function') showToast('Đã gắn ảnh vào câu ' + (qi + 1) + '.', 'success'); }
        };
        img.onerror = function(){ var q = wordState.questions[qi]; if (q){ q._imgData = dataUrl; wedRefreshCard(qi); } };
        img.src = dataUrl;
    };
    rd.readAsDataURL(file);
}
function wedBindPasteOnce(){
    if (window.__wedPasteBound) return; window.__wedPasteBound = 1;
    document.addEventListener('paste', function(e){
        var pv = document.getElementById('word-preview');
        if (!pv) return;
        var t = e.target;
        // Dang go chu trong o nhap -> giu nguyen hanh vi dan van ban
        if (t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && (t.type === 'text' || t.type === '')))) return;
        var qi = -1;
        var box = t && t.closest ? t.closest('[data-wed-imgbox]') : null;
        if (box) qi = parseInt(box.getAttribute('data-wed-imgbox'), 10);
        if (qi < 0 || isNaN(qi)){
            // Khong co khung nao duoc nham truc tiep -> dung khung dang KICH HOAT (chi khi su kien
            // xay ra trong khu vuc xem truoc hoac tren body, tranh cuop dan anh o khu vuc khac)
            var inPv = t && pv.contains && pv.contains(t);
            var onBody = !t || t === document.body || t === document.documentElement;
            if ((inPv || onBody) && __wedActiveQi >= 0 && wordState.questions[__wedActiveQi]) qi = __wedActiveQi;
        }
        if (qi < 0 || isNaN(qi)) return;
        var items = (e.clipboardData || {}).items || [];
        for (var i = 0; i < items.length; i++){
            if (items[i].type && items[i].type.indexOf('image/') === 0){
                var f = items[i].getAsFile();
                if (f){ e.preventDefault(); wedProcessImage(qi, f); }
                break;
            }
        }
    });
}
window.mountWordEditor = mountWordEditor;
window.wedSetType = wedSetType; window.wedSetLevel = wedSetLevel; window.wedSetAnswer = wedSetAnswer;
window.wedToggleTF = wedToggleTF; window.wedText = wedText; window.wedOptText = wedOptText;
window.wedStmtText = wedStmtText; window.wedAnsText = wedAnsText; window.wedDel = wedDel;
window.wedImgPick = wedImgPick; window.wedImgRemove = wedImgRemove; window.wedImgFocus = wedImgFocus;
/* ===== HẾT SB_WED_20261012_V2 ===== */
