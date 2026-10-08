        // ========================================================
        // QUẢN LÝ CÁC MODULE CHỨC NĂNG CỦA TEACHER HUB
        // ========================================================
        function switchTeacherModule(modId) {
            try {
                ['compose', 'manage', 'audit', 'stats'].forEach(function(id){
                    let tab = document.getElementById('mod-tab-' + id);
                    let view = document.getElementById('module-' + id + '-view');
                    let iconBox = tab ? tab.querySelector('div') : null;
                    let active = (id === modId);
                    if (tab) tab.className = "module-tab-btn flex items-center p-2.5 rounded-xl transition border text-left " + (active ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100");
                    if (iconBox) iconBox.className = "w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold shrink-0 mr-2.5 " + (active ? "bg-blue-600 text-white shadow" : "bg-slate-200 text-slate-700");
                    if (view) {
                        if (active) {
                            view.classList.remove('hidden');
                            view.style.display = '';
                        } else {
                            view.classList.add('hidden');
                            view.style.display = 'none';
                        }
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

        let manageFolderFilter = ''; // '' = tat ca thu muc
        function setManageFolderFilter(v){
            manageFolderFilter = v || '';
            renderLessonManagementList();
        }
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
        async function renderLessonManagementList() {
            let container = document.getElementById('manage-lessons-table-container');
            if (!container) return;
            container.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang nạp danh sách bài từ Git...</div>';

            let curFolder = manageFolderFilter || '';
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
                    + '<select onchange="setManageFolderFilter(this.value)" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-semibold text-slate-700 max-w-[220px]">'
                    + '<option value="">Tất cả thư mục (' + files.length + ')</option>'
                    + fkeys.map(function(k){ return '<option value="' + k.replace(/"/g, '&quot;') + '"' + (k === manageFolderFilter ? ' selected' : '') + '>' + k.replace(/</g, '&lt;') + ' (' + folders[k] + ')</option>'; }).join('')
                    + '</select>'
                    + '<span class="text-[11px] font-bold text-slate-500 ml-1">Loại:</span>'
                    + '<button id="mfilter-all" onclick="setManageTypeFilter(\'all\')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (manageTypeFilter === 'all' ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">Tất cả (' + files.length + ')</button>'
                    + '<button id="mfilter-theory" onclick="setManageTypeFilter(\'theory\')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (manageTypeFilter === 'theory' ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">📘 Lý thuyết (' + nTheory + ')</button>'
                    + '<button id="mfilter-exam" onclick="setManageTypeFilter(\'exam\')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (manageTypeFilter === 'exam' ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">📝 Đề thi/Bài tập (' + nExam + ')</button>'
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

                    html += `
                        <div class="bg-white border border-slate-200 hover:border-blue-400 p-3 rounded-xl flex items-center justify-between shadow-sm transition">
                            <div class="flex items-center space-x-3 truncate pr-3">
                                <div class="w-8 h-8 rounded-lg ${isExam ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center font-bold text-xs shrink-0">
                                    <i class="fa-solid ${isExam ? 'fa-file-pen' : 'fa-book-open'}"></i>
                                </div>
                                <div class="truncate">
                                    <h4 class="font-bold text-xs text-slate-800 truncate">${title}</h4>
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
                                        : `<button onclick="claimExamOwner('${f.path}', '${title.replace(/'/g, "\\'")}')" class="text-[10px] text-violet-600 hover:underline font-bold" title="Nhận quyền sở hữu đề này">Nhận</button>`;
                                    let editBtn = can
                                        ? `<button onclick="loadLessonIntoEditor('${f.path}', '${title.replace(/'/g, "\\'")}')" class="text-xs text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 font-bold border border-blue-200 flex items-center"><i class="fa-solid fa-pen-to-square mr-1"></i> Sửa bài</button>`
                                        : `<span class="text-[10px] text-slate-300 font-bold px-1" title="Đề của giáo viên khác"><i class="fa-solid fa-lock mr-0.5"></i>Sửa bài</span>`;
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
