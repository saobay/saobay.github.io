        // ========================================================
        // QUẢN LÝ CÁC MODULE CHỨC NĂNG CỦA TEACHER HUB
        // ========================================================
        (function hideAuditTab(){
            try {
                let b = document.getElementById('mod-tab-audit');
                if (b) b.style.display = 'none';
                let v = document.getElementById('module-audit-view');
                if (v) v.style.display = 'none';
            } catch(e){}
        })();
        function switchTeacherModule(modId) {
            try {
                ['compose', 'manage', 'stats'].forEach(function(id){
                    let tab = document.getElementById('mod-tab-' + id);
                    let view = document.getElementById('module-' + id + '-view');
                    let iconBox = tab ? tab.querySelector('div') : null;
                    let active = (id === modId);
                    if (tab) tab.className = "module-tab-btn flex items-center p-2.5 rounded-xl transition border text-left " + (active ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100");
                    if (iconBox) iconBox.className = "w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold shrink-0 mr-2.5 " + (active ? "bg-blue-600 text-white shadow" : "bg-slate-200 text-slate-700");
                    if (view) {
                        if (active) view.classList.remove('hidden');
                        else view.classList.add('hidden');
                    } else if (active) {
                        console.error('[hub] Khong tim thay view: module-' + id + '-view');
                    }
                });
            } catch(eSw){ console.error('[hub] switchTeacherModule loi:', eSw); }
            try {
                if (modId === 'manage') renderLessonManagementList();
                else if (modId === 'audit') renderAuditList();
                else if (modId === 'stats') renderStatsOverview();
            } catch(eR){ console.error('[hub] render module loi:', eR); }
        }

        function getManageFolder(){ try { return (typeof currentSelectedFolderId !== 'undefined' && currentSelectedFolderId) ? currentSelectedFolderId : ''; } catch(e){ return ''; } }
        function manageFolderLabel(){ var p = getManageFolder(); if(!p) return 'Tất cả thư mục'; var s = p.split('/'); return s[s.length-1] || p; }
        function setManageFolderFilter(v){ renderLessonManagementList(); }
        let manageTypeFilter = 'all'; // 'all' | 'theory' | 'exam'
        function setManageTypeFilter(t){
            manageTypeFilter = t;
            ['all','theory','exam'].forEach(function(k){
                let b = document.getElementById('mfilter-' + k);
                if (b) b.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (k === t ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200');
            });
            renderLessonManagementList();
        }
        function fileKindOf(fileName){
            if (/_?Bai.?tap|_?Kiem.?tra|_?De.?thi|exam|test/i.test(fileName)) return 'exam';
            return 'theory';
        }
        function fileVerifier(fileName){
            let raw = String(fileName || '').replace(/\.html$/i, '');
            let m = raw.match(/_id\d+|_gv\w+/i);
            if (m) return m[0].replace(/^_/, '');
            if (/^unit\d+|^test\d+/i.test(raw)) return 'Tổ Bộ Môn';
            return '';
        }
        function fileApproved(fileName){
            let raw = String(fileName || '').replace(/\.html$/i, '');
            if (/_id\d+|_gv\w+/i.test(raw)) return true;
            if (/^unit\d+|^test\d+/i.test(raw)) return true;
            return false;
        }
        async function approveLessonCore(filePath, fileName, tag){
            let newFileName = fileName.replace(/_none/i, '_' + tag);
            if (newFileName === fileName) newFileName = fileName.replace(/\.html$/i, '_' + tag + '.html');
            let slash = filePath.lastIndexOf('/');
            let newPath = (slash === -1 ? '' : filePath.substring(0, slash + 1)) + newFileName;
            if (newPath === filePath){ alert('Bài này đã được duyệt rồi.'); return; }
            try {
                let token = (typeof getGithubToken === 'function') ? getGithubToken() : null;
                // 1. Doc noi dung file cu
                let oldUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(filePath) + '?ref=' + GITHUB_CONFIG.branch;
                let hh = { 'Accept': 'application/vnd.github+json' };
                if (token) hh['Authorization'] = 'Bearer ' + token;
                let gr = await fetch(oldUrl, { headers: hh });
                if (!gr.ok) throw new Error('Không đọc được file gốc (HTTP ' + gr.status + ')');
                let gj = await gr.json();
                let contentB64 = gj.content || '';
                // 2. Tao file moi (ten da duyet)
                let newUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(newPath);
                let putBody = { message: 'Duyệt bài: ' + fileName + ' -> ' + newFileName, content: contentB64.replace(/\n/g, ''), branch: GITHUB_CONFIG.branch };
                let hdrs = { 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
                if (token) hdrs['Authorization'] = 'Bearer ' + token;
                let pr;
                if (token) {
                    pr = await fetch(newUrl, { method: 'PUT', headers: hdrs, body: JSON.stringify(putBody) });
                } else {
                    // Qua proxy
                    let rx = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: newPath, content: atob(contentB64.replace(/\n/g, '')), commitMessage: putBody.message }) });
                    let rj = await rx.json().catch(function(){ return {}; });
                    pr = { ok: rj.status === 'success' };
                }
                if (!pr.ok) throw new Error('Không tạo được file đã duyệt.');
                // 3. Xoa file cu
                let delBody = { message: 'Xóa bản chưa duyệt: ' + fileName, sha: gj.sha, branch: GITHUB_CONFIG.branch };
                if (token) {
                    let dr = await fetch(oldUrl, { method: 'DELETE', headers: hdrs, body: JSON.stringify(delBody) });
                    if (!dr.ok) console.warn('Khong xoa duoc file cu');
                } else {
                    await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({ type: 'DELETE_FROM_GITHUB', filePath: filePath, commitMessage: delBody.message }) });
                }
                return true;
            } catch(e){ throw e; }
        }
        async function approveLesson(filePath, fileName){
            let uname = '';
            try { uname = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : ''; } catch(e){}
            let tag = 'gv' + uname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');
            tag = tag.slice(0, 18) || 'gvGV';
            if (!confirm('Duyệt bài "' + fileName.replace(/\.html$/i, '') + '"?\nFile sẽ được gắn mã duyệt _' + tag + '.')) return;
            try {
                await approveLessonCore(filePath, fileName, tag);
                alert('Đã duyệt bài thành công!');
                renderLessonManagementList();
            } catch(e){ alert('Lỗi duyệt bài: ' + (e.message || e)); }
        }
        async function approveAllInFolder(){
            try {
                let uname = '';
                try { uname = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : ''; } catch(e){}
                let tag = 'gv' + uname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');
                tag = tag.slice(0, 18) || 'gvGV';
                let list = (typeof lessonRegistry !== 'undefined' && lessonRegistry.files) ? lessonRegistry.files : [];
                let curFolder = getManageFolder();
                let targets = list.filter(function(f){
                    let lastSlash = f.path.lastIndexOf('/');
                    let fn = lastSlash === -1 ? f.path : f.path.substring(lastSlash + 1);
                    if (fileApproved(fn)) return false;
                    if (curFolder && !f.path.startsWith(curFolder + '/') && f.path !== curFolder) return false;
                    return true;
                });
                if (!targets.length){ alert('Không có bài chưa duyệt trong thư mục này.'); return; }
                if (!confirm('Duyệt TẤT CẢ ' + targets.length + ' bài chưa duyệt trong thư mục hiện tại?\nMỗi bài sẽ được gắn mã _' + tag + '.')) return;
                let ok = 0, fail = 0;
                for (let f of targets){
                    let lastSlash = f.path.lastIndexOf('/');
                    let fn = lastSlash === -1 ? f.path : f.path.substring(lastSlash + 1);
                    try { await approveLessonCore(f.path, fn, tag); ok++; }
                    catch(e){ fail++; console.warn('Duyet loi:', f.path, e); }
                }
                alert('Xong! Đã duyệt ' + ok + ' bài' + (fail ? ', lỗi ' + fail + ' bài.' : '.'));
                renderLessonManagementList();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }
        
        // ===== THONG KE CAU HOI THEO THU MUC (them 2026-10-08) =====
        var __mqStatsCache = null;
        async function toggleManageQuestionStats(){
            var wrap = document.getElementById('manage-qstats-wrap');
            if(!wrap) return;
            if(wrap.innerHTML.trim()){ wrap.innerHTML=''; return; }
            wrap.innerHTML = '<span class="text-xs text-slate-500 italic ml-1">Đang tính...</span>';
            try { await renderManageQuestionStats(wrap); }
            catch(e){ wrap.innerHTML = '<span class="text-xs text-red-600 ml-1">Lỗi: ' + String(e && e.message || e).replace(/</g,'&lt;') + '</span>'; }
        }
        function qTypeOf(q){
            var ty = (q.type || q.qtype || q.kind || '').toString().toLowerCase();
            if(ty.indexOf('true') === 0 || ty === 'ds' || ty.indexOf('dung') === 0) return 'tf';
            if(ty.indexOf('short') === 0 || ty === 'tln' || ty.indexOf('tra loi ngan') === 0) return 'short';
            if(ty.indexOf('essay') === 0 || ty === 'tuluan' || ty.indexOf('tu luan') === 0) return 'essay';
            return 'mcq';
        }
        function qLevelOf(q){
            var lv = (q.level || q.difficulty || q.mucdo || '').toString().toUpperCase();
            if(lv.indexOf('NB') === 0 || lv === '1' || lv.indexOf('NHAN BIET') === 0) return 'NB';
            if(lv.indexOf('TH') === 0 || lv === '2' || lv.indexOf('THONG HIEU') === 0) return 'TH';
            if(lv.indexOf('VDC') === 0 || lv === '4') return 'VDC';
            if(lv.indexOf('VD') === 0 || lv === '3' || lv.indexOf('VAN DUNG') === 0) return 'VD';
            return '?';
        }
        async function renderManageQuestionStats(wrap){
            if(__mqStatsCache && (Date.now() - __mqStatsCache.t < 60000)){ drawManageQuestionStats(wrap, __mqStatsCache.data); return; }
            var folder = getManageFolder();
            var registry = (window.__hubRegistry && window.__hubRegistry.files) ? window.__hubRegistry.files : [];
            var examFiles = registry.filter(function(f){
                var fn = f.path.substring(f.path.lastIndexOf('/') + 1);
                if(fileKindOf(fn) !== 'exam') return false;
                if(folder && !(f.path === folder || f.path.indexOf(folder + '/') === 0)) return false;
                return true;
            });
            var perFile = [], tot = {sets:0, mcq:0, tf:0, short:0, essay:0, NB:0, TH:0, VD:0, VDC:0};
            for(var fi = 0; fi < examFiles.length; fi++){
                var f = examFiles[fi];
                var info = {path:f.path, name:f.path.substring(f.path.lastIndexOf('/')+1), sets:0, mcq:0, tf:0, short:0, essay:0, NB:0, TH:0, VD:0, VDC:0, dynamic:false, err:''};
                try {
                    var txt = await (await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/' + f.path, {cache:'no-store'})).text();
                    var m = txt.match(/const\s+EXAM_SETS\s*=\s*(\[[\s\S]*?\])\s*;/);
                    var sets = [];
                    if(m){ try { sets = JSON.parse(m[1]); } catch(e0){} }
                    else {
                        var m2 = txt.match(/const\s+EXAM_DATA\s*=\s*(\{[\s\S]*?\})\s*;/);
                        if(m2){ try { var dd = JSON.parse(m2[1]); sets = dd.sets || dd.examSets || []; } catch(e1){} }
                    }
                    if(sets.length){
                        info.sets = sets.length; tot.sets += sets.length;
                        sets.forEach(function(s){
                            (s.questions || []).forEach(function(q){
                                var qy = qTypeOf(q), ql = qLevelOf(q);
                                info[qy]++; tot[qy]++;
                                if(info[ql] !== undefined){ info[ql]++; tot[ql]++; }
                            });
                        });
                    } else { info.dynamic = true; }
                } catch(e2){ info.err = String(e2 && e2.message || e2); }
                perFile.push(info);
            }
            var data = {folder: folder || '(Tất cả)', files: examFiles.length, perFile: perFile, tot: tot};
            __mqStatsCache = {t: Date.now(), data: data};
            drawManageQuestionStats(wrap, data);
        }
        function drawManageQuestionStats(wrap, data){
            function esc(s){ return String(s == null ? '' : s).replace(/</g,'&lt;'); }
            var tt = data.tot;
            var totalQ = tt.mcq + tt.tf + tt.short + tt.essay;
            var rows = data.perFile.map(function(f){
                var q = f.mcq + f.tf + f.short + f.essay;
                var note = f.dynamic ? '<span class="text-[10px] text-purple-600 italic">đề động từ ngân hàng</span>'
                         : f.err ? '<span class="text-[10px] text-red-600">lỗi đọc</span>'
                         : (f.sets + ' đề');
                return '<tr class="border-t border-slate-100">'
                    + '<td class="py-1 pr-2 text-slate-700 max-w-[220px] truncate" title="' + esc(f.path) + '">' + esc(f.name) + '</td>'
                    + '<td class="py-1 pr-2 text-slate-500">' + note + '</td>'
                    + '<td class="py-1 text-center font-bold text-slate-800">' + q + '</td>'
                    + '<td class="py-1 text-center text-slate-600">' + f.mcq + '</td>'
                    + '<td class="py-1 text-center text-slate-600">' + f.tf + '</td>'
                    + '<td class="py-1 text-center text-slate-600">' + f.short + '</td>'
                    + '<td class="py-1 text-center text-slate-600">' + f.NB + '/' + f.TH + '/' + f.VD + '/' + f.VDC + '</td></tr>';
            }).join('');
            wrap.innerHTML =
                '<div class="w-full mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">'
                + '<div class="flex items-center justify-between flex-wrap gap-2 mb-2">'
                + '<div class="font-bold text-amber-900">📊 Thống kê câu hỏi — thư mục: ' + esc(manageFolderLabel()) + '</div>'
                + '<button onclick="__mqStatsCache=null;toggleManageQuestionStats();setTimeout(toggleManageQuestionStats,50);" class="px-2 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-bold hover:bg-amber-100">↻ Làm mới</button>'
                + '</div>'
                + '<div class="flex flex-wrap gap-2 mb-2">'
                + '<span class="px-2 py-1 rounded-lg bg-white border border-slate-200">📁 ' + data.files + ' file đề</span>'
                + '<span class="px-2 py-1 rounded-lg bg-white border border-slate-200">📝 ' + tt.sets + ' bộ đề</span>'
                + '<span class="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold">Σ ' + totalQ + ' câu hỏi</span>'
                + '<span class="px-2 py-1 rounded-lg bg-white border border-slate-200">TN: ' + tt.mcq + '</span>'
                + '<span class="px-2 py-1 rounded-lg bg-white border border-slate-200">Đ/S: ' + tt.tf + '</span>'
                + '<span class="px-2 py-1 rounded-lg bg-white border border-slate-200">TLN: ' + tt.short + '</span>'
                + '<span class="px-2 py-1 rounded-lg bg-white border border-slate-200">NB/TH/VD/VDC: ' + tt.NB + '/' + tt.TH + '/' + tt.VD + '/' + tt.VDC + '</span>'
                + '</div>'
                + (data.perFile.length
                    ? '<div class="overflow-x-auto"><table class="w-full text-[11px]"><thead><tr class="text-left text-slate-500">'
                      + '<th class="py-1 pr-2 font-semibold">File</th><th class="py-1 pr-2 font-semibold">Ghi chú</th>'
                      + '<th class="py-1 text-center font-semibold">Tổng câu</th><th class="py-1 text-center font-semibold">TN</th>'
                      + '<th class="py-1 text-center font-semibold">Đ/S</th><th class="py-1 text-center font-semibold">TLN</th>'
                      + '<th class="py-1 text-center font-semibold">NB/TH/VD/VDC</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
                    : '<div class="italic text-slate-500">Thư mục này chưa có file đề thi/bài tập nào.</div>')
                + '</div>';
        }
        // ===== HET THONG KE CAU HOI =====

        async function renderLessonManagementList() {
            let container = document.getElementById('manage-lessons-table-container');
            if (!container) return;
            container.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang nạp danh sách bài từ Git...</div>';

            let curFolder = getManageFolder();
            try {
                let gitApiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/git/trees/${GITHUB_CONFIG.branch}?recursive=1`;
                let headers = { "Accept": "application/vnd.github+json" };
                let tk = (typeof getGithubToken === 'function') ? getGithubToken() : null;
                if (tk) headers["Authorization"] = "Bearer " + tk;
                let res = await fetch(gitApiUrl, { headers: headers });
                if (res.status === 403 || res.status === 429){
                    container.innerHTML = `<div class="text-xs text-amber-700 py-4 text-center bg-amber-50 border border-amber-200 rounded-xl">GitHub đang giới hạn lượt xem (rate limit). Hãy đăng nhập GitHub / đợi vài phút rồi bấm <b>Làm mới danh sách</b>.</div>`;
                    return;
                }
                let files = [];
                if (res.ok) {
                    let data = await res.json();
                    if (data && Array.isArray(data.tree)) {
                        files = data.tree.filter(item => {
                            if (item.type !== 'blob' || !item.path.endsWith('.html')) return false;
                            if (item.path.startsWith('backup/') || item.path.startsWith('teacher/') || item.path.startsWith('used/')) return false;
                            let lastSlash = item.path.lastIndexOf('/');
                            let folder = lastSlash === -1 ? '' : item.path.substring(0, lastSlash);
                            if (folder === 'data/bank' || folder.startsWith('data/bank/')) return false;
                            return !curFolder || folder === curFolder;
                        });
                    }
                }

                // Registry quyen so huu de thi (khong chan neu loi)
                let reg = {};
                try { reg = await getExamRegistry(); } catch(eReg){}

                if (files.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <i class="fa-regular fa-folder-open text-3xl text-slate-400"></i>
                            <p class="text-xs font-bold text-slate-600">Chưa có bài học nào trên Git${curFolder ? ' trong thư mục [' + curFolder + ']' : ''}.</p>
                            <button onclick="switchTeacherModule('compose')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow mt-2">
                                + Soạn bài mới ngay
                            </button>
                        </div>
                    `;
                    return;
                }

                // Loc theo loai: ly thuyet / de thi
                let shown = files.filter(function(f){
                    if (manageTypeFilter === 'all') return true;
                    let fn = f.path.substring(f.path.lastIndexOf('/') + 1);
                    return fileKindOf(fn) === manageTypeFilter;
                });
                let nTheory = files.filter(function(f){ return fileKindOf(f.path.substring(f.path.lastIndexOf('/') + 1)) === 'theory'; }).length;
                let nExam = files.length - nTheory;
                let folders = {};
                files.forEach(function(f){
                    let ls = f.path.lastIndexOf('/');
                    let fd = ls === -1 ? '(gốc)' : f.path.substring(0, ls);
                    folders[fd] = (folders[fd] || 0) + 1;
                });
                let fkeys = Object.keys(folders).sort();
                let html = '<div class="flex flex-wrap items-center gap-2 mb-2">'
                    + '<span class="text-[11px] font-bold text-slate-500">Thư mục:</span>'
                    + '<span title="' + getManageFolder().replace(/"/g,'&quot;') + '" class="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 max-w-[220px] truncate">📁 ' + manageFolderLabel().replace(/</g,'&lt;') + '</span>'
                    + '<span class="text-[11px] font-bold text-slate-500 ml-1">Loại:</span>'
                    + '<button id="mfilter-all" onclick="setManageTypeFilter(\'all\')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (manageTypeFilter === 'all' ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">Tất cả (' + files.length + ')</button>'
                    + '<button id="mfilter-theory" onclick="setManageTypeFilter(\'theory\')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (manageTypeFilter === 'theory' ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">📘 Lý thuyết (' + nTheory + ')</button>'
                    + '<button id="mfilter-exam" onclick="setManageTypeFilter(\'exam\')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (manageTypeFilter === 'exam' ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">📝 Đề thi/Bài tập (' + nExam + ')</button>'
 + '<button id="mfilter-qstats" onclick="toggleManageQuestionStats()"'
 + ' class="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300">📊 Thống kê câu hỏi</button>'
 + '<span id="manage-qstats-wrap"></span>'
                    + '<button onclick="approveAllInFolder()" class="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-600 hover:bg-emerald-700 text-white shadow ml-auto" title="Duyệt tất cả bài chưa duyệt trong thư mục đang lọc"><i class="fa-solid fa-check-double mr-1"></i>Duyệt tất cả</button>'
                    + '</div>';
                if (!shown.length){
                    html += '<div class="text-center py-8 text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-xl">Không có bài nào thuộc loại này trong thư mục hiện tại.</div>';
                }
                html += '<div class="space-y-2">';
                shown.forEach(f => {
                    let lastSlash = f.path.lastIndexOf('/');
                    let fileName = lastSlash === -1 ? f.path : f.path.substring(lastSlash + 1);
                    let title = fileName.replace(/\.html$/i, '');
                    let isExam = fileKindOf(fileName) === 'exam';

                    let isApproved = fileApproved(fileName);
                    html += `
                        <div class="${isApproved ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'} border hover:border-blue-400 p-3 rounded-xl flex items-center justify-between shadow-sm transition">
                            <div class="flex items-center space-x-3 truncate pr-3">
                                <div class="w-8 h-8 rounded-lg ${isExam ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center font-bold text-xs shrink-0">
                                    <i class="fa-solid ${isExam ? 'fa-file-pen' : 'fa-book-open'}"></i>
                                </div>
                                <div class="truncate">
                                    <h4 class="font-bold text-xs text-slate-800 truncate">${title}
                                        ${isApproved
                                            ? '<span class="ml-1 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold align-middle"><i class="fa-solid fa-check mr-0.5"></i>Đã duyệt' + (fileVerifier(fileName) ? ' · ' + fileVerifier(fileName).replace(/</g,'&lt;') : '') + '</span>'
                                            : `<button onclick="approveLesson('${f.path}', '${fileName.replace(/'/g, "\\'")}')" class="ml-1 text-[9px] bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold align-middle shadow" title="Duyệt bài này"><i class="fa-solid fa-check mr-0.5"></i>Duyệt</button>`}
                                    </h4>
                                    <p class="text-[10px] text-slate-400 truncate"><i class="fa-regular fa-folder mr-1"></i>${f.path}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 shrink-0">
                                <a href="../${encodeURI(f.path)}" target="_blank" class="text-xs text-slate-600 hover:text-blue-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold" title="Xem trước">
                                    <i class="fa-solid fa-eye"></i>
                                </a>
                                ${(() => {
                                    let own = (typeof examOwnerOf === 'function') ? examOwnerOf(f.path, reg) : null;
                                    let can = (typeof canManageExam === 'function') ? canManageExam(f.path, reg) : true;
                                    let ownerTag = own && own.owner_name
                                        ? `<span class="text-[10px] text-slate-400" title="Chủ sở hữu"><i class="fa-solid fa-user-check mr-0.5"></i>${own.owner_name.replace(/</g, '&lt;')}</span>`
                                        : '';
                                    let editFn = isExam ? 'openExamReviewer' : 'loadLessonIntoEditor';
                                    let editLabel = isExam ? 'Duyệt đề' : 'Sửa bài';
                                    let editBtn = can
                                        ? `<button onclick="${editFn}('${f.path}', '${title.replace(/'/g, "\\'")}')" class="text-xs text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 font-bold border border-blue-200 flex items-center"><i class="fa-solid ${isExam ? 'fa-list-check' : 'fa-pen-to-square'} mr-1"></i> ${editLabel}</button>`
                                        : `<span class="text-[10px] text-slate-300 font-bold px-1" title="Đề của giáo viên khác"><i class="fa-solid fa-lock mr-0.5"></i>${editLabel}</span>`;
                                    let delBtn = can
                                        ? `<button onclick="deleteLessonFromManager('${f.path}', '${title.replace(/'/g, "\\'")}')" class="text-xs text-rose-600 hover:text-rose-800 px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 font-bold border border-rose-200" title="Xóa bài"><i class="fa-solid fa-trash-can"></i></button>`
                                        : `<span class="text-[10px] text-slate-300 font-bold px-1" title="Đề của giáo viên khác"><i class="fa-solid fa-lock"></i></span>`;
                                    return ownerTag + editBtn + delBtn;
                                })()}
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            } catch(e) {
                container.innerHTML = `<div class="text-xs text-rose-500 py-4 text-center">Lỗi tải danh sách: ${e.message}</div>`;
            }
        }


        // ============ TRINH DUYET DE THEO TUNG BO (2026-10-08) ============
        let ermData = { filePath: '', fileName: '', sets: [], idx: 0, rawHtml: '', sha: '' };
        let ermEditMode = false;
        function toggleErmEdit(){
            if (ermEditMode) ermSaveEdits(); // luu tam truoc khi thoat edit
            ermEditMode = !ermEditMode;
            renderExamReviewSet();
        }
        function ermSaveEdits(){
            if (!ermData.sets.length) return;
            let st = ermData.sets[ermData.idx];
            let qs = st.questions || [];
            qs.forEach(function(qq, qi){
                let qEl = document.getElementById('erm-q-' + qi);
                if (qEl) qq.q = qEl.value;
                (qq.options || []).forEach(function(op, oi){
                    let oEl = document.getElementById('erm-q-' + qi + '-opt-' + oi);
                    if (oEl) qq.options[oi] = oEl.value;
                });
                (qq.statements || []).forEach(function(sm, mi){
                    let sEl = document.getElementById('erm-q-' + qi + '-stmt-' + mi);
                    if (sEl){
                        if (typeof sm === 'object') sm.text = sEl.value;
                        else qq.statements[mi] = sEl.value;
                    }
                });
                let aEl = document.getElementById('erm-q-' + qi + '-ans');
                if (aEl) qq.answer = aEl.value;
                let eEl = document.getElementById('erm-q-' + qi + '-exp');
                if (eEl) qq.explain = eEl.value;
            });
            let nEl = document.getElementById('erm-set-name');
            if (nEl) st.name = nEl.value;
        }

        async function openExamReviewer(filePath, fileName){
            try {
                if (typeof canManageExam === 'function' && !canManageExam(filePath)){
                    alert('Bạn không có quyền sửa đề này (đề của giáo viên khác).');
                    return;
                }
            } catch(ePerm){}
            let modal = document.getElementById('exam-review-modal');
            let body = document.getElementById('erm-body');
            if (!modal || !body) return;
            body.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-8"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải đề...</p>';
            modal.classList.remove('hidden');
            try {
                let res = await fetch(`../${encodeURI(filePath)}`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                let html = await res.text();
                let sets = [];
                let re = /<script[^>]*class=["']saobay-exam10-data["'][^>]*>\s*(\{[\s\S]*?\})\s*<\/script>/gi;
                let m;
                while ((m = re.exec(html)) !== null){
                    try {
                        let obj = JSON.parse(m[1]);
                        (obj.sets || []).forEach(function(st){ sets.push(st); });
                    } catch(e){}
                }
                if (!sets.length) throw new Error('Không tìm thấy dữ liệu các bộ đề trong file.');
                ermData = { filePath: filePath, fileName: fileName, sets: sets, idx: 0, rawHtml: html, sha: '' };
                document.getElementById('erm-title').textContent = 'Duyệt: ' + fileName.replace(/\.html$/i, '');
                renderExamReviewSet();
            } catch(e){
                body.innerHTML = '<p class="text-xs text-rose-600 text-center py-8">Lỗi tải đề: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>';
            }
        }
        function closeExamReviewer(){
            let modal = document.getElementById('exam-review-modal');
            if (modal) modal.classList.add('hidden');
            ermData = { filePath: '', fileName: '', sets: [], idx: 0, rawHtml: '', sha: '' };
        }
        function examReviewNav(dir){
            if (!ermData.sets.length) return;
            ermData.idx = (ermData.idx + dir + ermData.sets.length) % ermData.sets.length;
            renderExamReviewSet();
        }
        function examReviewGo(i){
            if (!ermData.sets.length) return;
            ermData.idx = Math.max(0, Math.min(ermData.sets.length - 1, i));
            renderExamReviewSet();
        }
        function ermApprovedCount(){
            return ermData.sets.filter(function(st){ return !!st.approved; }).length;
        }
        function renderExamReviewSet(){
            let body = document.getElementById('erm-body');
            if (!body || !ermData.sets.length) return;
            let st = ermData.sets[ermData.idx];
            let total = ermData.sets.length;
            let done = ermApprovedCount();
            document.getElementById('erm-progress').textContent = 'Đề ' + (ermData.idx + 1) + '/' + total + ' · Đã duyệt ' + done + '/' + total;
            let dots = document.getElementById('erm-dots');
            dots.innerHTML = ermData.sets.map(function(s2, i){
                let c = s2.approved ? 'bg-emerald-500 text-white' : (i === ermData.idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300');
                return '<button onclick="examReviewGo(' + i + ')" class="w-7 h-7 rounded-full text-[10px] font-bold ' + c + '" title="Đề ' + (i+1) + (s2.approved ? ' (đã duyệt)' : '') + '">' + (i+1) + '</button>';
            }).join('');
            let qs = st.questions || [];
            let esc = function(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
            let qhtml = '';
            if (ermEditMode){
                qhtml = '<div class="bg-blue-50 border border-blue-200 rounded-xl p-3"><label class="text-[11px] font-bold text-slate-600">Tên đề:</label>'
                    + '<input id="erm-set-name" value="' + esc(st.name || ('Đề ' + (ermData.idx+1))) + '" class="mt-1 w-full text-xs border rounded-lg px-2 py-1.5 font-bold"></div>';
            } else {
                qhtml = '<h4 class="font-bold text-sm text-slate-800">' + esc(st.name || ('Đề ' + (ermData.idx+1))) + '</h4>';
            }
            qhtml += qs.map(function(qq, qi){
                let t = (qq.type === 'truefalse') ? 'Đúng/Sai' : (qq.type === 'short' ? 'Trả lời ngắn' : (qq.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'));
                if (ermEditMode){
                    let oEdits = (qq.options || []).map(function(op, oi){
                        return '<div class="flex items-center gap-1 mt-1"><span class="text-[11px] font-bold text-slate-500 w-4">' + 'ABCD'[oi] + '.</span>'
                            + '<input id="erm-q-' + qi + '-opt-' + oi + '" value="' + esc(op) + '" class="flex-1 text-xs border rounded px-2 py-1"></div>';
                    }).join('');
                    let sEdits = (qq.statements || []).map(function(sm, mi){
                        let txt = (typeof sm === 'object') ? (sm.text || '') : sm;
                        return '<div class="flex items-center gap-1 mt-1"><span class="text-[11px] font-bold text-slate-500 w-4">' + String.fromCharCode(97+mi) + ')</span>'
                            + '<input id="erm-q-' + qi + '-stmt-' + mi + '" value="' + esc(txt) + '" class="flex-1 text-xs border rounded px-2 py-1"></div>';
                    }).join('');
                    return '<div class="bg-white border-2 border-blue-300 rounded-xl p-3">'
                        + '<div class="flex items-center gap-2 mb-2"><span class="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Câu ' + (qi+1) + '</span>'
                        + '<span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">' + t + '</span></div>'
                        + '<label class="text-[11px] font-bold text-slate-600">Đề bài:</label>'
                        + '<textarea id="erm-q-' + qi + '" rows="2" class="mt-1 w-full text-xs border rounded-lg px-2 py-1.5">' + esc(qq.q) + '</textarea>'
                        + oEdits + sEdits
                        + '<div class="flex gap-2 mt-2"><div class="flex-1"><label class="text-[11px] font-bold text-slate-600">Đáp án:</label>'
                        + '<input id="erm-q-' + qi + '-ans" value="' + esc(qq.answer) + '" class="mt-1 w-full text-xs border rounded px-2 py-1"></div></div>'
                        + '<label class="text-[11px] font-bold text-slate-600 mt-2 block">Giải thích:</label>'
                        + '<textarea id="erm-q-' + qi + '-exp" rows="2" class="mt-1 w-full text-xs border rounded-lg px-2 py-1.5">' + esc(qq.explain) + '</textarea>'
                        + '</div>';
                }
                let qtxt = esc(qq.q);
                let opts = '';
                if (qq.options && qq.options.length){
                    opts = '<div class="mt-1 space-y-0.5">' + qq.options.map(function(op, oi){
                        let isAns = String(qq.answer) === String('ABCD'[oi]) || String(qq.answer) === String(op);
                        return '<div class="text-[11px] ' + (isAns ? 'text-emerald-700 font-bold' : 'text-slate-600') + '">' + 'ABCD'[oi] + '. ' + esc(op) + (isAns ? ' ✓' : '') + '</div>';
                    }).join('') + '</div>';
                }
                let stmts = '';
                if (qq.statements && qq.statements.length){
                    stmts = '<div class="mt-1 space-y-0.5">' + qq.statements.map(function(sm, mi){
                        let txt = (typeof sm === 'object') ? (sm.text || '') : sm;
                        let ans = (typeof sm === 'object') ? !!sm.answer : false;
                        return '<div class="text-[11px] text-slate-600">' + String.fromCharCode(97+mi) + ') ' + esc(txt) + ' <b class="' + (ans ? 'text-emerald-700' : 'text-rose-600') + '">(' + (ans ? 'Đúng' : 'Sai') + ')</b></div>';
                    }).join('') + '</div>';
                }
                return '<div class="bg-slate-50 border border-slate-200 rounded-xl p-3">'
                    + '<div class="flex items-center gap-2 mb-1"><span class="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Câu ' + (qi+1) + '</span>'
                    + '<span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">' + t + '</span>'
                    + (qq.level ? '<span class="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">' + esc(qq.level) + '</span>' : '')
                    + '</div>'
                    + '<div class="text-xs text-slate-800 font-medium">' + qtxt + '</div>' + opts + stmts
                    + (qq.answer && !opts && !stmts ? '<div class="text-[11px] text-emerald-700 font-bold mt-1">Đáp án: ' + esc(qq.answer) + '</div>' : '')
                    + (qq.explain ? '<div class="text-[11px] text-slate-500 italic mt-1">Giải thích: ' + esc(qq.explain) + '</div>' : '')
                    + '</div>';
            }).join('');
            body.innerHTML = qhtml || '<p class="text-xs text-slate-400">Đề này chưa có câu hỏi.</p>';
            if (!ermEditMode) body.scrollTop = 0;
            let statusEl = document.getElementById('erm-set-status');
            let btn = document.getElementById('erm-approve-btn');
            let editBtn = document.getElementById('erm-edit-btn');
            let saveBtn = document.getElementById('erm-save-btn');
            if (editBtn) document.getElementById('erm-edit-label').textContent = ermEditMode ? 'Hủy sửa' : 'Sửa text';
            if (saveBtn) saveBtn.classList.toggle('hidden', !ermEditMode);
            if (btn) btn.classList.toggle('hidden', ermEditMode);
            if (st.approved){
                statusEl.innerHTML = '<span class="text-emerald-700"><i class="fa-solid fa-circle-check mr-1"></i>Đề này đã được duyệt' + (st.approvedBy ? ' bởi ' + esc(st.approvedBy) : '') + '</span>';
                if (btn){ btn.className = 'px-5 py-2 rounded-xl bg-slate-300 text-slate-500 text-sm font-bold shadow cursor-not-allowed'; btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Đã duyệt'; btn.disabled = true; }
            } else {
                statusEl.innerHTML = '<span class="text-amber-700"><i class="fa-solid fa-circle-exclamation mr-1"></i>Đề này chưa duyệt</span>';
                if (btn){ btn.className = 'px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow'; btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Duyệt đề này'; btn.disabled = false; }
            }
            let pv = document.getElementById('erm-prev'), nx = document.getElementById('erm-next');
            if (pv) pv.disabled = (total <= 1);
            if (nx) nx.disabled = (total <= 1);
        }
        async function saveErmEdits(){
            ermSaveEdits();
            ermEditMode = false;
            try {
                await ermSaveFile();
                alert('Đã lưu các sửa đổi vào file đề!');
            } catch(e){
                alert('Lỗi lưu: ' + (e.message || e));
            }
            renderExamReviewSet();
        }
        async function approveExamReviewSet(){
            if (!ermData.sets.length) return;
            let st = ermData.sets[ermData.idx];
            if (st.approved) return;
            let uname = '';
            try { uname = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : ''; } catch(e){}
            let by = uname || 'GV';
            if (!confirm('Duyệt "' + (st.name || ('Đề ' + (ermData.idx+1))) + '"?')) return;
            st.approved = true;
            st.approvedBy = by;
            st.approvedAt = new Date().toISOString().slice(0, 10);
            try {
                await ermSaveFile();
                let done = ermApprovedCount(), total = ermData.sets.length;
                if (done >= total){
                    // Duyet het -> doi ten file thanh da duyet
                    await ermRenameApproved(by);
                    alert('Đã duyệt hết ' + total + ' đề! Bài "' + ermData.fileName.replace(/\.html$/i,'') + '" giờ được coi là ĐÃ DUYỆT.');
                    closeExamReviewer();
                    renderLessonManagementList();
                } else {
                    renderExamReviewSet();
                }
            } catch(e){
                // rollback
                delete st.approved; delete st.approvedBy; delete st.approvedAt;
                alert('Lỗi lưu duyệt: ' + (e.message || e));
            }
        }
        async function ermSaveFile(){
            // Ghi approved vao tung set trong JSON roi day lai file
            let html = ermData.rawHtml;
            let idxSet = 0;
            let newHtml = html.replace(/<script[^>]*class=["']saobay-exam10-data["'][^>]*>\s*(\{[\s\S]*?\})\s*<\/script>/gi, function(m0, jsonStr){
                let obj;
                try { obj = JSON.parse(jsonStr); } catch(e){ return m0; }
                (obj.sets || []).forEach(function(s2){
                    // map theo thu tu
                    let src = ermData.sets[idxSet++];
                    if (src){ s2.approved = !!src.approved; if (src.approvedBy) s2.approvedBy = src.approvedBy; if (src.approvedAt) s2.approvedAt = src.approvedAt; }
                });
                let open = m0.substring(0, m0.indexOf(jsonStr));
                return open + JSON.stringify(obj) + '</scr' + 'ipt>';
            });
            ermData.rawHtml = newHtml;
            // Day len GitHub
            let token = (typeof getGithubToken === 'function') ? getGithubToken() : null;
            let filePath = ermData.filePath;
            if (token){
                let url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(filePath);
                let gr = await fetch(url + '?ref=' + GITHUB_CONFIG.branch, { headers: { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token } });
                if (!gr.ok) throw new Error('Không đọc được file (HTTP ' + gr.status + ')');
                let gj = await gr.json();
                let b64 = btoa(unescape(encodeURIComponent(newHtml)));
                let pr = await fetch(url, { method: 'PUT', headers: { 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ message: 'Duyệt đề ' + (ermData.idx+1) + ': ' + ermData.fileName, content: b64, sha: gj.sha, branch: GITHUB_CONFIG.branch }) });
                if (!pr.ok) throw new Error('Đẩy file thất bại (HTTP ' + pr.status + ')');
            } else {
                let rx = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: filePath, content: newHtml, commitMessage: 'Duyệt đề ' + (ermData.idx+1) + ': ' + ermData.fileName }) });
                let rj = await rx.json().catch(function(){ return {}; });
                if (rj.status !== 'success') throw new Error(rj.message || 'Đẩy file thất bại');
            }
        }
        async function ermRenameApproved(by){
            // Doi ten file: _none -> _gvTen (danh dau da duyet het)
            let filePath = ermData.filePath;
            let slash = filePath.lastIndexOf('/');
            let fileName = slash === -1 ? filePath : filePath.substring(slash + 1);
            let tag = 'gv' + String(by || 'GV').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 18);
            if (!tag || tag === 'gv') tag = 'gvGV';
            let newFileName = fileName.replace(/_none/i, '_' + tag);
            if (newFileName === fileName) newFileName = fileName.replace(/\.html$/i, '_' + tag + '.html');
            let newPath = (slash === -1 ? '' : filePath.substring(0, slash + 1)) + newFileName;
            if (newPath === filePath) return;
            let token = (typeof getGithubToken === 'function') ? getGithubToken() : null;
            let contentB64 = btoa(unescape(encodeURIComponent(ermData.rawHtml)));
            if (token){
                let newUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(newPath);
                let hdrs = { 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
                let pr = await fetch(newUrl, { method: 'PUT', headers: hdrs,
                    body: JSON.stringify({ message: 'Duyệt hết - đổi tên: ' + fileName, content: contentB64, branch: GITHUB_CONFIG.branch }) });
                if (!pr.ok) throw new Error('Không tạo được file đã duyệt');
                let oldUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(filePath);
                let gr = await fetch(oldUrl + '?ref=' + GITHUB_CONFIG.branch, { headers: { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token } });
                let gj = await gr.json().catch(function(){ return {}; });
                if (gj.sha) await fetch(oldUrl, { method: 'DELETE', headers: hdrs, body: JSON.stringify({ message: 'Xóa bản chưa duyệt: ' + fileName, sha: gj.sha, branch: GITHUB_CONFIG.branch }) });
            } else {
                let rx = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: newPath, content: ermData.rawHtml, commitMessage: 'Duyệt hết - đổi tên: ' + fileName }) });
                let rj = await rx.json().catch(function(){ return {}; });
                if (rj.status !== 'success') throw new Error('Không tạo được file đã duyệt');
                await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ type: 'DELETE_FROM_GITHUB', filePath: filePath, commitMessage: 'Xóa bản chưa duyệt: ' + fileName }) });
            }
        }

        async function loadLessonIntoEditor(filePath, title) {
            try {
                if (typeof canManageExam === 'function' && !canManageExam(filePath)){
                    alert('Bạn không có quyền sửa đề này (đề của giáo viên khác). Chỉ chủ đề và admin được sửa.');
                    return;
                }
            } catch(ePerm){}
            try {
                let res = await fetch(`../${encodeURI(filePath)}`);
                if (res.ok) {
                    let content = await res.text();
                    document.getElementById('item-title').value = title;
                    document.getElementById('item-content').value = cleanAndDecodeHtml(content);
                    document.getElementById('edit-mode-flag').value = 'EDIT';
                    document.getElementById('editing-item-id').value = filePath;
                    document.getElementById('cancel-edit-btn').classList.remove('hidden');
                    
                    renderMathPreview();
                    // Tự chuyển sang đúng tab đẩy theo loại file đang sửa
                    if (/bai_tap|baitap|kiem_tra|kiemtra|de_thi|exam|test/i.test(filePath)) switchPushMode('direct');
                    else switchPushMode('theory');
                    updateScorePreview();
                    switchTeacherModule('compose');
                    alert(`Đã nạp nội dung bài "${title}" vào trình soạn thảo!`);
                }
            } catch(e) {
                alert("Lỗi tải nội dung bài: " + e.message);
            }
        }

        async function deleteLessonFromManager(filePath, title) {
            try {
                if (typeof canManageExam === 'function' && !canManageExam(filePath)){
                    alert('Bạn không có quyền xoá đề này (đề của giáo viên khác). Chỉ chủ đề và admin được xoá.');
                    return;
                }
            } catch(e){}
            if (!confirm(`Bạn có chắc muốn xóa bài "${title}" (${filePath}) trên GitHub?`)) return;
            try {
                let res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        type: 'DELETE_FROM_GITHUB',
                        filePath: filePath,
                        commitMessage: `Xóa bài học: ${filePath} bởi ${currentUser.name}`
                    })
                });
                let result = await parseSafeResponse(res);
                if (result.status === 'success') {
                    alert(`Đã xóa bài "${title}" thành công!`);
                    renderLessonManagementList();
                } else {
                    alert(`Lỗi khi xóa bài: ${result.message || 'Không xác định'}`);
                }
            } catch(e) {
                alert("Lỗi kết nối xóa bài: " + e.message);
            }
        }

        function renderAuditList() {
            let container = document.getElementById('audit-lessons-container');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                    <div class="flex items-center justify-between border-b pb-2">
                        <span class="text-xs font-bold text-slate-800 uppercase">Quy chuẩn thẩm định học liệu THPT Sào Báy</span>
                        <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Phiên bản 2026</span>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Hệ thống tự động quét các bài học và đề thi mới được giáo viên đẩy lên. Các bài đã qua kiểm duyệt sẽ được gắn mã kiểm định (ví dụ: <code class="bg-slate-100 px-1 rounded text-blue-600 font-bold">_id102_gvMai</code>) và chuyển sang trạng thái <strong>Đã duyệt</strong> trên trang chủ của học sinh.
                    </p>
                    <div class="pt-2">
                        <button onclick="alert('Đã đồng bộ toàn bộ học liệu hợp lệ sang trạng thái Đã kiểm duyệt!')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition">
                            <i class="fa-solid fa-check-double mr-1.5"></i> Duyệt nhanh các bài học trong thư mục hiện tại
                        </button>
                    </div>
                </div>
            `;
            let pendingCount = document.getElementById('audit-pending-count');
            if (pendingCount) pendingCount.innerText = "1";
            let approvedCount = document.getElementById('audit-approved-count');
            if (approvedCount) approvedCount.innerText = "24";
        }

        function renderStatsOverview() {
            let container = document.getElementById('stats-overview-container');
            if (!container) return;
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow">
                        <div class="text-xs font-bold uppercase text-blue-200">Tổng điểm tích lũy</div>
                        <div class="text-3xl font-black mt-2">${currentUser.score || 0} điểm</div>
                        <div class="text-[10px] text-blue-200 mt-1">Đạt danh hiệu: Giáo viên Tích cực</div>
                    </div>
                    <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow">
                        <div class="text-xs font-bold uppercase text-emerald-200">Bài học đã xuất bản</div>
                        <div class="text-3xl font-black mt-2">25 bài</div>
                        <div class="text-[10px] text-emerald-200 mt-1">Gồm Lý thuyết & Đề thi trên Git</div>
                    </div>
                    <div class="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 rounded-2xl shadow">
                        <div class="text-xs font-bold uppercase text-amber-200">Tỷ lệ tương tác</div>
                        <div class="text-3xl font-black mt-2">100%</div>
                        <div class="text-[10px] text-amber-200 mt-1">Học sinh truy cập trực tiếp</div>
                    </div>
                </div>
            `;
        }

        function openAdminSettingsModal() {
            document.getElementById('cfg-score-knowledge').value = scoreConfig.knowledge;
            document.getElementById('cfg-score-exam-long').value = scoreConfig.examLong;
            document.getElementById('cfg-score-exam-short').value = scoreConfig.examShort;
            document.getElementById('cfg-github-token').value = localStorage.getItem('saobay_github_token') || GITHUB_CONFIG.token;
            document.getElementById('admin-settings-modal').classList.remove('hidden');
        }

        function closeAdminSettingsModal() {
            document.getElementById('admin-settings-modal').classList.add('hidden');
        }

        function saveAdminSettings() {
            scoreConfig.knowledge = parseInt(document.getElementById('cfg-score-knowledge').value) || 100;
            scoreConfig.examLong = parseInt(document.getElementById('cfg-score-exam-long').value) || 50;
            scoreConfig.examShort = parseInt(document.getElementById('cfg-score-exam-short').value) || 20;

            let tokenVal = document.getElementById('cfg-github-token').value.trim();
            if (tokenVal) {
                localStorage.setItem('saobay_github_token', tokenVal);
            }

            updateScorePreview();
            closeAdminSettingsModal();
            alert('Đã cập nhật quy tắc điểm số và cấu hình GitHub thành công!');
            loadFolderTreeFromGit(true);
        }
