
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

            if (currentUser.role === 'admin') {
                document.getElementById('admin-settings-btn')?.classList.remove('hidden');
                document.getElementById('admin-accounts-btn')?.classList.remove('hidden');
                document.getElementById('admin-assign-btn')?.classList.remove('hidden');
                document.getElementById('admin-users-btn')?.classList.remove('hidden');
                if (typeof updateRegBadge === 'function') updateRegBadge();
            }

            // Chọn mặc định thư mục data
            selectFolder('data', 'data (Thư viện bài giảng)');

            // Tải danh mục thư mục trực tiếp từ GitHub
            loadFolderTreeFromGit();

            switchPushMode('theory'); // mặc định mở tab đẩy lý thuyết
            renderMathPreview(); 
        }

        // HÀM TẢI DANH MỤC TRỰC TIẾP TỪ GITHUB API
        async function loadFolderTreeFromGit(forceRefresh = false) {
            let container = document.getElementById('dynamic-folder-list');
            container.innerHTML = '<span class="text-slate-400 text-xs italic"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang nạp danh mục từ GitHub...</span>';

            let folders = [];
            let token = getGithubToken();

            try {
                let headers = { "Accept": "application/vnd.github+json" };
                if (token) headers["Authorization"] = `Bearer ${token}`;

                let apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/git/trees/${GITHUB_CONFIG.branch}?recursive=1`;
                let res = await fetch(apiUrl, { headers });

                if (res.ok) {
                    let data = await res.json();
                    if (data && Array.isArray(data.tree)) {
                        folders = data.tree
                            .filter(item => {
                                if (item.type !== 'tree') return false;
                                let p = item.path;
                                // QUY TẮC BẢO MẬT: TUYỆT ĐỐI KHÔNG ĐỤNG ĐẾN THƯ MỤC BACKUP VÀ HỆ THỐNG
                                if (p === 'backup' || p.startsWith('backup/')) return false;
                                if (p === 'data/bank' || p.startsWith('data/bank/')) return false; // Bank tu dong trich, khong phai noi day bai
                                if (p === 'data/scores' || p.startsWith('data/scores/')) return false; // Diem thi, khong phai noi day bai
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

                        localStorage.setItem('saobay_git_folders', JSON.stringify(folders));
                    }
                } else {
                    console.warn("GitHub Tree API phản hồi không thành công:", res.status);
                }
            } catch (err) {
                console.warn("Lỗi gọi GitHub API, thử đọc từ cache/folders.json:", err);
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
                if (typeof showToast === 'function') showToast('Vui lòng chọn thư mục trong cùng (không có thư mục con) để đẩy bài.', 'warning');
                return;
            }
            currentSelectedFolderId = path;
            currentSelectedFolderName = name;

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

        async function openAddFolderModal() {
            let parentFolder = currentSelectedFolderId || 'data';
            let folderName = prompt(`Nhập tên thư mục mới (sẽ tạo bên trong thư mục: "${parentFolder}"):`);
            if (!folderName || !folderName.trim()) return;

            folderName = folderName.trim().replace(/[\\/:*?"<>|]/g, "_");
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
                        await loadFolderTreeFromGit(true);
                        selectFolder(newFolderPath, folderName);
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
                    await loadFolderTreeFromGit(true);
                    selectFolder(newFolderPath, folderName);
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

            if (!confirm(`XÁC NHẬN XÓA: Bạn có chắc muốn xóa thư mục "${currentSelectedFolderName}" (${currentSelectedFolderId}) trên GitHub?`)) {
                return;
            }

            let token = getGithubToken();
            if (!token) {
                // Xóa thư mục qua Google Apps Script Proxy an toàn
                try {
                    let res = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({
                            type: 'DELETE_FROM_GITHUB',
                            filePath: `${currentSelectedFolderId}/.gitkeep`,
                            commitMessage: `Xóa thư mục: ${currentSelectedFolderId} bởi ${currentUser.name}`
                        })
                    });
                    let result = await parseSafeResponse(res);
                    if (result.status === 'success') {
                        alert(`Đã xóa thư mục "${currentSelectedFolderName}" trên GitHub qua Google Proxy!`);
                        selectFolder('data', 'data (Thư mục dữ liệu gốc)');
                        await loadFolderTreeFromGit(true);
                    } else {
                        alert(`Lỗi khi xóa qua Google Proxy: ${result.message || 'Không xác định'}`);
                    }
                } catch(err) {
                    alert(`Lỗi kết nối khi xóa thư mục: ${err.message}`);
                }
                return;
            }

            try {
                let encodedPath = getEncodedGitHubPath(`${currentSelectedFolderId}/.gitkeep`);
                let apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodedPath}?ref=${GITHUB_CONFIG.branch}`;

                let checkRes = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });

                if (checkRes.ok) {
                    let fileData = await checkRes.json();
                    let delRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodedPath}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Xóa thư mục: ${currentSelectedFolderId} bởi ${currentUser.name}`,
                            sha: fileData.sha,
                            branch: GITHUB_CONFIG.branch
                        })
                    });

                    if (delRes.ok) {
                        alert(`Đã xóa thư mục "${currentSelectedFolderName}" trên GitHub!`);
                        selectFolder('data', 'data (Thư mục dữ liệu gốc)');
                        await loadFolderTreeFromGit(true);
                        return;
                    }
                }

                alert(`Thư mục đã được bỏ chọn. Lưu ý: Thư mục có chứa bài học chỉ bị xóa khi toàn bộ các file bên trong được dọn dẹp.`);
                selectFolder('data', 'data (Thư mục dữ liệu gốc)');
                await loadFolderTreeFromGit(true);
            } catch(err) {
                alert(`Lỗi khi xóa: ${err.message}`);
            }
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
