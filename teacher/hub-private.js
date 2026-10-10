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
            /* PV_ADMIN_PRE_V1: bo loc GV + nap han TK + vung nguy hiem cho admin */
            if (typeof pvRenderTeacherFilter === 'function') pvRenderTeacherFilter();
            if (typeof pvRenderDangerZone === 'function') pvRenderDangerZone();
            if (typeof pvIsAdmin === 'function' && pvIsAdmin() && typeof pvLoadExpiry === 'function' && pvExpiryCache === null){
                pvExpiryCache = {};
                pvLoadExpiry();
            }
            let mine = (typeof pvVisibleClasses === 'function') ? pvVisibleClasses() : pvMyClasses();
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
                    + '<p class="text-[11px] text-slate-500">' + ((typeof pvIsAdmin === 'function' && pvIsAdmin()) ? 'GV: <b class="text-slate-700">' + escHtml(c.teacher_name || c.teacher_id || '') + '</b> · ' : '') + 'Mã vào lớp: <b class="text-violet-700 font-mono">' + escHtml(c.join_code) + '</b> · ' + nS + ' học sinh</p></div>'
                    + '<div class="flex gap-1.5 flex-wrap justify-end">'
                    + '<button onclick="pvSelectFolder(\'' + c.id + '\')" class="text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-2.5 py-1.5 rounded-lg" title="Chọn thư mục này để đẩy bài"><i class="fa-solid fa-folder-open mr-1"></i>Đẩy bài vào lớp</button>'
                    + '<button onclick="pvLoadClassStats(\'' + c.id + '\')" class="text-[11px] font-bold text-emerald-700 border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg" title="Xem thống kê điểm HS trong lớp"><i class="fa-solid fa-chart-line mr-1"></i>Thống kê</button>'
                    + ((typeof pvIsAdmin === 'function' && pvIsAdmin()) ? '<button onclick="pvExtendClass(\'' + c.id + '\')" class="text-[11px] font-bold text-amber-700 border border-amber-300 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg" title="Gia hạn tài khoản cho cả lớp"><i class="fa-solid fa-hourglass-half mr-1"></i>Gia hạn cả lớp</button>' : '')
                    + '<button onclick="pvDeleteClass(\'' + c.id + '\')" class="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200"><i class="fa-solid fa-trash"></i></button>'
                    + '</div></div>'
                    + '<div id="pv-stats-' + c.id + '" class="mb-2"></div>'
                    + '<div class="flex flex-wrap gap-1.5 mb-2">'
                    + '<button onclick="pvExcelImport(\'' + c.id + '\')" class="text-[11px] font-bold text-blue-700 border border-blue-300 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg" title="Nhập HS từ file Excel"><i class="fa-solid fa-file-excel mr-1"></i>Nhập Excel</button>'
                    + '<button onclick="pvManualAdd(\'' + c.id + '\')" class="text-[11px] font-bold text-violet-700 border border-violet-300 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg" title="Thêm HS thủ công"><i class="fa-solid fa-user-plus mr-1"></i>Thêm HS</button>'
                    + '</div>'
                    + '<div class="flex flex-wrap gap-1.5">'
                    + (c.students || []).map(function(st){
                        /* PV_CHIP_BADGE_V1: 🟢 HS truong / 🟡 HS tu do + han TK + nut gia han (admin) */
                        var badge = st.linked ? '<span title="HS trường — đã có tài khoản, được liên kết">🟢</span>' : (st.isNew ? '<span title="HS tự do — tài khoản mới tạo">🟡</span>' : '');
                        var expLbl = (typeof pvExpiryLabel === 'function') ? pvExpiryLabel(st.id) : '';
                        var extBtn = (typeof pvIsAdmin === 'function' && pvIsAdmin()) ? '<button onclick="pvExtendOne(\'' + c.id + '\',\'' + st.id + '\')" class="text-amber-500 hover:text-amber-700 font-bold" title="Gia hạn tài khoản HS này">⏳</button>' : '';
                        return '<span class="text-[11px] bg-violet-50 border border-violet-200 text-violet-800 rounded-full px-2.5 py-1 flex items-center gap-1.5">'
                            + badge + escHtml(st.name) + expLbl + extBtn
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
        /* PV_DELETECLASS_V1 — xoa lop day them: phan biet "xoa khoi lop" vs "xoa TK" (2026-10-11)
           - HS truong: chi xoa khoi roster, TUYET DOI khong dung TK (passwords, han, bai nop giu nguyen).
           - HS tu do: neu khong con lop nao -> xoa TK (used.is TD_*, passwords, hs-tu-do.json, han, bai nop);
             neu con lop khac -> chi xoa khoi roster lop nay.
           - Xoa thu muc data/private/<id>/ (bai da day). Quyen: chu lop hoac admin. */
        async function pvDeleteClass(id){
            var c = pvClasses.find(function(x){ return x.id === id; });
            if (!c){ alert('Không tìm thấy lớp.'); return; }
            var isAdmin = (typeof pvIsAdmin === 'function') ? pvIsAdmin() : (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin');
            var me = (typeof currentUser !== 'undefined' && currentUser && currentUser.id) ? String(currentUser.id) : '';
            if (!isAdmin && String(c.teacher_id) !== me){ alert('Bạn chỉ xóa được lớp do mình tạo.'); return; }
            var db;
            try { db = await pvFetchUsedIs(); }
            catch(e){ alert('Không tải được dữ liệu để kiểm tra: ' + (e.message || e)); return; }
            var sch = (typeof pvSchoolIdSets === 'function') ? pvSchoolIdSets(db) : {ids: {}, phones: {}};
            var otherClassOf = {};
            (pvClasses || []).forEach(function(x){
                if (x.id === id) return;
                (x.students || []).forEach(function(st){ otherClassOf[String(st.id)] = true; });
            });
            var roster = c.students || [];
            var nSchool = 0, freeDel = [], freeKeep = [];
            roster.forEach(function(st){
                var sid = String(st.id);
                var isSchool = sch.ids[sid] || sch.phones[pvNormPhone(sid)];
                if (isSchool){ nSchool++; return; }
                if (otherClassOf[sid]) freeKeep.push(st); else freeDel.push(st);
            });
            var msg = 'Xóa lớp "' + c.name + '"' + (isAdmin ? ' của GV ' + (c.teacher_name || c.teacher_id || '') : '') + '?\n\n'
                + '- ' + nSchool + ' HS trường: chỉ xóa khỏi lớp, GIỮ NGUYÊN tài khoản.\n'
                + '- ' + freeDel.length + ' TK tự do sẽ bị XÓA (không còn lớp nào).\n'
                + '- ' + freeKeep.length + ' TK tự do giữ lại (còn học lớp khác).\n'
                + '- Thư mục bài đã đẩy data/private/' + id + '/ sẽ bị xóa.\n\n'
                + 'Hành động không thể hoàn tác. Tiếp tục?';
            if (!confirm(msg)) return;
            try {
                var adminName = (typeof currentUser !== 'undefined' && currentUser && currentUser.name) ? currentUser.name : 'GV';
                var delIds = freeDel.map(function(s){ return String(s.id); });
                var nScoreDel = 0;
                if (delIds.length){
                    var delSet = {};
                    delIds.forEach(function(x){ delSet[x] = true; });
                    await pvRmwFile(pvFetchUsedIs, function(d){
                        d.students = d.students || {};
                        Object.keys(d.students).forEach(function(k){
                            if (k.slice(0, 3) !== 'TD_') return;
                            d.students[k] = (d.students[k] || []).filter(function(s2, ix){
                                if (ix === 0) return true;
                                return !delSet[String(s2.id)];
                            });
                        });
                        d.passwords = d.passwords || {};
                        delIds.forEach(function(x){ delete d.passwords[x]; });
                    }, 'used/used.is', 'Xoa ' + delIds.length + ' TK tu do khi xoa lop ' + c.name + ' - ' + adminName);
                    await pvRmwFile(pvFetchHsTuDo, function(h){
                        h.students = h.students || {};
                        delIds.forEach(function(x){ delete h.students[x]; });
                    }, 'used/hs-tu-do.json', 'Xoa TK tu do khi xoa lop ' + c.name);
                    await pvRmwFile(pvFetchExpiry, function(e){
                        delIds.forEach(function(x){ delete e[x]; });
                    }, 'used/account_expiry.json', 'Xoa han TK tu do khi xoa lop ' + c.name);
                    var idSet2 = {};
                    delIds.forEach(function(x){ idSet2[x] = true; });
                    var sfiles = await pvFindScoreFiles(idSet2, {}, null, true);
                    for (var di = 0; di < sfiles.length; di++){
                        try { await pvGasDelete(sfiles[di], 'Xoa file diem TK tu do khi xoa lop ' + c.name); nScoreDel++; } catch(e){}
                    }
                }
                try {
                    var tr = await (await fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1')).json();
                    var prefix = 'data/private/' + id + '/';
                    var fps = (tr.tree || []).filter(function(t){ return t.type === 'blob' && t.path.indexOf(prefix) === 0; }).map(function(t){ return t.path; });
                    for (var k = 0; k < fps.length; k++){
                        try { await pvGasDelete(fps[k], 'Xoa thu muc lop ' + c.name + ' (' + (k + 1) + '/' + fps.length + ')'); } catch(e){}
                    }
                } catch(e){}
                pvClasses = pvClasses.filter(function(x){ return x.id !== id; });
                await pvSaveClasses();
                pvExpiryCache = null;
                renderPrivateClasses();
                var report = 'Đã xóa lớp "' + c.name + '". ' + nSchool + ' HS trường được giữ nguyên TK. ' + freeDel.length + ' TK tự do đã xóa (không còn lớp nào' + (nScoreDel ? ', ' + nScoreDel + ' file điểm' : '') + '). ' + freeKeep.length + ' TK tự do giữ lại (còn lớp khác).';
                if (typeof showToast === 'function') showToast(report, 'success'); else alert(report);
            } catch(e){ alert('Lỗi xóa lớp: ' + (e.message || e)); }
        }
        async function pvRemoveStudent(classId, stuId){
            let c = pvClasses.find(function(x){ return x.id === classId; });
            if (!c) return;
            c.students = (c.students || []).filter(function(st){ return st.id !== stuId; });
            try { await pvSaveClasses(); renderPrivateClasses(); } catch(e){ alert('Lỗi: ' + e.message); }
        }
        // FIX 2026-10-10 (loi 4): thong ke diem HS trong lop hoc them
        var pvStatsCache = {};
        function pvNormName(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]/g,''); }
        async function pvLoadClassStats(classId){
            var box = document.getElementById('pv-stats-' + classId);
            var c = pvClasses.find(function(x){ return x.id === classId; });
            if (!box || !c) return;
            if (pvStatsCache[classId]) { box.innerHTML = pvStatsCache[classId]; return; }
            box.innerHTML = '<p class="text-[11px] text-slate-400 italic">Đang tải thống kê...</p>';
            try {
                var tr = await (await fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1')).json();
                var files = (tr.tree || []).filter(function(t){ return t.type === 'blob' && t.path.indexOf('data/scores/') === 0 && t.path.slice(-5) === '.json'; });
                files.sort(function(a,b){ return a.path < b.path ? 1 : -1; });
                files = files.slice(0, 200);
                var all = [];
                for (var i = 0; i < files.length; i += 6) {
                    var rs = await Promise.all(files.slice(i, i+6).map(function(f){
                        return fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/' + f.path + '?t=' + Date.now()).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
                    }));
                    rs.forEach(function(d){ if (d) all.push(d); });
                }
                var rows = (c.students || []).map(function(st){
                    var nm = pvNormName(st.name), sid = String(st.id || '');
                    var mine = all.filter(function(d){
                        if (d.student_id && sid && String(d.student_id) === sid && !/^hs_/.test(sid)) return true;
                        return d.student_name && pvNormName(d.student_name) === nm;
                    });
                    var n = mine.length, avg = 0;
                    if (n) {
                        var sum = 0;
                        mine.forEach(function(d){ var sc = parseFloat(d.score)||0, mx = parseFloat(d.max_score)||0; sum += (mx>0 ? sc/mx*10 : 0); });
                        avg = sum / n;
                    }
                    return '<div class="flex justify-between text-[11px] bg-emerald-50/60 border border-emerald-100 rounded-lg px-2.5 py-1.5">'
                        + '<span class="font-bold text-slate-700">' + escHtml(st.name) + '</span>'
                        + '<span class="text-slate-500">' + n + ' bài · TB <b class="text-emerald-700">' + avg.toFixed(1) + '/10</b></span></div>';
                }).join('');
                /* PV_STATS_LEARN_V1: thong ke hoc tap — 2026-10-11 */
                var pvSubCount = {}, pvTotalSub = 0, pvDidSub = 0;
                (c.students || []).forEach(function(st){
                    var nm2 = pvNormName(st.name), sid2 = String(st.id || '');
                    var n2 = all.filter(function(d){
                        if (d.student_id && sid2 && String(d.student_id) === sid2 && !/^hs_/.test(sid2)) return true;
                        return d.student_name && pvNormName(d.student_name) === nm2;
                    }).length;
                    pvSubCount[st.id] = n2; pvTotalSub += n2; if (n2 > 0) pvDidSub++;
                });
                var pvTop3 = (c.students || []).slice().sort(function(a, b){ return (pvSubCount[b.id] || 0) - (pvSubCount[a.id] || 0); }).slice(0, 3)
                    .filter(function(s){ return (pvSubCount[s.id] || 0) > 0; });
                var pvNoneSub = (c.students || []).filter(function(s){ return !(pvSubCount[s.id] > 0); });
                var pvLearnHtml = '<div class="bg-sky-50/70 border border-sky-200 rounded-xl p-2.5 space-y-1">'
                    + '<p class="text-[11px] font-black text-sky-800"><i class="fa-solid fa-graduation-cap mr-1"></i>THỐNG KÊ HỌC TẬP</p>'
                    + '<p class="text-[11px] text-slate-600">Tổng <b class="text-sky-700">' + pvTotalSub + '</b> bài đã nộp · <b class="text-sky-700">' + pvDidSub + '/' + (c.students || []).length + '</b> HS đã làm ≥1 bài</p>'
                    + (pvTop3.length ? '<p class="text-[11px] text-slate-600">🏆 Tích cực nhất: ' + pvTop3.map(function(s){ return '<b>' + escHtml(s.name) + '</b> (' + pvSubCount[s.id] + ' bài)'; }).join(' · ') + '</p>' : '')
                    + (pvNoneSub.length ? '<p class="text-[11px] text-slate-500">💤 Chưa làm bài nào: ' + pvNoneSub.map(function(s){ return escHtml(s.name); }).join(', ') + '</p>' : '')
                    + '</div>';
                var html = '<div class="bg-emerald-50/40 border border-emerald-200 rounded-xl p-2.5 space-y-1.5">'
                    + '<p class="text-[11px] font-black text-emerald-800"><i class="fa-solid fa-chart-line mr-1"></i>THỐNG KÊ LỚP (' + (c.students||[]).length + ' HS)</p>'
                    + (rows || '<p class="text-[11px] text-slate-400 italic">Chưa có học sinh.</p>')
                    + pvLearnHtml + '</div>';
                pvStatsCache[classId] = html;
                box.innerHTML = html;
            } catch(e){ box.innerHTML = '<p class="text-[11px] text-rose-600">Lỗi tải thống kê: ' + escHtml(e.message || e) + '</p>'; }
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


/* PV_MANAGE_V1 — "Quan ly lop cua toi": chips lop chinh khoa + helpers (2026-10-11) */
async function pvFetchUsedIs(){
    var r = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/used/used.is?t=' + Date.now(), {cache: 'no-store'});
    if (!r.ok) throw new Error('Không tải được used.is (HTTP ' + r.status + ')');
    return r.json();
}
async function pvScanScores(){
    var tr = await (await fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1')).json();
    var files = (tr.tree || []).filter(function(t){ return t.type === 'blob' && t.path.indexOf('data/scores/') === 0 && t.path.slice(-5) === '.json'; });
    files.sort(function(a, b){ return a.path < b.path ? 1 : -1; });
    files = files.slice(0, 200);
    var all = [];
    for (var i = 0; i < files.length; i += 6){
        var rs = await Promise.all(files.slice(i, i + 6).map(function(f){
            return fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/' + f.path + '?t=' + Date.now()).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
        }));
        rs.forEach(function(d){ if (d) all.push(d); });
    }
    return all;
}
var pvTeachAssigns = [];
async function pvLoadTeachChips(){
    var box = document.getElementById('pv-teach-chips');
    if (!box) return;
    try {
        var me = (typeof currentUser !== 'undefined' && currentUser && currentUser.id) ? String(currentUser.id) : '';
        var db = await pvFetchUsedIs();
        pvTeachAssigns = (db.assignments || []).filter(function(a){
            return me && String(a.teachers || '').indexOf('(' + me + ')') >= 0;
        });
        if (!pvTeachAssigns.length){
            box.innerHTML = '<p class="text-xs text-slate-400 italic">Bạn chưa được phân công lớp chính khóa nào.</p>';
            return;
        }
        box.innerHTML = pvTeachAssigns.map(function(a, i){
            return '<button onclick="pvChipStats(' + i + ')" class="text-[11px] font-bold bg-white border border-blue-300 text-blue-800 rounded-full px-3 py-1.5 hover:bg-blue-100" title="Bấm để xem thống kê lớp này">'
                + escHtml(a.class) + ' · ' + escHtml(a.subject) + '</button>';
        }).join('');
    } catch(e){
        box.innerHTML = '<p class="text-xs text-rose-500">Lỗi tải: ' + escHtml(e.message || e) + '</p>';
    }
}
async function pvChipStats(idx){
    var a = pvTeachAssigns[idx];
    var box = document.getElementById('pv-teach-stats');
    if (!a || !box) return;
    box.innerHTML = '<p class="text-[11px] text-slate-400 italic">Đang tải thống kê lớp ' + escHtml(a.class) + '...</p>';
    try {
        var db = await pvFetchUsedIs();
        var arr = (db.students || {})[a.class] || [];
        var roster = arr.filter(function(st, i){
            if (i === 0 && /Mã định danh|Họ và tên/.test(String(st.id || '') + String(st.name || ''))) return false;
            return String(st.name || '').trim() !== '';
        });
        var all = await pvScanScores();
        var rows = roster.map(function(st){
            var nm = pvNormName(st.name), sid = String(st.id || '');
            var mine = all.filter(function(d){
                if (d.student_id && sid && String(d.student_id) === sid) return true;
                return d.student_name && pvNormName(d.student_name) === nm;
            });
            var n = mine.length, avg = 0;
            if (n){
                var sum = 0;
                mine.forEach(function(d){ var sc = parseFloat(d.score) || 0, mx = parseFloat(d.max_score) || 0; sum += (mx > 0 ? sc / mx * 10 : 0); });
                avg = sum / n;
            }
            return {name: st.name, n: n, avg: avg};
        });
        var total = rows.length, did = rows.filter(function(r){ return r.n > 0; }).length;
        var totSub = rows.reduce(function(s, r){ return s + r.n; }, 0);
        var top3 = rows.slice().sort(function(x, y){ return y.n - x.n; }).slice(0, 3).filter(function(r){ return r.n > 0; });
        var none = rows.filter(function(r){ return r.n === 0; });
        var html = '<div class="bg-blue-50/60 border border-blue-200 rounded-xl p-2.5 space-y-1">'
            + '<p class="text-[11px] font-black text-blue-800"><i class="fa-solid fa-chart-line mr-1"></i>LỚP ' + escHtml(a.class) + ' — ' + escHtml(a.subject) + ' (' + total + ' HS)</p>'
            + '<p class="text-[11px] text-slate-600">Tổng <b class="text-blue-700">' + totSub + '</b> bài đã nộp · <b class="text-blue-700">' + did + '/' + total + '</b> HS đã làm ≥1 bài</p>'
            + (top3.length ? '<p class="text-[11px] text-slate-600">🏆 Tích cực nhất: ' + top3.map(function(r){ return '<b>' + escHtml(r.name) + '</b> (' + r.n + ' bài · TB ' + r.avg.toFixed(1) + ')'; }).join(' · ') + '</p>' : '')
            + (none.length && none.length <= 30 ? '<p class="text-[11px] text-slate-500">💤 Chưa làm bài nào (' + none.length + '): ' + none.map(function(r){ return escHtml(r.name); }).join(', ') + '</p>'
                : (none.length ? '<p class="text-[11px] text-slate-500">💤 Chưa làm bài nào: ' + none.length + ' HS</p>' : ''))
            + '</div>';
        box.innerHTML = html;
        box.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    } catch(e){
        box.innerHTML = '<p class="text-[11px] text-rose-600">Lỗi: ' + escHtml(e.message || e) + '</p>';
    }
}
// Hook bo sung: khi mo tab private thi nap them chips lop chinh khoa (giu nguyen hook goc)
(function(){
    var tries = 0;
    var iv = setInterval(function(){
        tries++;
        if (window._pvHooked && !window._pvManageHooked && typeof window.switchTeacherModule === 'function'){
            window._pvManageHooked = true;
            var base = window.switchTeacherModule;
            window.switchTeacherModule = function(mod){
                base(mod);
                if (mod === 'private'){ try { pvLoadTeachChips(); } catch(e){} }
            };
            clearInterval(iv);
        }
        if (tries > 80) clearInterval(iv);
    }, 250);
})();


/* PV_EXCEL_V1 — Nhap Excel + them HS tay + modal preview (2026-10-11) */
var pvExcelState = { classId: null, rows: [] };

function pvNormPhone(s){ return String(s == null ? '' : s).replace(/[\s.\-()]/g, ''); }
function pvIsPhone(s){ return /^0\d{8,11}$/.test(pvNormPhone(s)); }

function pvBuildLookup(db){
    var byId = {}, byPhone = {};
    Object.keys(db.students || {}).forEach(function(k){
        var arr = db.students[k] || [];
        var isFree = k.slice(0, 3) === 'TD_';
        arr.forEach(function(st, idx){
            if (idx === 0 && /Mã định danh|Họ và tên/.test(String(st.id || '') + String(st.name || ''))) return;
            var id = String(st.id == null ? '' : st.id).trim();
            if (!id) return;
            if (!byId[id]) byId[id] = {id: id, name: st.name, cls: k, free: isFree};
            var ph = pvNormPhone(id);
            if (/^0\d{8,11}$/.test(ph) && !byPhone[ph]) byPhone[ph] = byId[id];
            var sph = pvNormPhone(st.phone || '');
            if (/^0\d{8,11}$/.test(sph) && !byPhone[sph]) byPhone[sph] = byId[id];
        });
    });
    Object.keys(db.passwords || {}).forEach(function(id){ if (!byId[id]) byId[id] = {id: id, name: '', cls: '', free: false}; });
    return {byId: byId, byPhone: byPhone};
}
function pvLookupStudent(lk, code){
    if (!code) return null;
    return lk.byId[code] || lk.byPhone[code] || null;
}

function pvEnsurePvModals(){
    if (document.getElementById('pv-excel-modal')) return;
    var h = ''
    + '<input type="file" id="pv-excel-file" accept=".xlsx,.xls,.csv" style="display:none">'
    + '<div id="pv-excel-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">'
    + '<div class="absolute inset-0 bg-black/50" onclick="pvCloseExcelModal()"></div>'
    + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">'
    + '<div class="bg-violet-700 text-white px-5 py-3 flex items-center justify-between shrink-0">'
    + '<h3 class="font-bold text-sm"><i class="fa-solid fa-file-excel mr-2"></i>Nhập học sinh từ Excel</h3>'
    + '<button onclick="pvCloseExcelModal()" class="text-white/80 hover:text-white text-xl leading-none px-2">&times;</button></div>'
    + '<div id="pv-excel-body" class="flex-1 overflow-y-auto p-5"></div>'
    + '<div class="px-5 py-3 bg-slate-50 border-t flex items-center justify-between gap-2 shrink-0 flex-wrap">'
    + '<button onclick="pvDownloadSample()" class="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"><i class="fa-solid fa-download mr-1"></i>📄 Tải file mẫu</button>'
    + '<div class="flex gap-2">'
    + '<button onclick="pvCloseExcelModal()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100">Hủy</button>'
    + '<button id="pv-excel-confirm" onclick="pvConfirmExcel()" class="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow"><i class="fa-solid fa-check mr-1"></i>Xác nhận thêm</button>'
    + '</div></div></div></div>'
    + '<div id="pv-manual-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">'
    + '<div class="absolute inset-0 bg-black/50" onclick="pvCloseManualModal()"></div>'
    + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">'
    + '<div class="bg-violet-700 text-white px-5 py-3 flex items-center justify-between">'
    + '<h3 class="font-bold text-sm"><i class="fa-solid fa-user-plus mr-2"></i>Thêm học sinh</h3>'
    + '<button onclick="pvCloseManualModal()" class="text-white/80 hover:text-white text-xl leading-none px-2">&times;</button></div>'
    + '<div class="p-5 space-y-3">'
    + '<div><label class="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>'
    + '<input id="pv-manual-name" type="text" placeholder="VD: Nguyễn Văn An" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"></div>'
    + '<div><label class="block text-xs font-bold text-slate-700 mb-1">SĐT / Mã HS *</label>'
    + '<input id="pv-manual-code" type="text" placeholder="VD: 0901234567" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" onkeydown="if(event.key===\'Enter\')pvSaveManual()"></div>'
    + '<p class="text-[11px] text-slate-400">Nếu SĐT/Mã đã có tài khoản, HS được liên kết vào lớp (🟢 HS trường, không tạo mới). HS chưa có TK sẽ được tạo mới (🟡 HS tự do) với MK mặc định <b>12345678</b> — nhắc HS đổi sau khi đăng nhập.</p>'
    + '</div>'
    + '<div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">'
    + '<button onclick="pvCloseManualModal()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100">Hủy</button>'
    + '<button onclick="pvSaveManual()" class="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow"><i class="fa-solid fa-check mr-1"></i>Lưu</button>'
    + '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', h);
    var fi = document.getElementById('pv-excel-file');
    if (fi) fi.addEventListener('change', pvOnExcelFile);
}

function pvExcelImport(classId){
    pvEnsurePvModals();
    if (typeof XLSX === 'undefined'){ alert('Chưa tải được thư viện đọc Excel (SheetJS). Kiểm tra mạng rồi thử lại.'); return; }
    pvExcelState.classId = classId;
    pvExcelState.rows = [];
    document.getElementById('pv-excel-file').click();
}
function pvCloseExcelModal(){ var m = document.getElementById('pv-excel-modal'); if (m) m.classList.add('hidden'); }

function pvOnExcelFile(ev){
    var f = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function(){
        try { pvParseExcel(new Uint8Array(rd.result)); }
        catch(e){ alert('Đọc file lỗi: ' + (e.message || e)); }
    };
    rd.readAsArrayBuffer(f);
}
function pvNormHead(s){
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function pvParseExcel(data){
    var wb = XLSX.read(data, {type: 'array'});
    var ws = wb.Sheets[wb.SheetNames[0]];
    var aoa = XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});
    if (!aoa.length){ alert('File trống.'); return; }
    var heads = aoa[0].map(pvNormHead);
    var NAME_H = ['hovaten', 'hoten', 'ten', 'name'];
    var ID_H = ['sdt', 'mahs', 'madinhdanh', 'id', 'phone', 'sodienthoai'];
    var ni = -1, ii = -1;
    heads.forEach(function(hh, i){
        if (ni < 0 && NAME_H.indexOf(hh) >= 0) ni = i;
        if (ii < 0 && ID_H.indexOf(hh) >= 0) ii = i;
    });
    if (ni < 0){ alert('Không tìm thấy cột Họ tên.\nCần header: "Họ và tên" / "Họ tên" / "Tên".'); return; }
    if (ii < 0){ alert('Không tìm thấy cột SĐT/Mã HS.\nCần header: "SĐT" / "Mã HS" / "Mã định danh" / "id".'); return; }
    var rows = [];
    for (var r = 1; r < aoa.length; r++){
        var name = String(aoa[r][ni] == null ? '' : aoa[r][ni]).trim();
        if (!name) continue;
        var code = String(aoa[r][ii] == null ? '' : aoa[r][ii]).trim();
        rows.push({name: name, code: code});
    }
    if (!rows.length){ alert('Không có dòng dữ liệu hợp lệ.'); return; }
    if (rows.length > 100){
        alert('File có ' + rows.length + ' HS — vượt giới hạn an toàn 100 HS/lần import.\nChỉ lấy 100 HS đầu tiên.');
        rows = rows.slice(0, 100);
    }
    pvExcelState.rows = rows;
    pvShowExcelPreview();
}
async function pvShowExcelPreview(){
    var body = document.getElementById('pv-excel-body');
    var m = document.getElementById('pv-excel-modal');
    if (m) m.classList.remove('hidden');
    if (body) body.innerHTML = '<p class="text-xs text-slate-400 italic">Đang kiểm tra trùng tài khoản...</p>';
    try {
        var db = await pvFetchUsedIs();
        var htd = await pvFetchHsTuDo();
        var lk = pvBuildLookup(db);
        var htdIds = (htd && htd.students) || {};
        function pvStatusBadge(r){
            var code = pvNormPhone(r.code);
            var found = pvLookupStudent(lk, code);
            if (!found) return '<span class="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded px-1.5 py-0.5">⚪ TK mới (trial 3 tháng)</span>';
            var isFree = found.free || !!htdIds[found.id];
            if (isFree) return '<span class="text-[10px] font-bold bg-amber-100 text-amber-800 rounded px-1.5 py-0.5">🟡 HS tự do đã có TK (liên kết)</span>';
            return '<span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5">🟢 HS trường (giữ nguyên TK)</span>';
        }
        var html = '<p class="text-xs text-slate-600 mb-2">Tìm thấy <b>' + pvExcelState.rows.length + '</b> HS. Kiểm tra trùng tài khoản:</p>'
            + '<div class="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-xl"><table class="w-full text-xs">'
            + '<thead class="bg-slate-100 sticky top-0"><tr><th class="text-left px-3 py-2">Họ và tên</th><th class="text-left px-3 py-2">SĐT/Mã</th><th class="text-left px-3 py-2">Trạng thái</th></tr></thead><tbody>'
            + pvExcelState.rows.map(function(r){
                return '<tr class="border-t border-slate-100"><td class="px-3 py-1.5 font-bold text-slate-700">' + escHtml(r.name) + '</td>'
                    + '<td class="px-3 py-1.5 text-slate-500 font-mono">' + escHtml(r.code || '—') + '</td>'
                    + '<td class="px-3 py-1.5">' + pvStatusBadge(r) + '</td></tr>';
            }).join('') + '</tbody></table></div>'
            + '<p class="text-[11px] text-slate-400 mt-2">HS trường đã có TK được <b>giữ nguyên</b> mọi thứ (loại TK, hạn dùng, mật khẩu) — chỉ liên kết vào lớp. HS tự do mới được cấp MK mặc định <b>12345678</b> (dùng thử 3 tháng).</p>';
        if (body) body.innerHTML = html;
    } catch(e){
        if (body) body.innerHTML = '<p class="text-xs text-rose-600">Lỗi kiểm tra: ' + escHtml(e.message || e) + '</p>';
    }
}
async function pvConfirmExcel(){
    if (!pvExcelState.rows.length){ alert('Chưa có dữ liệu.'); return; }
    var btn = document.getElementById('pv-excel-confirm');
    if (btn){ btn.disabled = true; btn.textContent = 'Đang thêm...'; }
    try {
        await pvUpsertStudents(pvExcelState.classId, pvExcelState.rows);
        pvCloseExcelModal();
    } catch(e){ alert('Lỗi: ' + (e.message || e)); }
    if (btn){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Xác nhận thêm'; }
}
function pvDownloadSample(){
    if (typeof XLSX === 'undefined'){ alert('Chưa tải được thư viện Excel (SheetJS). Kiểm tra mạng rồi thử lại.'); return; }
    var ws = XLSX.utils.aoa_to_sheet([
        ['Họ và tên', 'SĐT'],
        ['Nguyễn Văn An', '0901234567'],
        ['Trần Thị Bình', '0912345678'],
        ['Lê Văn Cường', '']
    ]);
    ws['!cols'] = [{wch: 24}, {wch: 16}];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HS');
    XLSX.writeFile(wb, 'mau_nhap_hs.xlsx');
}

function pvManualAdd(classId){
    pvEnsurePvModals();
    pvExcelState.classId = classId;
    var n = document.getElementById('pv-manual-name'), cd = document.getElementById('pv-manual-code');
    if (n) n.value = '';
    if (cd) cd.value = '';
    document.getElementById('pv-manual-modal').classList.remove('hidden');
    setTimeout(function(){ if (n) n.focus(); }, 100);
}
function pvCloseManualModal(){ var m = document.getElementById('pv-manual-modal'); if (m) m.classList.add('hidden'); }
async function pvSaveManual(){
    var name = (document.getElementById('pv-manual-name').value || '').trim();
    var code = (document.getElementById('pv-manual-code').value || '').trim();
    if (!name){ alert('Nhập họ tên học sinh.'); return; }
    if (!code){ alert('Nhập SĐT / Mã HS.'); return; }
    try {
        await pvUpsertStudents(pvExcelState.classId, [{name: name, code: code}]);
        pvCloseManualModal();
    } catch(e){ alert('Lỗi: ' + (e.message || e)); }
}


/* PV_UPSERT_V1 — Them HS: chong trung TK; HS moi = HS tu do -> used.is toi thieu (TD_*) + used/hs-tu-do.json + trial 3 thang (2026-10-11)
   QUY TAC CUNG (bao ve loai TK):
   - SDT/Ma trung TK da co trong used.is -> GIU NGUYEN moi thu cua TK cu (loai TK, han dung, mat khau).
     Chi them vao roster lop (linked). TUYET DOI khong ghi de account_expiry.json, khong doi password,
     khong them vao hs-tu-do.json.
   - Chi HS thuc su chua co moi duoc tao, luon la trial 3 thang (tru khi admin doi tay sau). */
async function pvFetchHsTuDo(){
    try {
        var r = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/used/hs-tu-do.json?t=' + Date.now(), {cache: 'no-store'});
        if (!r.ok) return {students: {}};
        var j = await r.json();
        if (!j || typeof j !== 'object' || !j.students || typeof j.students !== 'object') return {students: {}};
        return j;
    } catch(e){ return {students: {}}; }
}
// read-modify-write chung: doc ban moi nhat -> ap dung -> push; 409 thi doc lai 1 lan
async function pvRmwFile(fetchFn, applyFn, filePath, commitMsg){
    var lastErr = null;
    for (var a = 0; a < 2; a++){
        var data = await fetchFn();
        applyFn(data);
        try {
            await pvGasPush(filePath, JSON.stringify(data), commitMsg, 'Cap nhat ' + filePath);
            return true;
        } catch(e){
            if (String((e && e.message) || '').indexOf('409') < 0) throw e;
            lastErr = e;
        }
    }
    throw lastErr;
}
async function pvUpsertStudents(classId, rows){
    var c = pvClasses.find(function(x){ return x.id === classId; });
    if (!c){ alert('Không tìm thấy lớp.'); return; }
    var teacherName = (typeof currentUser !== 'undefined' && currentUser && currentUser.name) ? currentUser.name : 'GV';
    var teacherId = (typeof currentUser !== 'undefined' && currentUser && currentUser.id) ? String(currentUser.id) : '';
    var db0 = await pvFetchUsedIs();
    var lk0 = pvBuildLookup(db0);
    var plan = [], skipped = 0;
    rows.forEach(function(r){
        var name = String(r.name == null ? '' : r.name).trim();
        if (!name){ skipped++; return; }
        var code = pvNormPhone(r.code == null ? '' : r.code);
        var found = pvLookupStudent(lk0, code);
        var sid;
        if (found) sid = found.id;
        else if (/^0\d{8,11}$/.test(code)) sid = code;
        else sid = 'hs_' + classId + '_' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
        plan.push({name: name, code: code, sid: sid, found: found, phone: (/^0\d{8,11}$/.test(code) ? code : '')});
    });
    if (!plan.length){ alert('Không có học sinh hợp lệ để thêm.'); return; }
    var classKey = 'TD_' + teacherId + '_' + classId;
    var nowIso = new Date().toISOString();
    var trialExp = new Date(Date.now() + 90 * 86400000).toISOString();
    var HEADER = {id: 'Mã định danh Bộ GD&ĐT', name: 'Họ và tên', dob: 'Ngày sinh'};
    function applyUsedIs(db){
        db.students = db.students || {};
        db.passwords = db.passwords || {};
        if (!db.students[classKey]) db.students[classKey] = [HEADER];
        var linked = 0, created = 0;
        plan.forEach(function(p){
            // QUY TAC CUNG: TK da co -> chi dem linked, KHONG dung cham gi den used.is (password giu nguyen)
            if (p.found){ linked++; return; }
            var arr = db.students[classKey];
            var exists = db.passwords[p.sid] || arr.some(function(st){ return String(st.id) === p.sid; });
            if (!exists){
                var entry = {id: p.sid, name: p.name, dob: ''};
                if (p.phone) entry.phone = p.phone;
                arr.push(entry);
                db.passwords[p.sid] = '12345678';
                created++;
            } else { linked++; }
        });
        return {linked: linked, created: created};
    }
    function applyHsTuDo(h){
        h.students = h.students || {};
        plan.forEach(function(p){
            if (p.found) return;
            if (!h.students[p.sid]){
                h.students[p.sid] = {
                    name: p.name, phone: p.phone, class_key: classKey,
                    teacher_id: teacherId, created_at: nowIso, password: '12345678'
                };
            }
        });
    }
    function applyExpiry(exp){
        plan.forEach(function(p){
            if (p.found) return;
            if (!exp[p.sid]){
                exp[p.sid] = {
                    expires_at: trialExp, type: 'trial',
                    note: 'HS tự do — lớp ' + c.name,
                    created_at: nowIso, created_by: teacherName
                };
            }
        });
    }
    var info = applyUsedIs(await pvFetchUsedIs());
    await pvRmwFile(pvFetchUsedIs, applyUsedIs, 'used/used.is', 'Them HS lop ' + c.name + ' (' + teacherName + ')');
    await pvRmwFile(pvFetchHsTuDo, applyHsTuDo, 'used/hs-tu-do.json', 'Them HS tu do lop ' + c.name + ' (' + teacherName + ')');
    await pvRmwFile(pvFetchExpiry, applyExpiry, 'used/account_expiry.json', 'Trial 3 thang cho HS moi lop ' + c.name);
    pvExpiryCache = null;
    c.students = c.students || [];
    var have = {};
    c.students.forEach(function(st){ have[String(st.id)] = 1; });
    plan.forEach(function(p){
        if (have[p.sid]) return;
        c.students.push({id: p.sid, name: (p.found && p.found.name) || p.name, linked: !!p.found, isNew: !p.found});
        have[p.sid] = 1;
    });
    await pvSaveClasses();
    renderPrivateClasses();
    var msg = 'Đã thêm ' + plan.length + ' HS (' + info.linked + ' 🟢 HS trường được liên kết, ' + info.created + ' 🟡 HS tự do mới — MK mặc định 12345678, dùng thử 3 tháng, nhắc HS đổi MK sau khi đăng nhập)';
    if (skipped) msg += ' · Bỏ qua ' + skipped + ' dòng trống';
    if (typeof showToast === 'function') showToast(msg, 'success'); else alert(msg);
}


/* PV_EXPIRY_V1 — Admin gia han TK: ca lop / tung HS, hien thi han (2026-10-11) */
var pvExpiryCache = null;
var pvExpiryTarget = null;

function pvIsAdmin(){
    return (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin');
}
async function pvFetchExpiry(){
    try {
        var r = await fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/used/account_expiry.json?t=' + Date.now(), {cache: 'no-store'});
        if (!r.ok) return {};
        var j = await r.json();
        return (j && typeof j === 'object') ? j : {};
    } catch(e){ return {}; }
}
async function pvLoadExpiry(){
    pvExpiryCache = await pvFetchExpiry();
    if (document.getElementById('pv-class-list')) renderPrivateClasses();
}
function pvFmtDate(iso){
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var p = function(n){ return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}
function pvExpiryLabel(id){
    var e = (pvExpiryCache || {})[String(id)];
    if (!e) return '';
    if (!e.expires_at) return ' <span class="text-[10px] text-emerald-600 font-bold" title="Tài khoản không thời hạn">· Không thời hạn</span>';
    var t = new Date(e.expires_at).getTime();
    if (isNaN(t)) return '';
    var d = Math.ceil((t - Date.now()) / 86400000);
    var ds = pvFmtDate(e.expires_at);
    var txt = d < 0 ? 'đã hết hạn ' + ds : 'hết hạn ' + ds;
    var cls = d < 0 ? 'text-rose-700' : (d <= 15 ? 'text-rose-600' : (d <= 30 ? 'text-amber-600' : 'text-slate-500'));
    return ' <span class="text-[10px] ' + cls + ' font-bold" title="' + escHtml(txt) + '">· ' + escHtml(txt) + '</span>';
}
function pvVisibleClasses(){
    var list = pvMyClasses();
    if (pvIsAdmin()){
        var sel = document.getElementById('pv-teacher-filter');
        var v = sel ? (sel.getAttribute('data-v') || '') : '';
        if (v) list = list.filter(function(c){ return String(c.teacher_id) === v; });
    }
    return list;
}
function pvRenderTeacherFilter(){
    var wrap = document.getElementById('pv-admin-filter-wrap');
    var sel = document.getElementById('pv-teacher-filter');
    if (!wrap || !sel) return;
    wrap.classList.toggle('hidden', !pvIsAdmin());
    if (!pvIsAdmin()) return;
    var teachers = {};
    (pvClasses || []).forEach(function(x){
        if (x.teacher_id && !teachers[x.teacher_id]) teachers[x.teacher_id] = x.teacher_name || x.teacher_id;
    });
    var ids = Object.keys(teachers).sort();
    var prev = sel.getAttribute('data-v') || '';
    if (ids.indexOf(prev) < 0) prev = '';
    sel.innerHTML = '<option value="">Tất cả GV (' + pvClasses.length + ' lớp)</option>' + ids.map(function(id){
        var n = (pvClasses || []).filter(function(x){ return String(x.teacher_id) === id; }).length;
        return '<option value="' + escHtml(id) + '"' + (id === prev ? ' selected' : '') + '>' + escHtml(teachers[id]) + ' — ' + n + ' lớp</option>';
    }).join('');
    sel.setAttribute('data-v', prev);
    sel.onchange = function(){ sel.setAttribute('data-v', sel.value); renderPrivateClasses(); };
}

function pvEnsureExpiryModal(){
    if (document.getElementById('pv-expiry-modal')) return;
    var h = ''
    + '<div id="pv-expiry-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">'
    + '<div class="absolute inset-0 bg-black/50" onclick="pvCloseExpiryModal()"></div>'
    + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">'
    + '<div class="bg-amber-600 text-white px-5 py-3 flex items-center justify-between">'
    + '<h3 class="font-bold text-sm">⏳ Gia hạn tài khoản</h3>'
    + '<button onclick="pvCloseExpiryModal()" class="text-white/80 hover:text-white text-xl leading-none px-2">&times;</button></div>'
    + '<div class="p-5 space-y-3">'
    + '<p id="pv-expiry-target" class="text-xs text-slate-600"></p>'
    + '<div><label class="block text-xs font-bold text-slate-700 mb-1.5">Thời hạn mới (tính từ hôm nay):</label>'
    + '<div class="space-y-1.5 text-sm">'
    + '<label class="flex items-center gap-2"><input type="radio" name="pv-exp-dur" value="30"> 1 tháng</label>'
    + '<label class="flex items-center gap-2"><input type="radio" name="pv-exp-dur" value="90" checked> 3 tháng</label>'
    + '<label class="flex items-center gap-2"><input type="radio" name="pv-exp-dur" value="180"> 6 tháng</label>'
    + '<label class="flex items-center gap-2"><input type="radio" name="pv-exp-dur" value="365"> 1 năm</label>'
    + '<label class="flex items-center gap-2"><input type="radio" name="pv-exp-dur" value="0"> Không thời hạn</label>'
    + '</div></div></div>'
    + '<div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">'
    + '<button onclick="pvCloseExpiryModal()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100">Hủy</button>'
    + '<button id="pv-expiry-confirm" onclick="pvConfirmExpiry()" class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow"><i class="fa-solid fa-check mr-1"></i>Xác nhận</button>'
    + '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', h);
}
function pvExtendClass(classId){
    if (!pvIsAdmin()){ alert('Chỉ quản trị viên mới gia hạn được.'); return; }
    var c = pvClasses.find(function(x){ return x.id === classId; });
    if (!c) return;
    pvEnsureExpiryModal();
    pvExpiryTarget = {classId: classId, stuId: null};
    var t = document.getElementById('pv-expiry-target');
    if (t) t.innerHTML = 'Gia hạn cho <b>' + (c.students || []).length + '</b> HS trong lớp <b>' + escHtml(c.name) + '</b>.';
    document.getElementById('pv-expiry-modal').classList.remove('hidden');
}
function pvExtendOne(classId, stuId){
    if (!pvIsAdmin()){ alert('Chỉ quản trị viên mới gia hạn được.'); return; }
    var c = pvClasses.find(function(x){ return x.id === classId; });
    if (!c) return;
    var st = (c.students || []).find(function(s){ return String(s.id) === String(stuId); });
    pvEnsureExpiryModal();
    pvExpiryTarget = {classId: classId, stuId: String(stuId)};
    var t = document.getElementById('pv-expiry-target');
    if (t) t.innerHTML = 'Gia hạn cho HS <b>' + escHtml(st ? st.name : stuId) + '</b> (lớp ' + escHtml(c.name) + ').';
    document.getElementById('pv-expiry-modal').classList.remove('hidden');
}
function pvCloseExpiryModal(){ var m = document.getElementById('pv-expiry-modal'); if (m) m.classList.add('hidden'); }
async function pvConfirmExpiry(){
    var t = pvExpiryTarget;
    if (!t){ pvCloseExpiryModal(); return; }
    var dur = 90;
    var rs = document.getElementsByName('pv-exp-dur');
    for (var i = 0; i < rs.length; i++) if (rs[i].checked) dur = parseInt(rs[i].value, 10);
    var c = pvClasses.find(function(x){ return x.id === t.classId; });
    if (!c){ alert('Không tìm thấy lớp.'); return; }
    var ids = t.stuId ? [t.stuId] : (c.students || []).map(function(s){ return String(s.id); });
    if (!ids.length){ alert('Lớp chưa có học sinh.'); return; }
    var newExp = dur === 0 ? null : new Date(Date.now() + dur * 86400000).toISOString();
    var byName = (typeof currentUser !== 'undefined' && currentUser && currentUser.name) ? currentUser.name : 'admin';
    function applyExp(exp){
        ids.forEach(function(id){
            var e = exp[id] || {};
            e.expires_at = newExp;
            if (!e.type) e.type = 'trial';
            e.updated_at = new Date().toISOString();
            e.updated_by = byName;
            exp[id] = e;
        });
    }
    var btn = document.getElementById('pv-expiry-confirm');
    if (btn){ btn.disabled = true; btn.textContent = 'Đang lưu...'; }
    try {
        await pvRmwFile(pvFetchExpiry, applyExp, 'used/account_expiry.json', 'Gia han ' + ids.length + ' TK (' + byName + ')');
        pvExpiryCache = null;
        pvCloseExpiryModal();
        renderPrivateClasses();
        var durLabel = dur === 0 ? 'không thời hạn' : (dur === 30 ? '1 tháng' : (dur === 90 ? '3 tháng' : (dur === 180 ? '6 tháng' : (dur === 365 ? '1 năm' : dur + ' ngày'))));
        var msg = 'Đã gia hạn ' + ids.length + ' tài khoản (' + durLabel + ').';
        if (typeof showToast === 'function') showToast(msg, 'success'); else alert(msg);
    } catch(e){ alert('Lỗi: ' + (e.message || e)); }
    if (btn){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Xác nhận'; }
}


/* PV_DANGER_V1 — Vung nguy hiem (admin): xoa toan bo TK HS truong, refresh TK test (2026-10-11) */
async function pvGasDelete(filePath, commitMessage){
    var r = await fetch(PV_GAS_URL, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({type: 'DELETE_FROM_GITHUB', filePath: filePath, commitMessage: commitMessage})
    });
    var rj = null;
    try { rj = await r.json(); } catch(e){}
    if (!rj || rj.status !== 'success') throw new Error((rj && rj.message) || ('Xóa thất bại: ' + filePath));
    return true;
}
function pvRenderDangerZone(){
    var dz = document.getElementById('pv-danger-zone');
    if (!dz) return;
    dz.classList.toggle('hidden', !pvIsAdmin());
}
// Lop HS truong = key khong co tien to TD_
function pvSchoolClasses(db){
    return Object.keys(db.students || {}).filter(function(k){ return k.slice(0, 3) !== 'TD_'; });
}
function pvCollectSchoolStudents(db){
    var ids = [], names = {}, classes = pvSchoolClasses(db);
    classes.forEach(function(k){
        (db.students[k] || []).forEach(function(st, idx){
            if (idx === 0 && /Mã định danh|Họ và tên/.test(String(st.id || '') + String(st.name || ''))) return;
            var id = String(st.id == null ? '' : st.id).trim();
            if (!id) return;
            ids.push(id);
            names[pvNormName(st.name)] = true;
        });
    });
    return {ids: ids, names: names, classes: classes};
}
// Quet data/scores/*, tra ve path cac file cua tap HS.
// strictId=true: chi khop theo student_id (dung khi xoa TK tu do — tranh xoa nham theo ten).
async function pvFindScoreFiles(idSet, nameSet, onProgress, strictId){
    var tr = await (await fetch('https://api.github.com/repos/saobay/saobay.github.io/git/trees/main?recursive=1')).json();
    var files = (tr.tree || []).filter(function(t){ return t.type === 'blob' && t.path.indexOf('data/scores/') === 0 && t.path.slice(-5) === '.json'; });
    var hit = [];
    for (var i = 0; i < files.length; i += 6){
        if (onProgress) onProgress(i, files.length);
        var batch = files.slice(i, i + 6);
        var rs = await Promise.all(batch.map(function(f){
            return fetch('https://raw.githubusercontent.com/saobay/saobay.github.io/main/' + f.path + '?t=' + Date.now()).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
        }));
        rs.forEach(function(d, j){
            if (!d) return;
            var sid = String(d.student_id || '');
            var match = (sid && idSet[sid]) || (!strictId && !sid && d.student_name && nameSet[pvNormName(d.student_name)]);
            if (match) hit.push(files[i + j].path);
        });
    }
    return hit;
}
// Tap id/sdt cua HS TRUONG (lop khong co tien to TD_) — dung de phan biet khi xoa lop
function pvSchoolIdSets(db){
    var ids = {}, phones = {};
    Object.keys(db.students || {}).forEach(function(k){
        if (k.slice(0, 3) === 'TD_') return;
        (db.students[k] || []).forEach(function(st, idx){
            if (idx === 0 && /Mã định danh|Họ và tên/.test(String(st.id || '') + String(st.name || ''))) return;
            var sid = String(st.id == null ? '' : st.id).trim();
            if (sid) ids[sid] = true;
            var ph = pvNormPhone(st.phone || '');
            if (/^0\d{8,11}$/.test(ph)) phones[ph] = true;
            var ph2 = pvNormPhone(sid);
            if (/^0\d{8,11}$/.test(ph2)) phones[ph2] = true;
        });
    });
    return {ids: ids, phones: phones};
}
function pvEnsureDangerModal(){
    if (document.getElementById('pv-danger-modal')) return;
    var h = ''
    + '<div id="pv-danger-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">'
    + '<div class="absolute inset-0 bg-black/50" onclick="pvCloseDangerModal()"></div>'
    + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">'
    + '<div class="bg-red-700 text-white px-5 py-3 flex items-center justify-between shrink-0">'
    + '<h3 id="pv-danger-title" class="font-bold text-sm">⚠️ Vùng nguy hiểm</h3>'
    + '<button onclick="pvCloseDangerModal()" class="text-white/80 hover:text-white text-xl leading-none px-2">&times;</button></div>'
    + '<div id="pv-danger-body" class="flex-1 overflow-y-auto p-5"></div>'
    + '<div id="pv-danger-foot" class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2 shrink-0"></div>'
    + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', h);
}
function pvDangerShow(bodyHtml, title, footHtml){
    var m = document.getElementById('pv-danger-modal');
    if (!m) return;
    document.getElementById('pv-danger-title').textContent = title || '⚠️ Vùng nguy hiểm';
    document.getElementById('pv-danger-body').innerHTML = bodyHtml || '';
    document.getElementById('pv-danger-foot').innerHTML = footHtml || '';
    m.classList.remove('hidden');
}
function pvCloseDangerModal(){ var m = document.getElementById('pv-danger-modal'); if (m) m.classList.add('hidden'); }

// ---------- XOA TOAN BO TK HS TRUONG ----------
var pvWipePlan = null;
async function pvWipeStep1(){
    if (!pvIsAdmin()){ alert('Chỉ quản trị viên mới dùng được chức năng này.'); return; }
    pvEnsureDangerModal();
    pvDangerShow('<p class="text-xs text-slate-400 italic">Đang tính toán...</p>', '🗑 Xóa toàn bộ TK HS trường — Bước 1/2', '');
    try {
        var db = await pvFetchUsedIs();
        var col = pvCollectSchoolStudents(db);
        pvWipePlan = col;
        var html = '<div class="space-y-3">'
            + '<div class="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">'
            + '<p class="font-black mb-1">⚠️ CẢNH BÁO: Hành động không thể hoàn tác!</p>'
            + '<p>Sẽ xóa <b>' + col.ids.length + '</b> tài khoản HS trường (' + col.classes.length + ' lớp), mật khẩu, hạn dùng, bài nộp và điểm liên quan của các HS này.</p>'
            + '<p class="mt-1">GIỮ LẠI: GV, BGH, admin, HS tự do (lớp TD_*), toàn bộ <b>used/hs-tu-do.json</b>.</p></div>'
            + '<div><label class="block text-xs font-bold text-slate-700 mb-1">Nhập đúng chữ <b class="font-mono bg-slate-100 px-1.5 py-0.5 rounded">XAC NHAN</b> để tiếp tục:</label>'
            + '<input id="pv-wipe-input" type="text" autocomplete="off" class="w-full px-3 py-2 border border-red-300 rounded-xl text-sm font-mono" oninput="pvWipeCheck(this)"></div>'
            + '</div>';
        var foot = '<button onclick="pvCloseDangerModal()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100">Hủy</button>'
            + '<button id="pv-wipe-next" onclick="pvWipeStep2()" disabled class="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold shadow disabled:opacity-40">Tiếp tục →</button>';
        pvDangerShow(html, '🗑 Xóa toàn bộ TK HS trường — Bước 1/2', foot);
        setTimeout(function(){ var i = document.getElementById('pv-wipe-input'); if (i) i.focus(); }, 100);
    } catch(e){ pvDangerShow('<p class="text-xs text-rose-600">Lỗi: ' + escHtml(e.message || e) + '</p>'); }
}
function pvWipeCheck(inp){
    var b = document.getElementById('pv-wipe-next');
    if (b) b.disabled = (inp.value.trim() !== 'XAC NHAN');
}
async function pvWipeStep2(){
    var col = pvWipePlan;
    if (!col){ pvCloseDangerModal(); return; }
    pvDangerShow('<p class="text-xs text-slate-400 italic">Đang quét file điểm trong data/scores/...</p>', '🗑 Xóa toàn bộ TK HS trường — Bước 2/2', '');
    try {
        var idSet = {};
        col.ids.forEach(function(id){ idSet[id] = true; });
        var files = await pvFindScoreFiles(idSet, col.names, function(i, n){
            var b = document.getElementById('pv-danger-body');
            if (b) b.innerHTML = '<p class="text-xs text-slate-400 italic">Đang quét file điểm... ' + i + '/' + n + '</p>';
        });
        col.scoreFiles = files;
        var html = '<div class="space-y-2 text-xs text-slate-700">'
            + '<p class="font-bold">Tóm tắt lần cuối trước khi xóa <b class="text-red-700">VĨNH VIỄN</b>:</p>'
            + '<ul class="list-disc pl-5 space-y-1">'
            + '<li><b>' + col.ids.length + '</b> tài khoản HS trường (' + col.classes.length + ' lớp) trong used.is</li>'
            + '<li><b>' + col.ids.length + '</b> mật khẩu + hạn dùng tương ứng</li>'
            + '<li><b>' + files.length + '</b> file bài nộp trong data/scores/</li>'
            + '<li>Roster các lớp dạy thêm: gỡ HS đã bị xóa</li>'
            + '</ul>'
            + '<p class="text-amber-700">Lưu ý: điểm thưởng vòng quay lưu ở localStorage từng máy — không xóa được từ xa.</p>'
            + '</div>';
        var foot = '<button onclick="pvWipeStep1()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100">← Quay lại</button>'
            + '<button id="pv-wipe-go" onclick="pvWipeExecute()" class="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold shadow">Tôi chắc chắn, XÓA NGAY</button>';
        pvDangerShow(html, '🗑 Xóa toàn bộ TK HS trường — Bước 2/2', foot);
    } catch(e){ pvDangerShow('<p class="text-xs text-rose-600">Lỗi: ' + escHtml(e.message || e) + '</p>'); }
}
async function pvWipeExecute(){
    var col = pvWipePlan;
    if (!col) return;
    var btn = document.getElementById('pv-wipe-go');
    if (btn){ btn.disabled = true; btn.textContent = 'Đang xóa...'; }
    var logs = [];
    function say(m){
        logs.push(m);
        var b = document.getElementById('pv-danger-body');
        if (b) b.innerHTML = '<div class="text-xs space-y-1">' + logs.map(function(x){ return '<p>' + x + '</p>'; }).join('') + '</div>';
    }
    try {
        var adminName = (typeof currentUser !== 'undefined' && currentUser && currentUser.name) ? currentUser.name : 'admin';
        say('1/4 Đang tải used.is mới nhất...');
        var db = await pvFetchUsedIs();
        var colNow = pvCollectSchoolStudents(db);
        var delSet = {};
        colNow.ids.forEach(function(id){ delSet[id] = true; });
        colNow.classes.forEach(function(k){ delete db.students[k]; });
        Object.keys(db.students).forEach(function(k){
            db.students[k] = (db.students[k] || []).filter(function(st, idx){
                if (idx === 0) return true;
                return !delSet[String(st.id)];
            });
        });
        Object.keys(delSet).forEach(function(id){ delete db.passwords[id]; });
        say('2/4 Đang ghi used.is — xóa ' + colNow.ids.length + ' TK (' + colNow.classes.length + ' lớp)...');
        await pvGasPush('used/used.is', JSON.stringify(db),
            'XOA TOAN BO TK HS TRUONG (' + colNow.ids.length + ' TK, ' + colNow.classes.length + ' lop) - ' + adminName,
            'Xoa TK HS truong');
        say('3/4 Đang xóa hạn dùng tương ứng...');
        await pvRmwFile(pvFetchExpiry, function(exp){
            Object.keys(delSet).forEach(function(id){ delete exp[id]; });
        }, 'used/account_expiry.json', 'Xoa han TK HS truong (' + colNow.ids.length + ' TK) - ' + adminName);
        var idSet = {}, nameSet = colNow.names;
        colNow.ids.forEach(function(id){ idSet[id] = true; });
        say('4/4 Đang quét & xóa file điểm...');
        var files = await pvFindScoreFiles(idSet, nameSet, function(i, n){ say('4/4 Đang quét file điểm... ' + i + '/' + n); });
        var delOk = 0, delFail = 0;
        for (var i = 0; i < files.length; i++){
            try { await pvGasDelete(files[i], 'Xoa file diem HS truong - ' + adminName); delOk++; }
            catch(e){ delFail++; }
            if (i % 5 === 4) say('4/4 Đang xóa file điểm... ' + (i + 1) + '/' + files.length);
        }
        var touched = 0;
        (pvClasses || []).forEach(function(c){
            var before = (c.students || []).length;
            c.students = (c.students || []).filter(function(st){ return !delSet[String(st.id)]; });
            if (c.students.length !== before) touched++;
        });
        if (touched) await pvSaveClasses();
        pvExpiryCache = null;
        pvWipePlan = null;
        say('<b class="text-emerald-700">✅ XONG:</b> đã xóa ' + colNow.ids.length + ' TK HS trường, ' + delOk + ' file điểm' + (delFail ? ' (' + delFail + ' file lỗi)' : '') + ', cập nhật ' + touched + ' lớp dạy thêm.');
        renderPrivateClasses();
    } catch(e){
        say('<b class="text-rose-700">❌ Lỗi:</b> ' + escHtml(e.message || e));
    }
}

// ---------- REFRESH TK TEST ----------
async function pvRefreshTestStep1(){
    if (!pvIsAdmin()){ alert('Chỉ quản trị viên mới dùng được chức năng này.'); return; }
    pvEnsureDangerModal();
    pvDangerShow('<p class="text-xs text-slate-400 italic">Đang tìm TK test...</p>', '🧹 Refresh TK test', '');
    try {
        var exp = await pvFetchExpiry();
        var ids = Object.keys(exp).filter(function(id){
            var e = exp[id] || {};
            return /test/i.test(String(e.note || '')) || String(e.created_by || '').toLowerCase() === 'test';
        });
        if (!ids.length){
            pvDangerShow('<p class="text-xs text-slate-500">Không tìm thấy TK test nào.<br>Tiêu chí: <b>note</b> chứa "test" (không phân biệt hoa thường) hoặc <b>created_by</b> = "test" trong used/account_expiry.json.</p>',
                '🧹 Refresh TK test',
                '<button onclick="pvCloseDangerModal()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600">Đóng</button>');
            return;
        }
        var db = await pvFetchUsedIs();
        var lk = pvBuildLookup(db);
        var rows = ids.map(function(id){
            var f = lk.byId[id];
            var nm = f ? f.name : '';
            return '<label class="flex items-center gap-2 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-slate-50">'
                + '<input type="checkbox" class="pv-test-cb" value="' + escHtml(id) + '" checked>'
                + '<span class="font-bold text-slate-700">' + escHtml(nm || id) + '</span>'
                + '<span class="text-slate-400 font-mono">' + escHtml(id) + '</span></label>';
        }).join('');
        var html = '<p class="text-xs text-slate-600 mb-2">Tìm thấy <b>' + ids.length + '</b> TK test. Refresh = reset MK về <b>12345678</b> + xóa bài nộp trên server (giữ nguyên tên, lớp).</p>'
            + '<p class="text-[11px] text-amber-700 mb-2">⚠️ Điểm thưởng vòng quay lưu ở localStorage từng máy — không xóa được từ xa.</p>'
            + '<div class="space-y-1.5 max-h-[40vh] overflow-y-auto">' + rows + '</div>';
        var foot = '<button onclick="pvCloseDangerModal()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100">Hủy</button>'
            + '<button onclick="pvRefreshTestExecute()" class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow">Refresh đã chọn</button>';
        pvDangerShow(html, '🧹 Refresh TK test', foot);
    } catch(e){ pvDangerShow('<p class="text-xs text-rose-600">Lỗi: ' + escHtml(e.message || e) + '</p>'); }
}
async function pvRefreshTestExecute(){
    var cbs = document.querySelectorAll('.pv-test-cb:checked');
    var ids = [];
    for (var i = 0; i < cbs.length; i++) ids.push(cbs[i].value);
    if (!ids.length){ alert('Chưa chọn TK nào.'); return; }
    if (!confirm('Refresh ' + ids.length + ' TK test?\n\n- MK → 12345678\n- Xóa bài nộp trên server\n- Giữ nguyên tên, lớp')) return;
    pvDangerShow('<p class="text-xs text-slate-400 italic">Đang refresh...</p>', '🧹 Refresh TK test', '');
    try {
        var adminName = (typeof currentUser !== 'undefined' && currentUser && currentUser.name) ? currentUser.name : 'admin';
        var db = await pvFetchUsedIs();
        var lk = pvBuildLookup(db);
        var idSet = {}, nameSet = {};
        ids.forEach(function(id){
            idSet[id] = true;
            var f = lk.byId[id];
            if (f && f.name) nameSet[pvNormName(f.name)] = true;
        });
        await pvRmwFile(pvFetchUsedIs, function(d){
            d.passwords = d.passwords || {};
            ids.forEach(function(id){ d.passwords[id] = '12345678'; });
        }, 'used/used.is', 'Refresh TK test: reset MK ' + ids.length + ' TK - ' + adminName);
        var files = await pvFindScoreFiles(idSet, nameSet, null);
        var ok = 0, fail = 0;
        for (var i = 0; i < files.length; i++){
            try { await pvGasDelete(files[i], 'Refresh TK test: xoa file diem - ' + adminName); ok++; }
            catch(e){ fail++; }
        }
        pvDangerShow('<p class="text-xs text-slate-700"><b class="text-emerald-700">✅ XONG:</b> đã refresh ' + ids.length + ' TK test (MK → 12345678), xóa ' + ok + ' file điểm' + (fail ? ' (' + fail + ' lỗi)' : '') + '.</p>'
            + '<p class="text-[11px] text-amber-700 mt-1">Lưu ý: điểm thưởng vòng quay nằm ở localStorage từng máy, không xóa được từ xa.</p>',
            '🧹 Refresh TK test',
            '<button onclick="pvCloseDangerModal()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-600">Đóng</button>');
    } catch(e){
        pvDangerShow('<p class="text-xs text-rose-600">Lỗi: ' + escHtml(e.message || e) + '</p>');
    }
}
