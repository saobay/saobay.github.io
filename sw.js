/* SB_SW_PROXY_20261013_V6
 * github.io -> Cloudflare Worker (https://saobay.saobayhighschool.workers.dev)
 * Giu nguyen ten mien saobay.github.io tren thanh dia chi + giu dang nhap (cung origin).
 * Yeu cau bat buoc phia Cloudflare: header Access-Control-Allow-Origin: *
 *
 * V2: Worker da ngat auto-deploy (dong bang). Du lieu dong (/data/, /used/)
 *     bypass ve repo origin. Chi noi dung tinh proxy sang Worker.
 * V3: UI hotfix - bo nut noi cay thu muc, Zalo xuong cuoi trang (tiem vao HTML).
 * V4 (2026-10-13): Worker redirect 307 moi URL .html sang dang gon (vd
 *     /teacher/teacher-hub.html -> /teacher/teacher-hub); fetch cors qua SW
 *     gap 307 gay ERR_FAILED. -> Strip .html truoc khi proxy de tranh redirect.
 * V5 (2026-10-13): Fix nut "Nop bai" cuoi de (SB_SUBMITFIX_20261013_V1).
 * V6 (2026-10-13): Khoi phuc ham che do AI bi mat (SB_AI_MODE_FIX_20261013_V1).
 * V7 (2026-10-13): Chuyen /used/ sang Cloudflare KV (Worker saobay-data).
 * V8 (2026-10-13): Tu dong chuyen TeX sang MathML khi xuat Word (SB_AI_WORD_EXPORT_20261013_V1).
 * V8.1: Ma tran/dac ta format dep chuan BGD (V2).
 * V8.3: Hien nut 'Tao prompt' bi an (fix bug quay video).
 *     Phat hien $...$ -> chuyen sang MathML (Word hien dep), khong co -> xuat thuong.
 *     Mat khau hash SHA-256, khong con plaintext tren GitHub.
 *     aiBuildPrompt, aiCopyPrompt, aiRecalc, mergeExamSets.
 *     Bug: __sbEx10EndBtn nhan root la so (variable shadowing e la so bo de),
 *     gay TypeError root.querySelector khi bam -> nut chet.
 *     Fix: clone button de xoa handler loi, gan handler moi dung closest()
 *     tim viewer DOM that.
 */
const UPSTREAM = 'https://saobay.saobayhighschool.workers.dev';
const DATA_UPSTREAM = 'https://saobay-data.saobayhighschool.workers.dev';
// Bypass = phuc vu tu repo origin (luon moi):
const ORIGIN_EXACT = ['/sw.js'];
const ORIGIN_PREFIXES = ['/data/']; // V7: /used/ chuyen sang Cloudflare KV

// UI fix tiem vao HTML (user 2026-10-13)
const UI_FIX_CSS = '<style id="sb-ui-fix-20261013">'
  + '#sb-tree-reopen-btn{display:none!important;visibility:hidden!important;pointer-events:none!important;}label:has(#ai-math){display:none!important;}'
  + '</style>';

