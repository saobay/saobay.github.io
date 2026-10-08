        // ========================================================
        // QUẢN LÝ PHÂN CÔNG CHUYÊN MÔN (2026-10-08)
        // - Admin: xem/sửa/xoá từng dòng, xoá TẤT CẢ, import Excel mới (thay toàn bộ)
        // - Dữ liệu: used/used.is -> key "assignments" [{class, subject, teachers}]
        //   giữ nguyên định dạng để tương thích với trang used.html
        // ========================================================

        let assignState = { list: [], usedRaw: null, dirty: false };
        const USED_IS_PATH = 'used/used.is';
        const XLSX_CDN = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';

        function assignIsAdmin(){
            try { return (typeof currentUser !== 'undefined' && currentUser.role === 'admin'); }
            catch(e){ return false; }
        }

        function assignNorm(s){
            return String(s == null ? '' : s).toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
        }

        function ensureXlsx(){
            return new Promise(function(resolve, reject){
                if (window.XLSX) return resolve();
                let sc = document.createElement('script');
                sc.src = XLSX_CDN;
                sc.onload = function(){ resolve(); };
                sc.onerror = function(){ reject(new Error('Không tải được thư viện Excel. Kiểm tra mạng rồi thử lại.')); };
                document.head.appendChild(sc);
            });
        }

        async function assignFetchUsed(){
            // đọc file public qua raw (không cần token)
            let url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                + '/' + GITHUB_CONFIG.branch + '/' + USED_IS_PATH + '?t=' + Date.now();
            let res = await fetch(url);
            if (!res.ok) throw new Error('Không đọc được used/used.is (HTTP ' + res.status + ')');
            let text = await res.text();
            let obj = JSON.parse(text);
            if (!Array.isArray(obj.assignments)) obj.assignments = [];
            return obj;
        }

        async function assignPushUsed(obj, message){
            let content = JSON.stringify(obj);
            let token = getGithubToken();
            if (token){
                // ghi trực tiếp qua GitHub API
                let apiUrl = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo
                    + '/contents/' + getEncodedGitHubPath(USED_IS_PATH);
                let sha;
                try {
                    let chk = await fetch(apiUrl + '?ref=' + GITHUB_CONFIG.branch,
                        { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
                    if (chk.ok){ let jd = await chk.json(); sha = jd.sha; }
                } catch(e){}
                let body = { message: message, content: utf8ToBase64(content), branch: GITHUB_CONFIG.branch };
                if (sha) body.sha = sha;
                let res = await fetch(apiUrl, { method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(body) });
                if (!res.ok){ let t = await res.text(); throw new Error('GitHub API ' + res.status + ': ' + t.slice(0,150)); }
                return;
            }
            // qua Google Proxy (token ẩn trên server)
            let res2 = await fetch(API_URL, { method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: USED_IS_PATH, content: content,
                    commitMessage: message, title: 'Phân công chuyên môn', author: (typeof currentUser !== 'undefined' ? currentUser.name : 'admin') })
            });
            let rj = await res2.json();
            if (rj.status !== 'success') throw new Error(rj.message || 'Proxy báo lỗi');
        }

        function openAssignManager(){
            if (!assignIsAdmin()){ alert('Chỉ admin mới được quản lý phân công chuyên môn.'); return; }
            let old = document.getElementById('assign-modal');
            if (old) old.remove();
            let modal = document.createElement('div');
            modal.id = 'assign-modal';
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-3';
            modal.innerHTML =
                '<div class="absolute inset-0 bg-black/50" onclick="document.getElementById(\'assign-modal\').remove()"></div>'
                + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">'
                + '<div class="flex items-center justify-between px-5 py-3 border-b bg-indigo-700 text-white">'
                + '<h3 class="font-black text-sm"><i class="fa-solid fa-clipboard-list mr-2"></i>Phân Công Chuyên Môn</h3>'
                + '<button onclick="document.getElementById(\'assign-modal\').remove()" class="text-white/80 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button></div>'
                + '<div class="px-5 py-3 flex flex-wrap gap-2 border-b bg-slate-50 text-xs font-bold">'
                + '<button onclick="assignAddRow()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg"><i class="fa-solid fa-plus mr-1"></i>Thêm dòng</button>'
                + '<button onclick="assignDeleteAll()" class="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg"><i class="fa-solid fa-trash-can mr-1"></i>Xoá tất cả</button>'
                + '<label class="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg cursor-pointer"><i class="fa-solid fa-file-excel mr-1"></i>Đẩy Excel mới<input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="assignImportExcel(this)"></label>'
                + '<button onclick="assignDownloadTemplate()" class="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg"><i class="fa-solid fa-download mr-1"></i>File mẫu</button>'
                + '<button onclick="assignSave()" class="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg ml-auto"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>Lưu phân công</button>'
                + '</div>'
                + '<div class="px-5 py-2 text-[11px] text-slate-500 border-b">File Excel gồm 3 cột: <b>Lớp</b> | <b>Môn</b> | <b>Giáo viên</b> (ví dụ: 10A1 | Toán | Bùi Thanh Hà (1700499890)). Đẩy Excel mới sẽ <b>thay toàn bộ</b> phân công cũ.</div>'
                + '<div class="p-5 overflow-y-auto"><div id="assign-body"><p class="text-xs text-slate-400 italic">Đang tải...</p></div></div>'
                + '</div>';
            document.body.appendChild(modal);
            assignReload();
        }

        async function assignReload(){
            let body = document.getElementById('assign-body');
            try {
                let obj = await assignFetchUsed();
                assignState.usedRaw = obj;
                assignState.list = obj.assignments.map(function(a){
                    return { class: a.class || '', subject: a.subject || '', teachers: a.teachers || '' };
                });
                assignState.dirty = false;
                assignRender();
            } catch(e){ body.innerHTML = '<p class="text-xs text-rose-600">Lỗi tải: ' + String(e.message || e).replace(/</g,'&lt;') + '</p>'; }
        }

        function assignEsc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

        function assignRender(){
            let body = document.getElementById('assign-body');
            if (!body) return;
            if (!assignState.list.length){
                body.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa có phân công nào. Bấm "Thêm dòng" hoặc "Đẩy Excel mới".</p>';
                return;
            }
            let h = '<table class="w-full text-xs border-collapse"><thead><tr class="bg-slate-100 text-slate-600">'
                + '<th class="border px-2 py-1.5 text-left w-10">STT</th><th class="border px-2 py-1.5 text-left">Lớp</th>'
                + '<th class="border px-2 py-1.5 text-left">Môn</th><th class="border px-2 py-1.5 text-left">Giáo viên</th>'
                + '<th class="border px-2 py-1.5 w-16"></th></tr></thead><tbody>';
            assignState.list.forEach(function(a, i){
                h += '<tr>'
                    + '<td class="border px-2 py-1 text-center text-slate-400">' + (i+1) + '</td>'
                    + '<td class="border px-1 py-1"><input data-i="' + i + '" data-k="class" value="' + assignEsc(a.class) + '" oninput="assignEditCell(this)" class="w-full text-xs border-0 px-1 py-1 font-semibold"></td>'
                    + '<td class="border px-1 py-1"><input data-i="' + i + '" data-k="subject" value="' + assignEsc(a.subject) + '" oninput="assignEditCell(this)" class="w-full text-xs border-0 px-1 py-1 font-semibold"></td>'
                    + '<td class="border px-1 py-1"><input data-i="' + i + '" data-k="teachers" value="' + assignEsc(a.teachers) + '" oninput="assignEditCell(this)" class="w-full text-xs border-0 px-1 py-1"></td>'
                    + '<td class="border px-1 py-1 text-center"><button onclick="assignDelRow(' + i + ')" class="text-rose-600 hover:text-rose-800" title="Xoá dòng"><i class="fa-solid fa-trash"></i></button></td>'
                    + '</tr>';
            });
            body.innerHTML = h + '</tbody></table><p class="text-[11px] text-slate-400 mt-2">Tổng: ' + assignState.list.length + ' dòng phân công.</p>';
        }

        function assignEditCell(el){
            let i = parseInt(el.getAttribute('data-i'), 10), k = el.getAttribute('data-k');
            if (assignState.list[i]){ assignState.list[i][k] = el.value; assignState.dirty = true; }
        }
        function assignAddRow(){ assignState.list.push({ class: '', subject: '', teachers: '' }); assignState.dirty = true; assignRender(); }
        function assignDelRow(i){
            if (!confirm('Xoá dòng phân công này?')) return;
            assignState.list.splice(i, 1); assignState.dirty = true; assignRender();
        }
        function assignDeleteAll(){
            if (!assignState.list.length){ alert('Đã trống.'); return; }
            if (!confirm('XOÁ TẤT CẢ ' + assignState.list.length + ' dòng phân công cũ?\nHành động này sẽ lưu ngay lên server.')) return;
            assignState.list = [];
            assignSave(true);
        }

        async function assignSave(silent){
            try {
                let obj = await assignFetchUsed(); // đọc mới nhất để không đè dữ liệu khác
                obj.assignments = assignState.list
                    .filter(function(a){ return (a.class || a.subject || a.teachers); })
                    .map(function(a){ return { class: String(a.class).trim(), subject: String(a.subject).trim(), teachers: String(a.teachers).trim() }; });
                await assignPushUsed(obj, 'Admin cập nhật phân công chuyên môn (' + obj.assignments.length + ' dòng)');
                assignState.dirty = false;
                if (!silent){
                    if (typeof showToast === 'function') showToast('Đã lưu phân công chuyên môn', 'success');
                    else alert('Đã lưu phân công chuyên môn.');
                }
                assignRender();
            } catch(e){ alert('Lỗi lưu: ' + (e.message || e)); }
        }

        async function assignDownloadTemplate(){
            try {
                await ensureXlsx();
                let wb = XLSX.utils.book_new();
                let ws = XLSX.utils.aoa_to_sheet([
                    ['BẢNG PHÂN CÔNG CHUYÊN MÔN'],
                    ['STT', 'Mã định danh', 'Họ tên giáo viên', 'Ngày sinh', 'Môn dạy'],
                    [1, '1700499890', 'Bùi Thanh Hà', '01/01/1980', 'Toán: 10A1, 10A2 GDĐP: 11A1'],
                    [2, '1700499891', 'Nguyễn Văn B', '02/02/1981', 'Ngữ Văn: 10A1, 11A2']
                ]);
                XLSX.utils.book_append_sheet(wb, ws, 'PhanCong');
                XLSX.writeFile(wb, 'mau-phan-cong-chuyen-mon.xlsx');
            } catch(e){ alert(e.message || e); }
        }

        // Tach "Môn: lớp1, lớp2 Môn2: lớp3..." -> [{subject, classes}]
        function parseAssignCell(cellText){
            let out = [];
            let text = String(cellText || '').replace(/\n/g, ' ').trim();
            if (!text) return out;
            let re = /([^\n:,;]+?)\s*:\s*((?:\d{1,2}A\d{1,2}\s*[,;\s]*)+)/g, m;
            while ((m = re.exec(text)) !== null){
                let subject = m[1].trim();
                let classes = (m[2].match(/\d{1,2}A\d{1,2}/gi) || []).map(function(c){ return c.toUpperCase(); });
                classes = classes.filter(function(c, i){ return classes.indexOf(c) === i; });
                if (subject && classes.length) out.push({ subject: subject, classes: classes });
            }
            return out;
        }

        async function assignImportExcel(input){
            let f = input.files && input.files[0];
            input.value = '';
            if (!f) return;
            try {
                await ensureXlsx();
                let buf = await f.arrayBuffer();
                let wb = XLSX.read(buf, { type: 'array' });
                let ws = wb.Sheets[wb.SheetNames[0]];
                let rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (rows.length < 2) throw new Error('File trống hoặc không có dữ liệu.');
                let list = [];
                // Phat hien dinh dang: mau chinh thuc (Ho ten giao vien + Mon day) hay mau don gian (Lop/Mon/GV)
                let hdrIdx = -1, mode = null, ci = -1, si = -1, ti = -1, bi = -1, ni = -1, mi = -1;
                for (let i = 0; i < Math.min(rows.length, 10); i++){
                    let h = rows[i].map(assignNorm);
                    let hstr = h.join(' ');
                    if (hstr.indexOf('ho ten') >= 0 && hstr.indexOf('mon') >= 0){
                        hdrIdx = i; mode = 'official';
                        bi = h.findIndex(function(x){ return x.indexOf('ma dinh danh') >= 0 || x === 'ma'; });
                        ni = h.findIndex(function(x){ return x.indexOf('ho ten') >= 0; });
                        mi = h.findIndex(function(x){ return x.indexOf('mon day') >= 0 && x.indexOf('lua chon') < 0; });
                        break;
                    }
                    let c0 = h.findIndex(function(x){ return ['lop','class'].indexOf(x) >= 0; });
                    let s0 = h.findIndex(function(x){ return ['mon','subject'].indexOf(x) >= 0; });
                    let t0 = h.findIndex(function(x){ return ['giao vien','giaovien','teachers','teacher','gv'].indexOf(x) >= 0; });
                    if (c0 >= 0 && s0 >= 0 && t0 >= 0){ hdrIdx = i; mode = 'simple'; ci = c0; si = s0; ti = t0; break; }
                }
                if (!mode) throw new Error('Không nhận diện được định dạng file. Dùng file mẫu (nút Tải file mẫu).');
                if (mode === 'official'){
                    if (ni < 0 || mi < 0) throw new Error('Không tìm thấy cột Họ tên / Môn dạy.');
                    let nGV = 0;
                    for (let r = hdrIdx + 1; r < rows.length; r++){
                        let row = rows[r];
                        let name = String(row[ni] || '').trim();
                        if (!name) continue;
                        nGV++;
                        let uid = bi >= 0 ? String(row[bi] || '').trim() : '';
                        let tstr = uid ? name + ' (' + uid + ')' : name;
                        parseAssignCell(String(row[mi] || '')).forEach(function(p){
                            p.classes.forEach(function(c){
                                list.push({ class: c, subject: p.subject, teachers: tstr });
                            });
                        });
                    }
                    if (!nGV) throw new Error('Không đọc được giáo viên nào.');
                } else {
                    for (let r = hdrIdx + 1; r < rows.length; r++){
                        let row = rows[r];
                        let c = String(row[ci] || '').trim(), s2 = String(row[si] || '').trim(), t = String(row[ti] || '').trim();
                        if (!c && !s2 && !t) continue;
                        list.push({ class: c, subject: s2, teachers: t });
                    }
                }
                if (!list.length) throw new Error('Không đọc được dòng dữ liệu nào.');
                if (!confirm('Đã đọc ' + list.length + ' phân công từ Excel.\nĐẩy file này sẽ THAY TOÀN BỘ phân công cũ. Tiếp tục?')) return;
                assignState.list = list;
                await assignSave(true);
                if (typeof showToast === 'function') showToast('Đã thay toàn bộ phân công từ Excel (' + list.length + ' dòng)', 'success');
                else alert('Đã thay toàn bộ phân công từ Excel.');
            } catch(e){ alert('Lỗi đọc Excel: ' + (e.message || e)); }
        }

        // Helper dùng chung: giáo viên hiện tại phụ trách những môn/khối nào
        function assignMySubjects(assignList, user){
            let out = [];
            let uname = assignNorm((user && user.name) || '');
            let uid = String((user && user.id) || '').trim();
            (assignList || []).forEach(function(a){
                let t = String(a.teachers || '');
                let tnorm = assignNorm(t.replace(/\(.*?\)/g, ''));
                let hit = (uname && tnorm.indexOf(uname) >= 0) || (uid && t.indexOf(uid) >= 0);
                if (hit) out.push(a);
            });
            return out;
        }
        function assignSubjectKey(s){
            return assignNorm(s).replace(/\s+/g, '');
        }
