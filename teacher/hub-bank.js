        // ========================================================
        // NGÂN HÀNG CÂU HỎI — data/bank/ (Phase 2, 2026-10-08)
        // - Tự bóc câu hỏi từ file đề (saobay-exam10-data) mỗi lần đẩy bài
        // - Lưu vào data/bank/{MON}_{KHOI}.json kèm thẻ nhận dạng
        // - Trình duyệt bank + trình sinh file "cầu nối" chương
        // ========================================================

        function bankNorm(s){
            return String(s == null ? '' : s).toLowerCase()
                .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g,'a').replace(/[èéẹẻẽêềếệểễ]/g,'e')
                .replace(/[ìíịỉĩ]/g,'i').replace(/[òóọỏõôồốộổỗơờớợởỡ]/g,'o')
                .replace(/[ùúụủũưừứựửữ]/g,'u').replace(/[ỳýỵỷỹ]/g,'y').replace(/đ/g,'d')
                .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
        }

        function bankNormLevel(lv){
            let s = bankNorm(lv);
            if (/^(vdc|van\sdung\acao)/.test(s)) return 'VDC';
            if (/^(vd|van\sdung)/.test(s)) return 'VD';
            if (/^(th|thong\shieu)/.test(s)) return 'TH';
            return 'NB';
        }

        // Đoán thẻ môn/khối/chương/bài từ tên file + thư mục
        function parseBankMeta(formattedFileName, targetFolder){
            let raw = String(formattedFileName || '').replace(/\.html$/i,'');
            let subject = (raw.match(/^([A-Za-z]+)/) || ['','TOAN'])[1].toUpperCase();
            let gradeM = raw.match(/_(\d{1,2})_/);
            let grade = gradeM ? parseInt(gradeM[1],10) : 10;
            let folderM = String(targetFolder || '').match(/lớp\s*(\d{1,2})/i);
            if (folderM) grade = parseInt(folderM[1],10);
            let lessonM = raw.match(/BAI_(\d+)/i);
            let chapterM = raw.match(/CHUONG_(\d+)/i);
            return {
                subject: subject,
                grade: grade,
                chapter: chapterM ? parseInt(chapterM[1],10) : 1,
                lesson: lessonM ? parseInt(lessonM[1],10) : 0
            };
        }

        function bankKey(subject, grade){
            return 'data/bank/' + subject.toUpperCase() + '_' + grade + '.json';
        }

        // Bóc toàn bộ câu hỏi từ các khối saobay-exam10-data trong HTML
        function extractQuestionsFromExam10(finalHtml, meta, sourcePath){
            let out = [];
            let re = /<script[^>]*class=["']saobay-exam10-data["'][^>]*>\s*(\{[\s\S]*?\})\s*<\/script>/gi;
            let m, today = new Date().toISOString().slice(0,10);
            while ((m = re.exec(finalHtml)) !== null){
                let obj;
                try { obj = JSON.parse(m[1]); } catch(e){ continue; }
                (obj.sets || []).forEach(function(set, si){
                    (set.questions || []).forEach(function(qq, qi){
                        // 2026-10-11: nhan dien type linh hoat (nhieu bien the)
                        let rawT = String(qq.type || qq.kind || '').toLowerCase().trim();
                        let detType = 'mcq';
                        if (['truefalse','tf','ds','dung_sai','dungsai'].indexOf(rawT) >= 0) detType = 'truefalse';
                        else if (['short','tln','traloi_ngan','tra_loi_ngan'].indexOf(rawT) >= 0) detType = 'short';
                        else if (['essay','tl','tuluan','tu_luan'].indexOf(rawT) >= 0) detType = 'essay';
                        else if (['listening','nghe'].indexOf(rawT) >= 0) detType = 'listening';
                        else if (['speaking','noi'].indexOf(rawT) >= 0) detType = 'speaking';
                        else if (['matching','noi_tu'].indexOf(rawT) >= 0) detType = 'matching';
                        else if (['ordering','sapxep','sap_xep'].indexOf(rawT) >= 0) detType = 'ordering';
                        else if (qq.statements && qq.statements.length) detType = 'truefalse';
                        else if (qq.options && qq.options.length) detType = 'mcq';
                        else if (qq.answer != null && String(qq.answer).length < 50) detType = 'short';
                        else detType = 'essay';
                        let q = {
                            subject: meta.subject, grade: meta.grade,
                            chapter: meta.chapter, lesson: meta.lesson,
                            type: detType,
                            level: bankNormLevel(qq.level),
                            q: String(qq.q || ''), options: qq.options || [],
                            statements: qq.statements || [],
                            answer: qq.answer == null ? '' : qq.answer,
                            explain: String(qq.explain || ''),
                            tags: [meta.subject.toLowerCase(), String(meta.grade), 'chuong-' + meta.chapter],
                            source: sourcePath, setName: set.name || ('Đề ' + (si+1)),
                            created: today
                        };
                        if (bankNorm(q.q)) out.push(q);
                    });
                });
            }
            return out;
        }

        // 2026-10-11: bank doc TRUC TIEP tu file bai hoc (khong can file bank rieng -> khong x2 data)
        // Toi uu 2026-10-11: dung Git Trees API recursive (1 call) + cache localStorage
        var _bankLessonCache = {};
        function _bankCacheGet(key){
            return _bankLessonCache[key] || null;
        }
        function _bankCacheSet(key, data){
            _bankLessonCache[key] = data;
        }
        // 2026-10-11: doc tu file index tinh
        var _bankFolderIndex = null;
        async function _bankLoadIndex(){
            if (_bankFolderIndex) return _bankFolderIndex;
            try {
                var r = await fetch('https://saobay.github.io/data/folder-index/folders.json?v=' + Date.now());
                if (!r.ok) return null;
                _bankFolderIndex = await r.json();
                return _bankFolderIndex;
            } catch(e){ return null; }
        }
        async function bankBuildFromLessons(subject, grade){
            var cacheKey = subject + '_' + grade;
            var cached = _bankCacheGet(cacheKey);
            if (cached) return cached;
            var cfg = GITHUB_CONFIG;
            var normSubj = String(subject || '').toUpperCase();
            try {
                // 2026-10-11: Contents API tung buoc (khong localStorage, khong recursive tree bi 403)
                function _normS(raw){
                    var n = raw.trim().replace(/\s*\d+\s*$/, '').trim().toUpperCase();
                    n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0110/g, 'D').replace(/\u0111/g, 'd');
                    return n.replace(/\s+/g, '_');
                }
                async function _ct(path){
                    var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + cfg.branch;
                    var r = await fetch(url);
                    if (!r.ok) return [];
                    var j = await r.json();
                    return Array.isArray(j) ? j : [];
                }
                var subjPath = null;
                var bIdx = await _bankLoadIndex();
                if (bIdx && bIdx.grades && bIdx.grades[String(grade)]){
                    var bSm = bIdx.grades[String(grade)];
                    var bSk = Object.keys(bSm).find(function(k){ return k === normSubj || k.toLowerCase() === normSubj.toLowerCase(); });
                    if (bSk) subjPath = bSm[bSk].path;
                }
                if (!subjPath) return { notFound: true };
                var chapters = await _ct(subjPath);
                var htmlFiles = [];
                for (var chi = 0; chi < chapters.length; chi++){
                    var chd = chapters[chi];
                    if (chd.type !== 'dir') continue;
                    var flist = await _ct(subjPath + '/' + chd.name);
                    for (var fli = 0; fli < flist.length; fli++){
                        var fl = flist[fli];
                        if (fl.type === 'file' && /\.html?$/i.test(fl.name || '')){
                            htmlFiles.push({ path: subjPath + '/' + chd.name + '/' + fl.name, chapter: chd.name, file: fl.name });
                        }
                    }
                }
                if (!htmlFiles.length) return { notFound: true };
                // Tai song song theo batch 10 file
                var questions = [];
                for (var b = 0; b < htmlFiles.length; b += 10){
                    var batch = htmlFiles.slice(b, b + 10);
                    var results = await Promise.all(batch.map(async function(item){
                        try {
                            var fp = item.path;
                            var chM = String(item.chapter || '').match(/(\d+)/);
                            var chapter = chM ? parseInt(chM[1], 10) : 0;
                            var lM = String(item.file || '').match(/Bai_(\d+)/i);
                            var lesson = lM ? parseInt(lM[1], 10) : 0;
                            var hr = await fetch('https://raw.githubusercontent.com/' + cfg.owner + '/' + cfg.repo + '/' + cfg.branch + '/' + fp.split('/').map(encodeURIComponent).join('/'));
                            if (!hr.ok) return [];
                            var html = await hr.text();
                            var meta = { subject: normSubj, grade: grade, chapter: chapter, lesson: lesson };
                            return extractQuestionsFromExam10(html, meta, fp);
                        } catch(e){ return []; }
                    }));
                    results.forEach(function(qs){ questions = questions.concat(qs); });
                }
                if (!questions.length) return { notFound: true };
                var result = { sha: null, data: { subject: normSubj, grade: grade, updated: new Date().toISOString().slice(0,10), questions: questions, _fromLessons: true } };
                _bankCacheSet(cacheKey, result);
                return result;
            } catch(e){
                return { notFound: true };
            }
        }

        async function bankApiRead(bankPath){
            // FIX 2026-10-09: bank la public nen doc qua raw.githubusercontent.com, KHONG can token
            // (truoc day bat buoc token -> GV khong phai admin khong dung duoc)
            try {
                let rawUrl = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                    + '/' + GITHUB_CONFIG.branch + '/' + getEncodedGitHubPath(bankPath);
                let rr = await fetch(rawUrl);
                if (rr.status === 404){
                    // 2026-10-11: khong co file bank -> doc truc tiep tu bai hoc (khong x2 data)
                    let m = String(bankPath || '').match(/data\/bank\/([A-Z0-9_]+)_(\d+)\.json$/i);
                    if (m) return await bankBuildFromLessons(m[1], parseInt(m[2], 10));
                    return { notFound: true };
                }
                if (rr.ok) return { sha: null, data: JSON.parse(await rr.text()) };
            } catch(eRaw){}
            let token = getGithubToken();
            if (!token) return { error: 'no-token' };
            let apiUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                + '/contents/' + getEncodedGitHubPath(bankPath) + '?ref=' + GITHUB_CONFIG.branch;
            let res = await fetch(apiUrl, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
            if (res.status === 404){
                let m2 = String(bankPath || '').match(/data\/bank\/([A-Z0-9_]+)_(\d+)\.json$/i);
                if (m2) return await bankBuildFromLessons(m2[1], parseInt(m2[2], 10));
                return { notFound: true };
            }
            if (!res.ok) return { error: 'http-' + res.status };
            let data = await res.json();
            let bin = atob(String(data.content || '').replace(/\s/g,''));
            let bytes = new Uint8Array(bin.length);
            for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
            let text = new TextDecoder('utf-8').decode(bytes);
            return { sha: data.sha, data: JSON.parse(text) };
        }

        async function bankApiWrite(bankPath, obj, sha, message){
            let token = getGithubToken();
            let apiUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                + '/contents/' + getEncodedGitHubPath(bankPath);
            let body = { message: message, content: utf8ToBase64(JSON.stringify(obj)), branch: GITHUB_CONFIG.branch };
            if (sha) body.sha = sha;
            let res = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok){ let t = await res.text(); throw new Error('GitHub API ' + res.status + ': ' + t.slice(0,120)); }
            return res.json();
        }

        // Ghi nối câu hỏi mới vào bank (khử trùng theo nội dung câu hỏi)
        async function pushQuestionsToBank(questions, meta){
            if (!questions.length) return { added: 0 };
            let path = bankKey(meta.subject, meta.grade);
            let read = await bankApiRead(path);
            if (read.error) throw new Error(read.error);
            let bank = read.notFound
                ? { subject: meta.subject, grade: meta.grade, updated: new Date().toISOString().slice(0,10), questions: [] }
                : read.data;
            if (!Array.isArray(bank.questions)) bank.questions = [];
            let seen = {};
            bank.questions.forEach(function(q){ seen[bankNorm(q.q)] = 1; });
            let dateTag = new Date().toISOString().slice(0,10).replace(/-/g,'');
            let added = 0;
            questions.forEach(function(q){
                let key = bankNorm(q.q);
                if (!key || seen[key]) return;
                seen[key] = 1;
                added++;
                q.id = meta.subject.toUpperCase() + meta.grade + '_' + dateTag + '_' + String(bank.questions.length + 1).padStart(4,'0');
                bank.questions.push(q);
            });
            bank.updated = new Date().toISOString().slice(0,10);
            await bankApiWrite(path, bank, read.sha, 'Bank: +' + added + ' câu ' + meta.subject + ' khối ' + meta.grade);
            return { added: added, path: path };
        }

        // Hook tự động: gọi sau khi đẩy bài thành công (không làm hỏng luồng chính)
        async function autoSaveToBank(finalHtml, formattedFileName, targetGitPath, targetFolder, explicitMeta){
            try {
                if (finalHtml.indexOf('saobay-exam10-data') === -1) return;
                let meta = parseBankMeta(formattedFileName, targetFolder);
                // Uu tien vung kien thuc GV chon tren form (2026-10-08)
                if (explicitMeta){
                    if (explicitMeta.subject) meta.subject = String(explicitMeta.subject).toUpperCase();
                    if (explicitMeta.grade) meta.grade = parseInt(explicitMeta.grade, 10) || meta.grade;
                    if (explicitMeta.chapter !== undefined && explicitMeta.chapter !== '') meta.chapter = parseInt(explicitMeta.chapter, 10) || 0;
                    if (explicitMeta.lesson !== undefined && explicitMeta.lesson !== '') meta.lesson = parseInt(explicitMeta.lesson, 10) || 0;
                }
                let qs = extractQuestionsFromExam10(finalHtml, meta, targetGitPath);
                if (!qs.length) return;
                let r = await pushQuestionsToBank(qs, meta);
                if (r.added > 0 && typeof showToast === 'function')
                    showToast('Đã lưu ' + r.added + ' câu vào ngân hàng ' + meta.subject + ' khối ' + meta.grade, 'success');
            } catch(e){ console.log('autoSaveToBank note:', e); }
        }

        // Đẩy 1 file HTML lên GitHub qua GAS proxy (không cần token cá nhân — 2026-10-09)
        // FIX 2026-10-10: AbortController timeout 30s — fetch treo thì tự hủy, không chờ vô hạn.
        // Đây là điểm nghẽn chung cho mọi nút "Lưu đề" (bank, class, exam builder).
        async function bankPushFile(targetPath, htmlContent, commitMessage){
            let payload = {
                type: 'PUSH_TO_GITHUB',
                filePath: targetPath,
                content: htmlContent,
                commitMessage: commitMessage || ('Upload: ' + targetPath),
                title: String(targetPath).split('/').pop(),
                author: (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Teacher'
            };
            let _ctrl = null, _timer = null;
            try {
                let _opts = {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                };
                if (typeof AbortController !== 'undefined'){
                    _ctrl = new AbortController();
                    _opts.signal = _ctrl.signal;
                    _timer = setTimeout(function(){ try { _ctrl.abort(); } catch(e){} }, 30000);
                }
                let res = await fetch(API_URL, _opts);
                let result = await parseSafeResponse(res);
                if (!result || result.status !== 'success'){
                    throw new Error('GAS proxy: ' + ((result && result.message) || 'lỗi không xác định'));
                }
                return result;
            } catch(e){
                if (e && e.name === 'AbortError'){
                    throw new Error('Hết thời gian chờ (30s) — GAS proxy không phản hồi. Kiểm tra mạng rồi bấm Lưu lại.');
                }
                throw e;
            } finally {
                if (_timer) clearTimeout(_timer);
            }
        }

        // Chuẩn hoá HTML bọc ngoài cho file cầu nối / đề kiểm tra
        function bankWrapPage(safeTitle, labelText, innerHtml){
            return '<!DOCTYPE html>\n<html lang="vi">\n<head>\n'
                + '    <meta charset="UTF-8">\n'
                + '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
                + '    <title>' + safeTitle + '</title>\n'
                + '    <meta name="lesson-title" content="' + safeTitle + '">\n'
                + '    <script src="https://cdn.tailwindcss.com"><\/script>\n'
                + '    <style>\n'
                + "        body { font-family: system-ui, sans-serif; padding: 16px; line-height: 1.6; color: #1e293b; margin: 0 auto; }\n"
                + '    <\/style>\n</head>\n'
                + '<body class="bg-slate-50 min-h-screen">\n'
                + '    <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mt-4 mb-8">\n'
                + '        <div class="border-b pb-4 mb-6">\n'
                + '            <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">' + labelText + '</span>\n'
                + '            <h1 class="text-2xl font-black text-slate-900 mt-1">' + safeTitle + '</h1>\n'
                + '        </div>\n'
                + '        <div class="content-body space-y-4">\n' + innerHtml + '\n        </div>\n'
                + '    </div>\n'
                + '<!-- SAOBAY-PROTECT: (c) 2026 Truong THPT Sao Bay | Nghiem cam sao chep duoi moi hinh thuc -->'
                + '<footer class="saobay-copyright-footer" style="margin-top:2rem;padding:1rem 0.5rem 2.5rem;text-align:center;border-top:1px solid #e2e8f0;">'
                + '<p style="font-size:12px;color:#94a3b8;margin:0">© 2026 Trường THPT Sào Báy — Nền tảng học tập SAOBAY</p>'
                + '<p style="font-size:12px;color:#94a3b8;margin:4px 0 0">Nghiêm cấm sao chép, phát tán nội dung dưới mọi hình thức khi chưa được sự cho phép bằng văn bản.</p>'
                + '</footer>'
                + '<script data-saobay-guard="1">(function(){try{var h=(location.hostname||"").toLowerCase();var ok=(h===""||h==="saobay.github.io"||h==="localhost"||h==="127.0.0.1"||h.slice(-17)===".saobay.github.io");if(!ok&&document.body){document.body.innerHTML="";var d=document.createElement("div");d.setAttribute("style","max-width:560px;margin:60px auto;padding:32px;text-align:center;border:1px solid #e2e8f0;border-radius:16px;background:#fff;font-family:system-ui,sans-serif");var t1=document.createElement("h2");t1.setAttribute("style","color:#0f172a");t1.textContent="(c) SAOBAY - Truong THPT Sao Bay";var t2=document.createElement("p");t2.setAttribute("style","color:#475569");t2.textContent="Noi dung nay chi duoc hien thi tai dia chi chinh thuc saobay.github.io. Vui long truy cap dung dia chi de hoc tap.";d.appendChild(t1);d.appendChild(t2);document.body.appendChild(d);}}catch(e){}})();</script>'
                + '</body>\n</html>';
        }
