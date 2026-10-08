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
        async function pvSaveClasses(){
            let content = JSON.stringify({ classes: pvClasses, updated: new Date().toISOString() }, null, 1);
            let path = 'data/private/classes.json';
            // Lay SHA hien tai
            let sha = '';
            try {
                let gr = await fetch('https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(path) + '?ref=' + GITHUB_CONFIG.branch, {
                    headers: { 'Authorization': 'token ' + getGithubToken() }
                });
                if (gr.ok){ let gj = await gr.json(); sha = gj.sha || ''; }
            } catch(e){}
            let body = { message: 'Cap nhat lop hoc them (' + currentUser.name + ')', content: utf8ToBase64(content), branch: GITHUB_CONFIG.branch };
            if (sha) body.sha = sha;
            let pr = await fetch('https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(path), {
                method: 'PUT',
                headers: { 'Authorization': 'token ' + getGithubToken(), 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!pr.ok) throw new Error('GitHub API ' + pr.status);
            return true;
        }
        function pvGenCode(){
            let c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
            for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
            return s;
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
                html += '<div class="bg-white border border-violet-200 rounded-xl p-3">'
                    + '<div class="flex items-center justify-between mb-2">'
                    + '<div><p class="font-bold text-sm text-slate-800">' + escHtml(c.name) + '</p>'
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
            pvClasses.push({
                id: id, name: name,
                teacher_id: currentUser.id, teacher_name: currentUser.name,
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
            let body = { message: 'Tao thu muc lop hoc them ' + classId, content: utf8ToBase64(''), branch: GITHUB_CONFIG.branch };
            await fetch('https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + getEncodedGitHubPath(path), {
                method: 'PUT',
                headers: { 'Authorization': 'token ' + getGithubToken(), 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
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