// SB_AI_WORD_EXPORT_20261013_V1: Tu dong chuyen TeX sang MathML khi xuat Word
const AI_WORD_EXPORT_JS = '// SB_AI_WORD_EXPORT_20261013_V2: Xuat Word dep chuan (ma tran + dac ta format dep)\n// - Tu dong chuyen TeX $...$ sang MathML\n// - Ma tran / dac ta: bang dep, header in dam, dung chuan BGD\n\n(function() {\n  function texToMml(tex) {\n    try {\n      if (window.MathJax && window.MathJax.tex2mml) {\n        return window.MathJax.tex2mml(tex);\n      }\n    } catch(e) {}\n    return null;\n  }\n\n  function convertTexInText(text) {\n    if (!text || typeof text !== \'string\') return { html: \'\', hasMath: false };\n    var esc = function(s) {\n      return String(s).replace(/&/g, \'&amp;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\').replace(/"/g, \'&quot;\');\n    };\n    var hasMath = false;\n    var html = esc(text).replace(/\\$([^$]+)\\$/g, function(match, tex) {\n      var mml = texToMml(tex);\n      if (mml) { hasMath = true; return mml; }\n      return match;\n    });\n    return { html: html, hasMath: hasMath };\n  }\n\n  // Chuyen markdown table sang HTML dep (header in dam, vien ro)\n  function mdTableToHtmlBeautiful(md) {\n    if (!md) return \'\';\n    var lines = String(md).split(\'\\n\'), rows = [];\n    lines.forEach(function(ln) {\n      ln = ln.trim();\n      if (ln.indexOf(\'|\') !== 0) return;\n      var cells = ln.split(\'|\').slice(1);\n      if (cells.length && cells[cells.length-1].trim() === \'\') cells.pop();\n      cells = cells.map(function(c){ return c.trim(); });\n      if (!cells.length) return;\n      if (cells.every(function(c){ return /^:?-{2,}:?$/.test(c); })) return;\n      rows.push(cells);\n    });\n    if (!rows.length) return \'\';\n    var esc = function(s) {\n      return String(s == null ? \'\' : s).replace(/&/g, \'&amp;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\');\n    };\n    var h = \'<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11pt;font-family:Times New Roman,serif;">\';\n    rows.forEach(function(r, ri) {\n      h += \'<tr>\';\n      r.forEach(function(c) {\n        var tc = convertTexInText(c);\n        if (ri === 0) {\n          // Header: in dam, nen xam nhat\n          h += \'<th style="border:1px solid #000;padding:6px;background:#D9D9D9;font-weight:bold;text-align:center;">\' + tc.html + \'</th>\';\n        } else {\n          h += \'<td style="border:1px solid #000;padding:6px;">\' + tc.html + \'</td>\';\n        }\n      });\n      h += \'</tr>\';\n    });\n    return h + \'</table>\';\n  }\n\n  window.aiExportWord = function() {\n    var W = window.SB_AI_WORD;\n    if (!W) { alert(\'Hãy dán kết quả NotebookLM và bấm "Gộp đề" trước.\'); return; }\n    var totP = 0;\n    W.sets.forEach(function(st){ (st.questions || []).forEach(function(q){ totP += parseFloat(q.points) || 0; }); });\n    \n    var esc = function(s) {\n      return String(s == null ? \'\' : s).replace(/&/g, \'&amp;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\');\n    };\n    \n    var h = \'<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">\'\n      + \'<head><meta charset="utf-8"><title>\' + esc(W.title || \'Đề kiểm tra\') + \'</title></head>\'\n      + \'<body style="font-family:Times New Roman,serif;font-size:13pt;">\'\n      // Tieu de de thi\n      + \'<h2 style="text-align:center;font-weight:bold;">\' + esc((W.subject + \' \' + W.grade + \' — \' + (W.title || \'ĐỀ KIỂM TRA\')).toUpperCase()) + \'</h2>\'\n      + \'<p style="text-align:center;"><b>Thời gian làm bài:</b> \' + esc(W.time) + \' phút &nbsp;•&nbsp; <b>Tổng điểm:</b> \' + (Math.round(totP * 100) / 100) + \'</p>\'\n      + \'<p><b>Họ và tên:</b> ............................ <b>Lớp:</b> ..........</p><hr>\';\n    \n    var hasAnyMath = false;\n    W.sets.forEach(function(st, si) {\n      if (W.sets.length > 1) h += \'<h3 style="font-weight:bold;">\' + esc(st.name || (\'Đề \' + (si + 1))) + \'</h3>\';\n      (st.questions || []).forEach(function(q, i) {\n        var qc = convertTexInText(q.q);\n        if (qc.hasMath) hasAnyMath = true;\n        h += \'<p><b>Câu \' + (i + 1) + \' (\' + (q.points != null ? q.points : \'\') + \'đ):</b> \' + qc.html + \'</p>\';\n        if (q.type === \'mcq\' && q.options) q.options.forEach(function(op, oi) {\n          var opc = convertTexInText(op);\n          if (opc.hasMath) hasAnyMath = true;\n          h += \'<p style="margin-left:24px;">\' + \'ABCD\'[oi] + \'. \' + opc.html + \'</p>\';\n        });\n        if (q.type === \'short\') h += \'<p style="margin-left:24px;"><i>Trả lời:</i> ....................</p>\';\n        if (q.type === \'essay\') h += \'<p style="margin-left:24px;">............................................................................................</p>\';\n      });\n    });\n    \n    // MA TRAN - format dep chuan BGD\n    if (W.matrixMd) {\n      var mtHtml = mdTableToHtmlBeautiful(W.matrixMd);\n      if (mtHtml) {\n        h += \'<br clear="all" style="page-break-before:always;">\'\n          + \'<h3 style="text-align:center;font-weight:bold;">MA TRẬN ĐỀ KIỂM TRA</h3>\'\n          + mtHtml + \'<br>\';\n      }\n    }\n    \n    // DAC TA - format dep chuan BGD\n    if (W.specMd) {\n      var spHtml = mdTableToHtmlBeautiful(W.specMd);\n      if (spHtml) {\n        h += \'<h3 style="text-align:center;font-weight:bold;margin-top:18px;">BẢN ĐẶC TẢ ĐỀ KIỂM TRA</h3>\'\n          + spHtml + \'<br>\';\n      }\n    }\n    \n    // DAP AN\n    h += \'<br clear="all" style="page-break-before:always;">\'\n      + \'<h3 style="text-align:center;font-weight:bold;">ĐÁP ÁN & BAREM CHẤM <i>(dành cho giáo viên)</i></h3>\';\n    W.sets.forEach(function(st, si) {\n      if (W.sets.length > 1) h += \'<h4>\' + esc(st.name || (\'Đề \' + (si + 1))) + \'</h4>\';\n      (st.questions || []).forEach(function(q, i) {\n        var a = q.answer;\n        var aTxt = (a == null) ? \'(tự luận — xem barem)\' : (typeof a === \'object\' ? JSON.stringify(a) : String(a));\n        var ac = convertTexInText(aTxt);\n        h += \'<p><b>Câu \' + (i + 1) + \':</b> \' + ac.html;\n        if (q.explain) {\n          var ec = convertTexInText(q.explain);\n          h += \'<br><i>\' + ec.html + \'</i>\';\n        }\n        h += \'</p>\';\n      });\n    });\n    h += \'</body></html>\';\n    \n    var blob = new Blob([\'\ufeff\', h], { type: \'application/msword\' });\n    var a = document.createElement(\'a\');\n    a.href = URL.createObjectURL(blob);\n    a.download = (\'de-\' + (W.subject || \'kiem-tra\')).replace(/[\\\\/:*?"<>|]/g, \'_\') + \'.doc\';\n    document.body.appendChild(a); a.click();\n    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);\n    \n    var msg = hasAnyMath ? \'Đã tải Word (công thức đã tự chuyển đẹp, ma trận/đặc tả format chuẩn)\' : \'Đã tải Word (ma trận/đặc tả format chuẩn)\';\n    if (typeof showToast === \'function\') showToast(msg, \'success\'); else alert(msg);\n  };\n\n  window.aiMixAndExportWord = function() {\n    if (typeof window.aiMixExams === \'function\') {\n      window.aiMixExams();\n      setTimeout(function() { window.aiExportWord(); }, 500);\n    } else {\n      window.aiExportWord();\n    }\n  };\n})();\n';
const UI_FIX_JS = '<script>(function(){'
  + 'function fixUI(){document.querySelectorAll(\'button\').forEach(function(b){if(b.getAttribute(\'onclick\')&&b.getAttribute(\'onclick\').indexOf(\'aiBuildPrompt\')>=0){b.style.display=\'\';b.style.visibility=\'visible\';}});var am=document.getElementById(\'ai-math\');if(am){am.checked=true;var lb=am.closest(\'label\');if(lb)lb.style.display=\'none\';}'
  + 'var tb=document.getElementById("sb-tree-reopen-btn");if(tb)tb.remove();'
  + 'var z=document.querySelector(\'a[href*="zalo.me/0859946899"]\');'
  + 'if(z&&!z.dataset.sbFixed){z.dataset.sbFixed="1";'
  + 'z.style.position="static";z.style.bottom="auto";z.style.right="auto";z.style.zIndex="auto";'
  + 'z.style.margin="18px auto";z.style.display="inline-flex";'
  + 'var w=document.createElement("div");w.style.textAlign="center";w.style.padding="16px 12px 28px";'
  + 'z.parentNode.insertBefore(w,z);w.appendChild(z);}'
  + 'fixSubmitBtn();'
  + '}'
  // SB_SUBMITFIX_20261013_V1: Fix nut Nop bai cuoi de
  + 'function fixSubmitBtn(){'
  + 'try{'
  + 'document.querySelectorAll(".sb-ex10-final-submit button").forEach(function(btn){'
  + 'if(btn.dataset.sbSubmitFixed)return;'
  + 'btn.dataset.sbSubmitFixed="1";'
  + 'var clone=btn.cloneNode(true);'
  + 'btn.parentNode.replaceChild(clone,btn);'
  + 'clone.addEventListener("click",function(){'
  + 'var viewer=clone.closest(".saobay-exam10");'
  + 'var tb=viewer?viewer.querySelector(".exam10-submit"):null;'
  + 'if(!tb)tb=document.querySelector(".exam10-submit");'
  + 'if(tb)tb.click();'
  + '});'
  + '});'
  + '}catch(_){}'
  + '}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fixUI);else fixUI();'
  + 'new MutationObserver(function(){'
  + 'var tb=document.getElementById("sb-tree-reopen-btn");if(tb)tb.remove();'
  + 'fixSubmitBtn();'
  + '})'
  + '.observe(document.documentElement,{childList:true,subtree:true});'
  + '})();</script>';

