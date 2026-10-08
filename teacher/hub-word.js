        // ========================================================
        // SOẠN ĐỀ TỪ FILE WORD (2026-10-08)
        // - Đọc .docx qua mammoth.js, parse theo QUY CÁCH chuẩn
        // - Chuyển thành exam10 JSON, đưa vào khung soạn để đẩy như thường
        // ========================================================

        const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
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
            + '<div class="bg-slate-50 border rounded-lg p-2 font-mono text-[11px] whitespace-pre-wrap mb-2">Câu 1 [TN] [NB]\nNội dung câu hỏi viết ở đây...\nA. Phương án A\nB. Phương án B\nC. Phương án C\nD. Phương án D\nĐáp án: B\nGiải thích: Lời giải (không bắt buộc)...\n\nCâu 2 [ĐS] [TH]\nPhát biểu sau đúng hay sai?\na) Mệnh đề a\nb) Mệnh đề b\nc) Mệnh đề c\nd) Mệnh đề d\nĐáp án: Đ, S, Đ, S\n\nCâu 3 [TLN] [VD]\nNội dung câu hỏi...\nĐáp án: 42</div>'
            + '<ul class="list-disc ml-4 space-y-0.5">'
            + '<li><b>Câu N</b>: bắt đầu một câu mới (N là số thứ tự).</li>'
            + '<li><b>[TN]</b> = trắc nghiệm 4 đáp án &nbsp; <b>[ĐS]</b> = đúng/sai &nbsp; <b>[TLN]</b> = trả lời ngắn &nbsp; <b>[TL]</b> = tự luận (GV chấm tay).</li>'
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
                let typeName = { mcq: 'TN', truefalse: 'Đ/S', short: 'TLN', essay: 'TL' };
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
                // UI gan anh vao cau hoi (neu co anh trich xuat)
                if (wordState.extractedImages && wordState.extractedImages.length){
                    h += '<div class="mt-2 bg-white border border-amber-200 rounded-xl p-3">'
                        + '<p class="text-xs font-black text-slate-800 mb-2"><i class="fa-solid fa-images text-amber-600 mr-1"></i>Gán ảnh vào câu hỏi (' + wordState.extractedImages.length + ' ảnh)</p>'
                        + '<div class="space-y-2 max-h-64 overflow-y-auto pr-1">'
                        + wordState.extractedImages.map(function(im, ii){
                            var opts = '<option value="">-- Không gán --</option>' + qs.map(function(q, qi){
                                return '<option value="' + qi + '">Câu ' + (qi+1) + '</option>';
                            }).join('');
                            return '<div class="flex items-center gap-2 border border-slate-200 rounded-lg p-2">'
                                + '<img src="data:' + im.contentType + ';base64,' + im.b64 + '" class="w-16 h-16 object-contain rounded border border-slate-200 bg-slate-50">'
                                + '<div class="flex-1"><p class="text-[11px] font-bold text-slate-600 mb-1">Ảnh ' + (ii+1) + '</p>'
                                + '<select id="img-map-' + ii + '" class="w-full text-xs border rounded-lg px-2 py-1">' + opts + '</select></div>'
                                + '</div>';
                        }).join('') + '</div></div>';
                }
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
                        else if (v === 'TL' || v.indexOf('TỰ LUẬN') >= 0 || v.indexOf('TU LUAN') >= 0) cur.type = 'essay';
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
                if (mOpt && cur.type !== 'truefalse' && cur.type !== 'essay'){ cur.type = cur.type || 'mcq'; cur.options.push(mOpt[1] + '. ' + mOpt[2].trim()); return; }
                let mSt = line.match(/^([a-d])[\.\)]\s*(.+)$/);
                if (mSt && cur.type !== 'mcq' && cur.type !== 'essay'){ cur.type = cur.type || 'truefalse'; cur.statements.push(mSt[2].trim()); return; }
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
                } else if (q.type === 'essay') {
                    q.answer = '';
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
            // Gan anh vao cau hoi theo mapping cua giao vien
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
                if (imgMap[qi]) o.img = imgMap[qi];
                return o;
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
