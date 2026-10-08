        // ========================================================
        // SOẠN ĐỀ TỪ FILE WORD (2026-10-08)
        // - Đọc .docx qua mammoth.js, parse theo QUY CÁCH chuẩn
        // - Chuyển thành exam10 JSON, đưa vào khung soạn để đẩy như thường
        // ========================================================

        const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
        let wordState = { questions: [], fileName: '' };

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
            + '<div class="bg-slate-50 border rounded-lg p-2 font-mono text-[11px] whitespace-pre-wrap mb-2">Câu 1 [TN] [NB]\nNội dung câu hỏi viết ở đây...\nA. Phương án A\nB. Phương án B\nC. Phương án C\nD. Phương án D\nĐáp án: B\nGiải thích: Lời giải (không bắt buộc)...\n\nCâu 2 [ĐS] [TH]\nPhát biểu sau đúng hay sai?\na) Mệnh đề a\nb) Mệnh đề b\nc) Mệnh đề c\nd) Mệnh đề d\nĐáp án: Đ, S, Đ, S\n\nCâu 3 [TLN] [VD]\nNội dung câu hỏi...\nĐáp án: 42</div>'
            + '<ul class="list-disc ml-4 space-y-0.5">'
            + '<li><b>Câu N</b>: bắt đầu một câu mới (N là số thứ tự).</li>'
            + '<li><b>[TN]</b> = trắc nghiệm 4 đáp án &nbsp; <b>[ĐS]</b> = đúng/sai &nbsp; <b>[TLN]</b> = trả lời ngắn.</li>'
            + '<li><b>[NB]</b> nhận biết &nbsp; <b>[TH]</b> thông hiểu &nbsp; <b>[VD]</b> vận dụng &nbsp; <b>[VDC]</b> vận dụng cao (mặc định NB).</li>'
            + '<li>Trắc nghiệm: phương án viết <b>A. B. C. D.</b> — Đúng/Sai: mệnh đề viết <b>a) b) c) d)</b>.</li>'
            + '<li><b>Đáp án:</b> TN ghi chữ cái (vd: B) • Đ/S ghi Đ,S cách nhau dấu phẩy (vd: Đ, S, Đ, S) • TLN ghi nội dung.</li>'
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
                let result = await window.mammoth.convertToHtml({ arrayBuffer: buf });
                let doc = new DOMParser().parseFromString(result.value || '', 'text/html');
                let lines = [];
                doc.querySelectorAll('p, li, h1, h2, h3, h4, tr').forEach(function(el){
                    let t = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    if (t) lines.push(t);
                });
                let qs = parseWordExam(lines);
                wordState.questions = qs;
                wordState.fileName = f.name;
                if (!qs.length){
                    pv.innerHTML = '<p class="text-xs text-rose-600">Không nhận diện được câu hỏi nào. Hãy soạn đúng <b>quy cách</b> (bấm "Xem quy cách soạn Word").</p>';
                    return;
                }
                let badge = { mcq: 'bg-blue-100 text-blue-800', truefalse: 'bg-amber-100 text-amber-800', short: 'bg-emerald-100 text-emerald-800' };
                let typeName = { mcq: 'TN', truefalse: 'Đ/S', short: 'TLN' };
                let h = '<div class="bg-white border border-indigo-200 rounded-xl p-3">'
                    + '<p class="text-xs font-black text-slate-800 mb-2"><i class="fa-solid fa-check-circle text-emerald-600 mr-1"></i>Đã đọc ' + qs.length + ' câu từ "' + String(f.name).replace(/</g,'&lt;') + '"</p>'
                    + '<div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">'
                    + qs.map(function(q, i){
                        return '<div class="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px]">'
                            + '<span class="font-bold text-slate-400 mr-1">' + (i+1) + '.</span>'
                            + '<span class="font-semibold">' + String(q.q).replace(/</g,'&lt;').slice(0, 120) + '</span> '
                            + '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ' + (badge[q.type] || 'bg-slate-100') + '">' + (typeName[q.type] || q.type) + '</span>'
                            + '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800">' + q.level + '</span>'
                            + '</div>';
                    }).join('') + '</div>'
                    + '<button onclick="sendWordToEditor()" class="mt-2 w-full bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><i class="fa-solid fa-arrow-down mr-1"></i>Đưa ' + qs.length + ' câu vào khung soạn để đẩy</button>'
                    + '</div>';
                pv.innerHTML = h;
            } catch(e){
                pv.innerHTML = '<p class="text-xs text-rose-600">Lỗi đọc file: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>';
            }
            input.value = '';
        }

        function parseWordExam(lines){
            let questions = [], cur = null;
            let pushCur = function(){ if (cur && cur.q) questions.push(cur); cur = null; };
            lines.forEach(function(raw){
                let line = String(raw || '').trim();
                if (!line) return;
                let mCau = line.match(/^(câu|cau)\s*(\d+)\s*(.*)$/i);
                if (mCau){
                    pushCur();
                    cur = { type: null, level: 'NB', q: '', options: [], statements: [], answer: null, explain: '' };
                    let rest = mCau[3] || '';
                    let tags = rest.match(/\[[^\]]+\]/g) || [];
                    tags.forEach(function(t){
                        let v = t.slice(1, -1).trim().toUpperCase();
                        if (v === 'TN' || v.indexOf('TRẮC NGHIỆM') >= 0 || v.indexOf('TRAC NGHIEM') >= 0) cur.type = 'mcq';
                        else if (v === 'ĐS' || v === 'DS' || v.indexOf('ĐÚNG') >= 0 || v.indexOf('DUNG') >= 0) cur.type = 'truefalse';
                        else if (v === 'TLN' || v.indexOf('TRẢ LỜI NGẮN') >= 0 || v.indexOf('TRA LOI NGAN') >= 0) cur.type = 'short';
                        else if (['NB','TH','VD','VDC'].indexOf(v) >= 0) cur.level = v;
                    });
                    let qtext = rest.replace(/\[[^\]]+\]/g, '').trim();
                    if (qtext) cur.q = qtext;
                    return;
                }
                if (!cur) return;
                let mAns = line.match(/^(đáp án|dap an)\s*:\s*(.+)$/i);
                if (mAns){ cur._ansRaw = mAns[2].trim(); cur._inExplain = false; return; }
                let mExp = line.match(/^(giải thích|giai thich)\s*:\s*(.*)$/i);
                if (mExp){ cur._inExplain = true; cur.explain = (mExp[2] || '').trim(); return; }
                let mOpt = line.match(/^([A-D])[\.\)]\s*(.+)$/);
                if (mOpt && cur.type !== 'truefalse'){ cur.type = cur.type || 'mcq'; cur.options.push(mOpt[1] + '. ' + mOpt[2].trim()); return; }
                let mSt = line.match(/^([a-d])[\.\)]\s*(.+)$/);
                if (mSt && cur.type !== 'mcq'){ cur.type = cur.type || 'truefalse'; cur.statements.push(mSt[2].trim()); return; }
                if (cur._inExplain){ cur.explain += (cur.explain ? ' ' : '') + line; }
                else cur.q += (cur.q ? ' ' : '') + line;
            });
            pushCur();
            questions.forEach(function(q){
                if (!q.type) q.type = q.options.length ? 'mcq' : (q.statements.length ? 'truefalse' : 'short');
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
                } else {
                    q.answer = raw;
                }
                delete q._ansRaw; delete q._inExplain;
            });
            return questions;
        }

        function sendWordToEditor(){
            let qs = wordState.questions || [];
            if (!qs.length){ alert('Chưa có câu hỏi nào để chuyển.'); return; }
            let examJson = { time_limit: 0, sets: [{ name: 'Đề', questions: qs.map(function(q){
                return { type: q.type, level: q.level, q: q.q, options: q.options || [],
                         statements: q.statements || [], answer: q.answer, explain: q.explain || '' };
            }) }] };
            let frag = '<div class="saobay-exam10">\n'
                + '<script type="application/json" class="saobay-exam10-data">\n' + JSON.stringify(examJson) + '\n<\/script>\n</div>';
            let ta = document.getElementById('item-content');
            if (!ta){ alert('Không tìm thấy khung soạn thảo.'); return; }
            ta.value = frag;
            if (typeof renderMathPreview === 'function'){ try { renderMathPreview(); } catch(e){} }
            if (typeof showToast === 'function') showToast('Đã chuyển ' + qs.length + ' câu vào khung soạn. Nhập tiêu đề rồi bấm Đẩy bài.', 'success');
            else alert('Đã chuyển ' + qs.length + ' câu vào khung soạn.');
            let titleInput = document.getElementById('item-title');
            if (titleInput && !titleInput.value.trim()){
                let base = (wordState.fileName || '').replace(/\.docx$/i, '');
                if (base) titleInput.value = base.replace(/[_-]+/g, ' ');
            }
        }