// AI mode fix - khoi phuc ham bi mat (SB_AI_MODE_FIX_20261013_V1)
const AI_FIX_JS = '<script>/* SB_AI_MODE_FIX_20261013_V1 */\n' + '/* SB_AI_MODE_FIX_20261013_V1\n * Khoi phuc cac ham che do AI bi mat (aiBuildPrompt, aiCopyPrompt, aiRecalc, mergeExamSets)\n * Tiem vao teacher-hub.html qua sw.js\n */\n\nfunction aiRecalc(){\n  try{\n    var types=[\'mcq\',\'truefalse\',\'short\',\'essay\'];\n    var grandQ=0, grandP=0;\n    types.forEach(function(t){\n      var p=parseFloat((document.getElementById(\'ai-p-\'+t)||{}).value)||0;\n      var nb=parseInt((document.getElementById(\'ai-m-\'+t+\'-nb\')||{}).value)||0;\n      var th=parseInt((document.getElementById(\'ai-m-\'+t+\'-th\')||{}).value)||0;\n      var vd=parseInt((document.getElementById(\'ai-m-\'+t+\'-vd\')||{}).value)||0;\n      var vdc=parseInt((document.getElementById(\'ai-m-\'+t+\'-vdc\')||{}).value)||0;\n      var tq=nb+th+vd+vdc;\n      var tp=Math.round(tq*p*100)/100;\n      var tqEl=document.getElementById(\'ai-tq-\'+t);\n      var tpEl=document.getElementById(\'ai-tp-\'+t);\n      if(tqEl)tqEl.textContent=tq;\n      if(tpEl)tpEl.textContent=tp;\n      grandQ+=tq; grandP+=tp;\n    });\n    grandP=Math.round(grandP*100)/100;\n    var totEl=document.getElementById(\'ai-totals\');\n    if(totEl)totEl.textContent=\'Tổng: \'+grandQ+\' câu — \'+grandP+\' điểm\';\n  }catch(e){ console.log(\'aiRecalc:\', e); }\n}\n\nfunction aiBuildPrompt(){\n  try{\n    var grade=\'\', subject=\'\';\n    // Lay tu Bank 2 selector\n    if(window.SB_BANK2){\n      grade=window.SB_BANK2.grade||\'\';\n      subject=window.SB_BANK2.subject||\'\';\n    }\n    var time=(document.getElementById(\'ai-time\')||{}).value||\'45\';\n    var title=(document.getElementById(\'ai-title\')||{}).value||\'\';\n    var lessons=(document.getElementById(\'ai-lessons\')||{}).value||\'\';\n    var scope=(document.getElementById(\'ai-scope\')||{}).value||\'\';\n    var hasMath=document.getElementById(\'ai-math\')&&document.getElementById(\'ai-math\').checked;\n    \n    // Doc ma tran\n    var types=[\n      {id:\'mcq\', name:\'Trắc nghiệm 4 lựa chọn\'},\n      {id:\'truefalse\', name:\'Đúng / Sai (4 ý)\'},\n      {id:\'short\', name:\'Trả lời ngắn\'},\n      {id:\'essay\', name:\'Tự luận\'}\n    ];\n    var matrixLines=[];\n    types.forEach(function(t){\n      var p=(document.getElementById(\'ai-p-\'+t.id)||{}).value||\'0\';\n      var nb=(document.getElementById(\'ai-m-\'+t.id+\'-nb\')||{}).value||\'0\';\n      var th=(document.getElementById(\'ai-m-\'+t.id+\'-th\')||{}).value||\'0\';\n      var vd=(document.getElementById(\'ai-m-\'+t.id+\'-vd\')||{}).value||\'0\';\n      var vdc=(document.getElementById(\'ai-m-\'+t.id+\'-vdc\')||{}).value||\'0\';\n      var tq=parseInt(nb)+parseInt(th)+parseInt(vd)+parseInt(vdc);\n      if(tq>0){\n        matrixLines.push(\'- \'+t.name+\': \'+tq+\' câu (\'+p+\'đ/câu) — NB:\'+nb+\' TH:\'+th+\' VD:\'+vd+\' VDC:\'+vdc);\n      }\n    });\n    \n    var prompt=\'Bạn là giáo viên \'+subject+\' khối \'+grade+\'. Hãy soạn 1 đề kiểm tra với ma trận đặc tả sau:\\n\\n\';\n    if(title)prompt+=\'Tên đề: \'+title+\'\\n\';\n    prompt+=\'Thời gian: \'+time+\' phút\\n\';\n    if(lessons)prompt+=\'Phạm vi bài/chương: \'+lessons+\'\\n\';\n    if(scope)prompt+=\'Nội dung kiến thức:\\n\'+scope+\'\\n\';\n    prompt+=\'\\nMa trận (tổng điểm tính theo tỉ lệ mức độ):\\n\'+matrixLines.join(\'\\n\')+\'\\n\';\n    if(hasMath){\n      prompt+=\'\\nYêu cầu công thức: mọi công thức Toán học viết bằng TeX $...$ (ví dụ $x^2+1=0$).\\n\';\n    }\n    prompt+=\'\\nTrả về:\\n1. Đề thi dạng JSON (mảng câu hỏi, mỗi câu có q, options, answer, explain)\\n2. Ma trận đặc tả chi tiết\\n3. Đáp án và barem chấm\\n\\nLưu ý: 1 ma trận dùng chung cho 4 bộ đề (đề gốc + 3 đề trộn).\';\n    \n    var out=document.getElementById(\'ai-prompt-out\');\n    if(out)out.value=prompt;\n  }catch(e){ console.log(\'aiBuildPrompt:\', e); alert(\'Lỗi tạo prompt: \'+e.message); }\n}\n\nfunction aiCopyPrompt(){\n  try{\n    var out=document.getElementById(\'ai-prompt-out\');\n    if(!out||!out.value){ alert(\'Chưa có prompt. Bấm "Tạo prompt" trước.\'); return; }\n    out.select();\n    if(navigator.clipboard&&navigator.clipboard.writeText){\n      navigator.clipboard.writeText(out.value).then(function(){\n        alert(\'Đã copy prompt! Dán vào NotebookLM.\');\n      }).catch(function(){\n        document.execCommand(\'copy\');\n        alert(\'Đã copy prompt!\');\n      });\n    }else{\n      document.execCommand(\'copy\');\n      alert(\'Đã copy prompt!\');\n    }\n  }catch(e){ console.log(\'aiCopyPrompt:\', e); }\n}\n\nfunction mergeExamSets(){\n  try{\n    var input=(document.getElementById(\'merge-sets-input\')||{}).value||\'\';\n    var status=document.getElementById(\'merge-sets-status\');\n    if(!input.trim()){\n      if(status){status.textContent=\'Chưa dán kết quả NotebookLM.\';status.className=\'text-[11px] font-bold text-rose-600\';}\n      return;\n    }\n    // Tim JSON trong input (tim cap ngoac vuong dau tien)\n    var jsonStr=null;\n    var start=input.indexOf(\'[\');\n    if(start>=0){\n      var depth=0, inStr=false, esc=false;\n      for(var i=start;i<input.length;i++){\n        var c=input[i];\n        if(esc){esc=false;continue;}\n        if(c===\'\\\\\'){esc=true;continue;}\n        if(c===\'"\'){inStr=!inStr;continue;}\n        if(inStr)continue;\n        if(c===\'[\')depth++;\n        if(c===\']\'){depth--;if(depth===0){jsonStr=input.substring(start,i+1);break;}}\n      }\n    }\n    if(!jsonStr){\n      if(status){status.textContent=\'Không tìm thấy JSON đề trong nội dung dán.\';status.className=\'text-[11px] font-bold text-rose-600\';}\n      return;\n    }\n    var questions=JSON.parse(jsonStr);\n    if(!Array.isArray(questions)||questions.length===0){\n      if(status){status.textContent=\'JSON không phải mảng câu hỏi.\';status.className=\'text-[11px] font-bold text-rose-600\';}\n      return;\n    }\n    // Dua vao khung soan (composer)\n    // Tim textarea/composer cua teacher hub\n    var composer=document.getElementById(\'item-content\')||document.querySelector(\'textarea.composer\')||document.getElementById(\'composer\');\n    if(composer){\n      composer.value=JSON.stringify(questions,null,2);\n      // Kich hoat su kien de UI cap nhat\n      composer.dispatchEvent(new Event(\'input\',{bubbles:true}));\n      composer.dispatchEvent(new Event(\'change\',{bubbles:true}));\n    }\n    if(status){status.textContent=\'Đã gộp \'+questions.length+\' câu vào khung soạn!\';status.className=\'text-[11px] font-bold text-emerald-600\';}\n  }catch(e){\n    console.log(\'mergeExamSets:\', e);\n    var st=document.getElementById(\'merge-sets-status\');\n    if(st){st.textContent=\'Lỗi: \'+e.message;st.className=\'text-[11px] font-bold text-rose-600\';}\n  }\n}\n\n// Tu dong tinh lai khi trang tai xong\nif(document.readyState===\'loading\'){\n  document.addEventListener(\'DOMContentLoaded\',function(){try{aiRecalc();}catch(e){}});\n}else{\n  try{aiRecalc();}catch(e){}\n}\n';


