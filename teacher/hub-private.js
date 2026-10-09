        // LOP HOC THEM (rieng tu) — 2026-10-09
        // Moi lop: {id, name, teacher_id, teacher_name, join_code, students:[{id,name,class}], created_at}
        // Luu tai data/private/classes.json. Thu muc bai: data/private/<id>/
        let pvClasses = [];
        let pvLoaded = false;

        async function pvFetchClasses(){
            try {
                let url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/' + GITHUB_CONFIG.branch + '/data/private/classes.json?t=' + Date.now();
                let r = await fetch(url);
                if (!r.ok) return [];
                let j = await r.json();
                return j.classes || [];
            } catch(e){ return []; }
        }
        // FIX 2026-10-10: dung GAS proxy thay vi token ca nhan — GV nao cung tao lop duoc
        var PV_GAS_URL = (typeof API_URL !== 'undefined') ? API_URL : 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';
        async function pvGasPush(filePath, content, commitMessage, title){
            var author = (typeof currentUser !== 'undefined' && currentUser) ? (currentUser.name || currentUser.id) : 'GV';
            var lastErr = null;
            for (var attempt = 0; attempt < 3; attempt++){
                var pushRes = await fetch(PV_GAS_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'text/plain;charset=utf-8'},
                    body: JSON.stringify({
                        type: 'PUSH_TO_GITHUB',
                        filePath: filePath,
                        content: content,
                        commitMessage: commitMessage,
                        title: title,
                        author: author
                    })
                });
                var rj = await pushRes.json();
                if (rj && rj.status === 'success') return true;
                var emsg = String((rj && rj.message) || '');
                if (emsg.indexOf('409') < 0) throw new Error(emsg || 'Lưu thất bại.');
                lastErr = new Error(emsg || 'Xung đột, đang thử lại...');
                await new Promise(function(r){ setTimeout(r, 1200); });
            }
            throw lastErr || new Error('Không lưu được, vui lòng thử lại.');
        }
        async function pvSaveClasses(){
            let content = JSON.stringify({ classes: pvClasses, updated: new Date().toISOString() }, null, 1);
            let path = 'data/private/classes.json';
            await pvGasPush(path, content,
                'Cap nhat lop hoc them (' + ((typeof currentUser !== 'undefined' && currentUser && currentUser.name) || 'GV') + ')',
                'Cap nhat lop hoc them');
            return true;
        }
        function pvGenCode(){
            let c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
            for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
            return s;
        }
        // FIX 2026-10-10: Tag phân biệt chủ lớp — GV trường: {id_truong}_{ten_gv}, TK tự do: TD_{sdt}
        // Mục đích: 2 GV khác nhau cùng đặt tên lớp "10A1" vẫn phân biệt được.
        function pvOwnerTag(){
            let id = (typeof currentUser !== 'undefined' && currentUser && currentUser.id) ? String(currentUser.id) : '';
            let name = (typeof currentUser !== 'undefined' && currentUser && currentUser.name) ? currentUser.name : 'GV';
            let isPhone = /^0\d{8,11}$/.test(id);   // SĐT VN: bắt đầu bằng 0
            let isEmail = id.indexOf('@') >= 0;
            if (isPhone || isEmail) return 'TD_' + id;   // TK tự do
            if (id) return id + '_' + name;               // GV trường (ID trường)
            return 'TD_' + name;
        }
        function pvMyClasses(){
            let isAdmin = currentUser.role === 'admin';
            return pvClasses.filter(function(c){
                return isAdmin || c.teacher_id === currentUser.id;
            });
        }
        async function loadPrivateClasses(){
            let list = document.getElementById('pv-class-list');
            if (list) list.innerHTML = '<p class="text-xs text-slate-400 italic">Đang tải...</p>';
            pvClasses = await pvFetchClasses();
            pvLoaded = true;
            renderPrivateClasses();
        }
        function renderPrivateClasses(){
            let list = document.getElementById('pv-class-list');
            if (!list) return;
            let mine = pvMyClasses();
            if (!mine.length){
                list.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa có lớp nào. Tạo lớp đầu tiên ở trên.</p>';
                return;
            }
            let html = '';
            mine.forEach(function(c){
                let nS = (c.students || []).length;
                let tag = c.owner_tag ? '<span class="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 ml-1 font-mono">' + escHtml(c.owner_tag) + '</span>' : '';
                html += '<div class="bg-white border border-violet-200 rounded-xl p-3">'
                    + '<div class="flex items-center justify-between mb-2">'
                    + '<div><p class="font-bold text-sm text-slate-800">' + escHtml(c.name) + tag + '</p>'
                    + '<p class="text-[11px] text-slate-500">Mã vào lớp: <b class="text-violet-700 font-mono">' + escHtml(c.join_code) + '</b> · ' + nS + ' học sinh</p></div>'
                    + '<div class="flex gap-1.5">'
                    + '<button onclick="pvSelectFolder(\'' + c.id + '\')" class="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-2.5 py-1.5 rounded-lg" title="Chọn thư mục này để đẩy bài"><i class="fa-solid fa-folder-open mr-1"></i>Đẩy bài vào lớp</button>'
                    + '<button onclick="pvDeleteClass(\'' + c.id + '\')" class="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200"><i class="fa-solid fa-trash"></i></button>'
                    + '</div></div>'
                    + '<div class="flex gap-2 mb-2">'
                    + '<input id="pv-add-' + c.id + '" placeholder="Tên HS cần thêm..." class="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5">'
                    + '<button onclick="pvAddStudent(\'' + c.id + '\')" class="text-[11px] font-bold text-violet-700 border border-violet-300 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg"><i class="fa-solid fa-user-plus mr-1"></i>Thêm HS</button>'
                    + '</div>'
                    + '<div class="flex flex-wrap gap-1.5">'
                    + (c.students || []).map(function(st){
                        return '<span class="text-[11px] bg-violet-50 border border-violet-200 text-violet-800 rounded-full px-2.5 py-1 flex items-center gap-1.5">'
                            + escHtml(st.name)
                            + '<button onclick="pvRemoveStudent(\'' + c.id + '\',\'' + st.id + '\')" class="text-violet-400 hover:text-rose-600 font-bold">×</button></span>';
                    }).join('') + (nS ? '' : '<span class="text-[11px] text-slate-400 italic">Chưa có học sinh — chia sẻ mã lớp để HS tự vào.</span>')
                    + '</div></div>';
            });
            list.innerHTML = html;
        }
        function escHtml(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

        async function createPrivateClass(){
            let inp = document.getElementById('pv-class-name');
            let name = inp ? inp.value.trim() : '';
            if (!name){ alert('Nhập tên lớp.'); return; }
            if (!pvLoaded) pvClasses = await pvFetchClasses();
            let id = 'lop_' + Date.now().toString(36);
            let ownerTag = pvOwnerTag();  // FIX 2026-10-10: tag phân biệt chủ lớp
            pvClasses.push({
                id: id, name: name,
                teacher_id: currentUser.id, teacher_name: currentUser.name,
                owner_tag: ownerTag,
                join_code: pvGenCode(), students: [],
                created_at: new Date().toISOString()
            });
            try {
                await pvSaveClasses();
                // Tao thu muc tren GitHub (bang .gitkeep)
                await pvEnsureFolder(id);
                if (inp) inp.value = '';
                renderPrivateClasses();
                if (typeof showToast === 'function') showToast('Đã tạo lớp "' + name + '"!', 'success');
                else alert('Đã tạo lớp!');
            } catch(e){ alert('Lỗi tạo lớp: ' + e.message); }
        }
        async function pvEnsureFolder(classId){
            let path = 'data/private/' + classId + '/.gitkeep';
            await pvGasPush(path, '',
                'Tao thu muc lop hoc them ' + classId,
                'Tao thu muc lop');
        }
        async function pvDeleteClass(id){
            if (!confirm('Xóa lớp này? Bài đã đẩy trong thư mục lớp vẫn giữ nguyên.')) return;
            pvClasses = pvClasses.filter(function(c){ return c.id !== id; });
            try { await pvSaveClasses(); renderPrivateClasses(); } catch(e){ alert('Lỗi: ' + e.message); }
        }
        async function pvAddStudent(classId){
            let inp = document.getElementById('pv-add-' + classId);
            let nm = inp ? inp.value.trim() : '';
            if (!nm) return;
            let c = pvClasses.find(function(x){ return x.id === classId; });
            if (!c) return;
            c.students = c.students || [];
            // Đính chính 2026-10-10: GV thêm HS SỐ LƯỢNG TÙY Ý, không giới hạn.
            // HS chưa vào nhóm nào → mặc định ở nhóm "Trải nghiệm" (không thống kê điểm).
            c.students.push({ id: 'hs_' + Date.now().toString(36), name: nm, class: '' });
            try { await pvSaveClasses(); renderPrivateClasses(); } catch(e){ alert('Lỗi: ' + e.message); }
        }
        async function pvRemoveStudent(classId, stuId){
            let c = pvClasses.find(function(x){ return x.id === classId; });
            if (!c) return;
            c.students = (c.students || []).filter(function(st){ return st.id !== stuId; });
            try { await pvSaveClasses(); renderPrivateClasses(); } catch(e){ alert('Lỗi: ' + e.message); }
        }
        // Chon thu muc lop de day bai (chuyen sang tab Soan bai + chon cay)
        function pvSelectFolder(classId){
            let c = pvClasses.find(function(x){ return x.id === classId; });
            if (typeof switchTeacherModule === 'function') switchTeacherModule('compose');
            setTimeout(function(){
                if (typeof selectPrivateFolder === 'function') selectPrivateFolder(classId, c ? c.name : classId);
                else alert('Đã chọn lớp "' + (c ? c.name : '') + '". Hãy chọn thư mục data/private/' + classId + ' ở cây bên trái.');
            }, 300);
        }
        // Hook vao chuyen tab: tai danh sach khi mo tab private
        (function(){
            let origSwitch = window.switchTeacherModule;
            // se duoc hub-tabs.js dinh nghia lai; poll de hook
            let tries = 0;
            let iv = setInterval(function(){
                tries++;
                if (typeof window.switchTeacherModule === 'function' && !window._pvHooked){
                    window._pvHooked = true;
                    let base = window.switchTeacherModule;
                    window.switchTeacherModule = function(mod){
                        base(mod);
                        if (mod === 'private') loadPrivateClasses();
                    };
                    clearInterval(iv);
                }
                if (tries > 40) clearInterval(iv);
            }, 250);
        })();
