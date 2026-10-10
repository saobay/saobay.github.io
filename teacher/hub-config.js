
        // CẤU HÌNH GITHUB ĐỒNG BỘ
        const GITHUB_CONFIG = {
            owner: "saobay",
            repo: "saobay.github.io",
            branch: "main",
            token: "" // Không để token ở đây. Token được bảo mật qua Google Apps Script Proxy hoặc lưu trong trình duyệt (Admin)
        };
        const API_URL = "https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec";

        let currentSelectedFolderId = ""; 
        let currentSelectedFolderName = "(chưa chọn)";

        const notifyChannel = new BroadcastChannel('saobay_notifications');
        
        let sessionUser = JSON.parse(localStorage.getItem('saobay_user')) || null;
        let currentUser = {
            id: sessionUser ? sessionUser.id : (localStorage.getItem('user_id') || 'GV_SABAY'),
            name: sessionUser ? sessionUser.name : (localStorage.getItem('user_name') || 'Giáo Viên Sào Báy'),
            role: sessionUser ? sessionUser.role : 'teacher',
            score: parseInt(localStorage.getItem('user_score')) || 0
        };

        let scoreConfig = { knowledge: 100, examLong: 50, examShort: 20, edit: 10, delete: -10 };
        let gitFolderMap = {};

        function getGithubToken() {
            return localStorage.getItem('saobay_github_token') || GITHUB_CONFIG.token;
        }

        function getEncodedGitHubPath(path) {
            return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
        }

        function utf8ToBase64(str) {
            const bytes = new TextEncoder().encode(str);
            const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
            return btoa(binString);
        }

        async function parseSafeResponse(response) {
            let text = await response.text();
            try { return JSON.parse(text); } 
            catch (e) { throw new Error("Phản hồi từ Server không hợp lệ."); }
        }

        function initTeacherHub() {
            if (currentUser.mustChangePassword) {
                alert("Tài khoản của bạn đang dùng mật khẩu mặc định 12345678. Bạn bắt buộc phải đổi mật khẩu mới để tiếp tục!");
                window.location.href = "../used/used.html?force=true";
                return;
            }

            document.getElementById('user-display-name').innerText = currentUser.name;
            document.getElementById('user-total-score').innerText = currentUser.score;
            // Hien badge Ban Giam Hieu thay cho "Thanh vien"
            if (currentUser.role === 'bgh') {
                let lvl = document.getElementById('user-level-tag');
                if (lvl) lvl.innerHTML = '<i class="fa-solid fa-building-columns mr-1"></i>Ban Giám Hiệu';
            }

            if (currentUser.role === 'admin') {
                document.getElementById('admin-settings-btn')?.classList.remove('hidden');
                document.getElementById('admin-accounts-btn')?.classList.remove('hidden');
                document.getElementById('admin-assign-btn')?.classList.remove('hidden');
                document.getElementById('admin-users-btn')?.classList.remove('hidden');
                document.getElementById('admin-uilabels-btn')?.classList.remove('hidden');
                if (typeof updateRegBadge === 'function') updateRegBadge();
            }
            // BGH khong xem lop hoc them
            if (currentUser.role === 'bgh') {
                document.getElementById('mod-tab-private')?.classList.add('hidden');
            }

            // Chọn mặc định thư mục data
            selectFolder('data', 'data (Thư viện bài giảng)');

            // Tải danh mục thư mục trực tiếp từ GitHub
            loadFolderTreeFromGit();

            switchPushMode('theory'); // mặc định mở tab đẩy lý thuyết
            renderMathPreview(); 
        }

        // HÀM TẢI DANH MỤC TRỰC TIẾP TỪ GITHUB API
        async function loadFolderTreeFromGit(forceRefresh = false, expectPath = null) {
            let container = document.getElementById('dynamic-folder-list');
            container.innerHTML = '<span class="text-slate-400 text-xs italic"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang nạp danh mục từ GitHub...</span>';

            let folders = [];
            let token = getGithubToken();
            let headers = { "Accept": "application/vnd.github+json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            let apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/git/trees/${GITHUB_CONFIG.branch}?recursive=1`;

            async function fetchTreeFolders(){
                try {
                    let res = await fetch(apiUrl, { headers });
                    if (!res.ok){ console.warn("GitHub Tree API phản hồi không thành công:", res.status); return null; }
                    let data = await res.json();
                    if (!data || !Array.isArray(data.tree)) return null;
                    let list = data.tree
                        .filter(item => {
                            if (item.type !== 'tree') return false;
                            let p = item.path;
                            // QUY TẮC BẢO MẬT: TUYỆT ĐỐI KHÔNG ĐỤNG ĐẾN THƯ MỤC BACKUP VÀ HỆ THỐNG
                            if (p === 'backup' || p.startsWith('backup/')) return false;
                            if (p === 'data/bank' || p.startsWith('data/bank/')) return false; // Bank tu dong trich, khong phai noi day bai
                            if (p === 'data/scores' || p.startsWith('data/scores/')) return false; // Diem thi, khong phai noi day bai
                            if (p === 'data/private' || p.startsWith('data/private/')) return false; // Lop hoc them rieng tu
                            if (p === 'data/reports' || p.startsWith('data/reports/')) return false; // Bao cao loi
                            if (p === 'teacher' || p.startsWith('teacher/')) return false;
                            if (p === 'used' || p.startsWith('used/')) return false;
                            if (p === 'tienganh6' || p.startsWith('tienganh6/')) return false;
                            if (p === '.git' || p.startsWith('.git/')) return false;
                            return true;
                        })
                        .map(item => ({
                            path: item.path,
                            sha: item.sha
                        }));
                    try { localStorage.setItem('saobay_git_folders', JSON.stringify(list)); } catch(e){}
                    return list;
                } catch (err) {
                    console.warn("Lỗi gọi GitHub API, thử đọc từ cache/folders.json:", err);
                    return null;
                }
            }

            folders = await fetchTreeFolders() || [];

            // FIX 2026-10-08: vừa tạo thư mục mới mà GitHub API chưa kịp cập nhật -> thử lại
            if (expectPath){
                let tries = 0;
                while (tries < 3 && !folders.some(f => f.path === expectPath)){
                    await new Promise(r => setTimeout(r, 2500));
                    let again = await fetchTreeFolders();
                    if (again && again.length) folders = again;
                    tries++;
                }
            }

            // Phương án dự phòng 1: Cache localStorage
            if (!folders || folders.length === 0) {
                let cached = localStorage.getItem('saobay_git_folders');
                if (cached) {
                    try { folders = JSON.parse(cached); } catch(e) {}
                }
            }

            // Phương án dự phòng 2: File folders.json tĩnh
            if (!folders || folders.length === 0) {
                try {
                    let resJson = await fetch("../folders.json?t=" + new Date().getTime());
                    if (resJson.ok) {
                        let rawJson = await resJson.json();
                        if (Array.isArray(rawJson)) {
                            folders = rawJson.map(f => ({
                                path: f.path || f.FolderID || f.FolderName || 'data',
                                sha: ''
                            }));
                        }
                    }
                } catch(e) {}
            }

            // Luôn đảm bảo có thư mục 'data'
            if (!folders || !folders.some(f => f.path === 'data')) {
                folders = folders || [];
                folders.unshift({ path: 'data', sha: '' });
            }

            renderFolderTreeUI(folders);
        }

        function renderFolderTreeUI(folders) {
            let container = document.getElementById('dynamic-folder-list');
            if (!Array.isArray(folders) || folders.length === 0) {
                container.innerHTML = '<span class="text-slate-400 text-xs italic">Chưa có thư mục con nào.</span>';
                return;
            }

            // Xây dựng cây phân cấp (tree hierarchy)
            let nodeMap = {};
            let roots = [];

            folders.forEach(f => {
                let p = f.path;
                let lastSlash = p.lastIndexOf('/');
                let name = lastSlash === -1 ? p : p.substring(lastSlash + 1);
                let parentPath = lastSlash === -1 ? '' : p.substring(0, lastSlash);

                nodeMap[p] = {
                    path: p,
                    name: name,
                    parentPath: parentPath,
                    children: []
                };
            });

            folders.forEach(f => {
                let node = nodeMap[f.path];
                if (node.parentPath && nodeMap[node.parentPath]) {
                    nodeMap[node.parentPath].children.push(node);
                } else {
                    roots.push(node);
                }
            });

            gitFolderMap = nodeMap;

            // An node goc 'data': dua cac thu muc con len lam root (giong giao dien HS)
            let dataNode = nodeMap['data'];
            if (dataNode) {
                roots = dataNode.children;
            }
            // Sap xep: thu muc co con truoc, theo ten
            roots.sort(function(a, b){
                let ac = (a.children && a.children.length) ? 0 : 1;
                let bc = (b.children && b.children.length) ? 0 : 1;
                if (ac !== bc) return ac - bc;
                return a.name.localeCompare(b.name, 'vi');
            });

            function buildNodeHtml(node, depth = 0) {
                let hasChildren = node.children && node.children.length > 0;
                let isSelected = currentSelectedFolderId === node.path;
                let safeName = node.name.replace(/'/g, "\\'");
                let safePath = node.path.replace(/'/g, "\\'");

                let displayName = node.name;

                let childrenHtml = '';
                if (hasChildren) {
                    childrenHtml = node.children.map(child => buildNodeHtml(child, depth + 1)).join('');
                }

                let activeClass = isSelected 
                    ? "bg-blue-600 text-white font-bold shadow-md scale-[1.01]" 
                    : "text-slate-700 hover:bg-slate-100 font-medium";

                // QUY TẮC: Tat ca thu muc mac dinh DONG, chi mo khi nguoi dung click.
                let isExpandedByDefault = false;
                let chevronClass = isExpandedByDefault ? "fa-solid fa-chevron-down text-[10px]" : "fa-solid fa-chevron-right text-[10px]";
                let childrenContainerClass = isExpandedByDefault 
                    ? "folder-children pl-3 border-l-2 border-slate-200 ml-2 mt-0.5 space-y-0.5" 
                    : "folder-children hidden pl-3 border-l-2 border-slate-200 ml-2 mt-0.5 space-y-0.5";

                return `
                    <div class="folder-node-wrapper my-0.5">
                        <div class="folder-node p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition border-l-2 border-transparent ${activeClass}"
                             data-path="${node.path}"
                             onclick="selectFolder('${safePath}', '${safeName}', this)">
                            <div class="flex items-center space-x-1.5 truncate pr-1">
                                ${hasChildren ? `
                                    <button type="button" onclick="event.stopPropagation(); toggleFolderExpand(this)" class="p-1 text-slate-400 hover:text-blue-600 transition" title="Mở/Đóng nhánh">
                                        <i class="${chevronClass}"></i>
                                    </button>
                                ` : `<span class="w-4 inline-block"></span>`}
                                <i class="fa-solid ${hasChildren ? 'fa-folder-tree text-blue-500' : 'fa-folder text-amber-500'}"></i>
                                <span class="truncate">${displayName}</span>
                            </div>
                            ${hasChildren ? `<span class="text-[9px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-full font-bold">${node.children.length}</span>` : ''}
                        </div>
                        ${hasChildren ? `<div class="${childrenContainerClass}">${childrenHtml}</div>` : ''}
                    </div>
                `;
            }

            let html = roots.map(rootNode => buildNodeHtml(rootNode)).join('');
            container.innerHTML = html || '<span class="text-slate-400 text-xs italic">Không có thư mục phù hợp.</span>';
        }

        function toggleFolderExpand(btn) {
            let parentWrapper = btn.closest('.folder-node-wrapper');
            if (!parentWrapper) return;
            let subContainer = parentWrapper.querySelector('.folder-children');
            if (!subContainer) return;
            
            let icon = btn.querySelector('i');
            if (subContainer.classList.contains('hidden')) {
                subContainer.classList.remove('hidden');
                if (icon) icon.className = "fa-solid fa-chevron-down text-[10px]";
            } else {
                subContainer.classList.add('hidden');
                if (icon) icon.className = "fa-solid fa-chevron-right text-[10px]";
            }
        }

        function toggleSidebar() {
            document.getElementById('sidebar-container').classList.toggle('hidden');
        }

        function folderHasChildren(path){
            let n = (typeof gitFolderMap !== 'undefined' && gitFolderMap) ? gitFolderMap[path] : null;
            return !!(n && n.children && n.children.length);
        }
        function selectFolder(path, name, element) {
            // QUY TAC: chi duoc chon thu muc TRONG CUNG (khong co thu muc con).
            // Click vao thu muc cha thi chi mo/ dong nhanh, khong chon.
            if (folderHasChildren(path)) {
                if (element) {
                    let wrapper = element.closest('.folder-node-wrapper');
                    if (wrapper) {
                        let sub = wrapper.querySelector('.folder-children');
                        let icon = wrapper.querySelector('button i');
                        if (sub) {
                            if (sub.classList.contains('hidden')) {
                                sub.classList.remove('hidden');
                                if (icon) icon.className = "fa-solid fa-chevron-down text-[10px]";
                            } else {
                                sub.classList.add('hidden');
                                if (icon) icon.className = "fa-solid fa-chevron-right text-[10px]";
                            }
                        }
                    }
                }
                return;
            }
            currentSelectedFolderId = path;
            currentSelectedFolderName = name;

            // Dong bo sang trang Quan ly: tu hien bai trong thu muc vua chon
            try {
                if (typeof manageFolderFilter !== 'undefined') manageFolderFilter = path;
                let mv = document.getElementById('module-manage-view');
                if (mv && !mv.classList.contains('hidden') && typeof renderLessonManagementList === 'function') {
                    renderLessonManagementList();
                }
            } catch(eSync){}

            let displayPath = path || 'data';
            document.getElementById('selected-folder-name').innerText = `${name} (${displayPath})`;
            document.getElementById('main-working-folder-display').innerHTML = `
                <i class="fa-solid fa-folder-open mr-2 text-amber-400"></i> ${name}
                <span class="text-xs text-blue-200 font-normal ml-2 tracking-normal">[${displayPath}]</span>
            `;

            let delBtn = document.getElementById('delete-folder-btn');
            if (!path || path === 'data' || path === 'root') {
                delBtn.classList.add('hidden');
            } else {
                delBtn.classList.remove('hidden');
            }

            document.querySelectorAll('.folder-node').forEach(el => {
                if (el.getAttribute('data-path') === path || (path === 'data' && el.id === 'folder-item-root')) {
                    el.className = "folder-node p-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer flex items-center justify-between text-xs shadow-md transition-all scale-[1.01]";
                } else {
                    el.className = "folder-node p-2 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-slate-700 text-xs font-medium transition border-l-2 border-transparent";
                }
            });
        }

        // FIX 2026-10-08: sau khi tạo thư mục mới, cây render mặc định ĐÓNG hết
        // nên thư mục mới nằm ẩn trong thư mục cha -> mở các thư mục cha,
        // cuộn tới và chọn thư mục mới để người dùng thấy ngay.
        function revealFolderInTree(path){
            if (!path) return;
            let parts = path.split('/');
            for (let i = 1; i < parts.length; i++){
                let anc = parts.slice(0, i).join('/');
                document.querySelectorAll('.folder-node').forEach(function(el){
                    if (el.getAttribute('data-path') === anc){
                        let wrapper = el.closest('.folder-node-wrapper');
                        let sub = wrapper ? wrapper.querySelector('.folder-children') : null;
                        let icon = wrapper ? wrapper.querySelector('button i') : null;
                        if (sub && sub.classList.contains('hidden')){
                            sub.classList.remove('hidden');
                            if (icon) icon.className = "fa-solid fa-chevron-down text-[10px]";
                        }
                    }
                });
            }
            let name = parts[parts.length - 1];
            let target = null;
            document.querySelectorAll('.folder-node').forEach(function(el){
                if (el.getAttribute('data-path') === path) target = el;
            });
            if (target){
                selectFolder(path, name, target);
                try { target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch(e){}
            } else {
                // Cây chưa kịp có node mới: vẫn cập nhật banner chọn
                currentSelectedFolderId = path;
                currentSelectedFolderName = name;
                let sf = document.getElementById('selected-folder-name');
                if (sf) sf.innerText = name + ' (' + path + ')';
            }
        }

        // FIX 2026-10-08: hộp thoại tạo thư mục cho CHỌN THƯ MỤC CHA (vì thư mục cha
        // không chọn được ở cây — click chỉ mở/đóng). Mặc định là thư mục đang chọn.
        function openAddFolderModal() {
            let sel = document.getElementById('add-folder-parent');
            if (sel){
                let opts = [];
                let map = (typeof gitFolderMap !== 'undefined' && gitFolderMap) ? gitFolderMap : {};
                Object.keys(map).forEach(function(p){
                    if (p === 'data/bank' || p.indexOf('data/bank/') === 0) return;
                    if (p === 'data/scores' || p.indexOf('data/scores/') === 0) return;
                    if (p === 'backup' || p.indexOf('backup/') === 0) return;
                    let depth = p === 'data' ? 0 : p.split('/').length - 1;
                    opts.push({ path: p, depth: depth, name: map[p].name || p });
                });
                opts.sort(function(a, b){
                    if (a.path === 'data') return -1;
                    if (b.path === 'data') return 1;
                    return a.path.localeCompare(b.path, 'vi');
                });
                let cur = currentSelectedFolderId || 'data';
                sel.innerHTML = opts.map(function(o){
                    let indent = new Array(o.depth + 1).join('&nbsp;&nbsp;');
                    let label = (o.path === 'data' ? 'data (thư mục gốc)' : indent + o.name);
                    return '<option value="' + o.path.replace(/"/g, '&quot;') + '"' + (o.path === cur ? ' selected' : '') + '>' + label + '</option>';
                }).join('');
            }
            let nameInput = document.getElementById('add-folder-name');
            if (nameInput) nameInput.value = '';
            let modal = document.getElementById('add-folder-modal');
            if (modal){
                modal.classList.remove('hidden');
                if (nameInput) setTimeout(function(){ nameInput.focus(); }, 50);
            }
        }

        function closeAddFolderModal(){
            let modal = document.getElementById('add-folder-modal');
            if (modal) modal.classList.add('hidden');
        }

        async function confirmAddFolder(){
            let sel = document.getElementById('add-folder-parent');
            let nameInput = document.getElementById('add-folder-name');
            let parentFolder = (sel && sel.value) || currentSelectedFolderId || 'data';
            let folderName = nameInput ? nameInput.value.trim() : '';
            if (!folderName){ alert('Vui lòng nhập tên thư mục mới!'); if (nameInput) nameInput.focus(); return; }
            folderName = folderName.replace(/[\\/:*?"<>|]/g, "_");
            closeAddFolderModal();
            await createFolderOnGitHub(parentFolder, folderName);
        }

        async function createFolderOnGitHub(parentFolder, folderName) {
            let newFolderPath = `${parentFolder}/${folderName}`;

            let token = getGithubToken();
            if (!token) {
                // Đẩy tạo thư mục qua Google Apps Script Proxy an toàn
                try {
                    let payload = {
                        type: 'PUSH_TO_GITHUB',
                        filePath: `${newFolderPath}/.gitkeep`,
                        content: `Thư mục: ${folderName}\nTạo bởi: ${currentUser.name}\nThời gian: ${new Date().toLocaleString()}`,
                        commitMessage: `Tạo thư mục mới: ${newFolderPath} bởi ${currentUser.name}`,
                        folderName: folderName,
                        parentId: parentFolder
                    };

                    let res = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(payload)
                    });
                    let result = await parseSafeResponse(res);
                    if (result.status === 'success') {
                        alert(`Đã tạo thư mục "${folderName}" thành công trên GitHub qua Google Proxy!`);
                        currentSelectedFolderId = newFolderPath;
                        currentSelectedFolderName = folderName;
                        await loadFolderTreeFromGit(true, newFolderPath);
                        revealFolderInTree(newFolderPath);
                    } else {
                        alert(`Lỗi tạo thư mục: ${result.message || 'Không xác định'}`);
                    }
                } catch(err) {
                    alert(`Lỗi kết nối tạo thư mục: ${err.message}`);
                }
                return;
            }

            try {
                let encodedPath = getEncodedGitHubPath(`${newFolderPath}/.gitkeep`);
                let apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodedPath}`;

                let putRes = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Tạo thư mục mới: ${newFolderPath} bởi ${currentUser.name}`,
                        content: utf8ToBase64(`Thư mục: ${folderName}\nTạo bởi: ${currentUser.name}\nThời gian: ${new Date().toLocaleString()}`),
                        branch: GITHUB_CONFIG.branch
                    })
                });

                if (putRes.ok) {
                    alert(`Đã tạo thư mục "${folderName}" thành công trên GitHub!`);
                    currentSelectedFolderId = newFolderPath;
                    currentSelectedFolderName = folderName;
                    await loadFolderTreeFromGit(true, newFolderPath);
                    revealFolderInTree(newFolderPath);
                } else {
                    let err = await putRes.json();
                    alert(`Lỗi tạo thư mục trên GitHub: ${err.message || 'Không xác định'}`);
                }
            } catch (err) {
                alert(`Lỗi kết nối khi tạo thư mục: ${err.message}`);
            }
        }

        async function deleteSelectedFolder() {
            // Chỉ admin được xóa thư mục (2026-10-08): giáo viên không được xóa bất kỳ thư mục nào
            try {
                if (!(typeof currentUser !== 'undefined' && currentUser.role === 'admin')){
                    alert('Chỉ admin mới được xóa thư mục.');
                    return;
                }
            } catch(e){}
            if (!currentSelectedFolderId || currentSelectedFolderId === 'data') {
                alert("Không thể xóa thư mục gốc data!");
                return;
            }
            let delPath = currentSelectedFolderId, delName = currentSelectedFolderName;

            // Liet ke file trong thu muc (de canh bao + xoa de quy)
            let delFiles = [];
            try {
                let tk2 = getGithubToken();
                let hh = { "Accept": "application/vnd.github+json" };
                if (tk2) hh["Authorization"] = "Bearer " + tk2;
                let tr = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/git/trees/${GITHUB_CONFIG.branch}?recursive=1`, { headers: hh });
                if (tr.ok) {
                    let td = await tr.json();
                    if (td && Array.isArray(td.tree)) {
                        delFiles = td.tree.filter(function(it){ return it.type === 'blob' && (it.path === delPath || it.path.startsWith(delPath + '/')); }).map(function(it){ return it.path; });
                    }
                }
            } catch(eC){}
            let fileCount = delFiles.length;

            let msg = `XÁC NHẬN XÓA: Xóa thư mục "${delName}" (${delPath}) trên GitHub?`;
            if (fileCount > 0) msg += `\n\nCẢNH BÁO: Thư mục còn chứa ${fileCount} file (bài học). Xóa thư mục sẽ XÓA TẤT CẢ các bài bên trong!`;
            if (!confirm(msg)) return;

            let token = getGithubToken();
            // Xoa tung file trong thu muc (de quy). Neu thu muc rong, dam bao co .gitkeep de xoa.
            let targets = delFiles.length ? delFiles : [delPath + '/.gitkeep'];
            let okCount = 0, failCount = 0;
            for (let fi = 0; fi < targets.length; fi++){
                let fp = targets[fi];
                try {
                    if (!token) {
                        let res = await fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                type: 'DELETE_FROM_GITHUB',
                                filePath: fp,
                                commitMessage: `Xóa thư mục: ${delPath} bởi ${(typeof currentUser !== 'undefined' && currentUser.name) || 'admin'}`
                            })
                        });
                        let result = await parseSafeResponse(res);
                        if (result.status === 'success') okCount++; else failCount++;
                    } else {
                        let encodedPath = getEncodedGitHubPath(fp);
                        let apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodedPath}?ref=${GITHUB_CONFIG.branch}`;
                        let checkRes = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' } });
                        if (checkRes.ok) {
                            let fileData = await checkRes.json();
                            let delRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodedPath}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message: `Xóa thư mục: ${delPath} bởi ${(typeof currentUser !== 'undefined' && currentUser.name) || 'admin'}`, sha: fileData.sha, branch: GITHUB_CONFIG.branch })
                            });
                            if (delRes.ok) okCount++; else failCount++;
                        } else { failCount++; }
                    }
                } catch(eF){ failCount++; }
            }
            if (okCount > 0 && failCount === 0) {
                alert(`Đã xóa thư mục "${delName}" (${okCount} file) trên GitHub!`);
            } else if (okCount > 0) {
                alert(`Đã xóa ${okCount} file, còn ${failCount} file lỗi. Hãy bấm Làm mới và thử lại.`);
            } else {
                alert(`Không xóa được file nào (lỗi quyền hoặc kết nối).`);
            }
            clearFolderSelection();
            await loadFolderTreeFromGit(true);
        }

        function clearFolderSelection(){
            currentSelectedFolderId = "";
            currentSelectedFolderName = "(chưa chọn)";
            let sf = document.getElementById('selected-folder-name');
            if (sf) sf.innerText = "Chưa chọn — bấm vào thư mục trong cùng ở cây bên dưới";
            let mw = document.getElementById('main-working-folder-display');
            if (mw) mw.innerHTML = '<i class="fa-solid fa-folder-open mr-2 text-amber-400"></i> <span class="text-rose-300">Chưa chọn thư mục</span>';
            let delBtn = document.getElementById('delete-folder-btn');
            if (delBtn) delBtn.classList.add('hidden');
            document.querySelectorAll('.folder-node').forEach(function(el){
                el.className = "folder-node p-2 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-slate-700 text-xs font-medium transition border-l-2 border-transparent";
            });
        }
        function updateScorePreview() {
            let type = document.getElementById('item-type').value;
            let preview = document.getElementById('score-reward-preview');
            let isEdit = document.getElementById('edit-mode-flag').value === 'EDIT';

            if (isEdit) {
                preview.innerText = `+${scoreConfig.edit} điểm thưởng (Sửa bài)`;
            } else {
                let pts = scoreConfig.knowledge;
                if (type === 'EXAM_LONG') pts = scoreConfig.examLong;
                if (type === 'EXAM_SHORT') pts = scoreConfig.examShort;
                preview.innerText = `+${pts} điểm thưởng`;
            }
        }