self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  let u;
  try { u = new URL(e.request.url); } catch (_) { return; }
  if (u.origin !== self.location.origin) return;
  for (const p of ORIGIN_EXACT) {
    if (u.pathname === p) return;
  }
  for (const p of ORIGIN_PREFIXES) {
    if (u.pathname === p.slice(0, -1) || u.pathname.startsWith(p)) return;
  }
  // V4: Worker redirect 307 .html -> URL gon. Strip .html truoc de tranh redirect.
  let path = u.pathname;
  if (path === '/index.html') {
    path = '/';
  } else if (path.length > 5 && path.toLowerCase().endsWith('.html')) {
    path = path.slice(0, -5);
  }
  // V7: /used/ phuc vu tu Cloudflare KV (Worker saobay-data)
  let target;
  if (u.pathname === '/used' || u.pathname.startsWith('/used/')) {
    target = DATA_UPSTREAM + u.pathname + u.search;
  } else {
    target = UPSTREAM + path + u.search;
  }
  e.respondWith(
    fetch(target, { mode: 'cors', redirect: 'follow', credentials: 'omit' })
      .then(async (res) => {
        if (!res || (res.status >= 500 && res.status < 600)) return fetch(e.request);
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/html')) {
          try {
            let html = await res.text();
            if (html.includes('</head>')) {
              html = html.replace('</head>', UI_FIX_CSS + '</head>');
            }
            if (html.includes('</body>')) {
              html = html.replace('</body>', UI_FIX_JS + AI_FIX_JS + '<script>' + AI_WORD_EXPORT_JS + '</script>' + '</body>');
            }
            return new Response(html, {
              status: res.status,
              statusText: res.statusText,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          } catch (_) { /* tra nguyen ban */ }
        }
        return res;
      })
      .catch(() => fetch(e.request))
  );
});
