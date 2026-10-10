// ========================================================
// THỐNG KÊ NHÓM GV TỰ DO (admin) — 2026-10-10
// ========================================================
(function(){
    let _groupsData = null;  // [{num, name, members:[{id,name,phone}]}]
    let _examReg = null;
    let _classes = null;

    function _tgNum(gn){
        var m = String(gn || '').match(/([0-9]+)/);
        return m ? parseInt(m[1], 10) : 0;
    }

    async function _loadGroupsData(){
        if (_groupsData) return _groupsData;
        _groupsData = [];
        try {
            let url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/' + GITHUB_CONFIG.branch + '/used/used.is';
            let r = await fetch(url, { cache: 'no-store' });
            if (r.ok){
                let db = await r.json();
                let treg = db.teachers_registry || {};
                let gmap = {};
                Object.keys(treg).forEach(function(tid){
                    let t = treg[tid] || {};
                    let id = String(tid);
                    let isFree = /^0[0-9]{8,11}$/.test(id) || id.indexOf('@') >= 0;
                    if (t.role === 'teacher' && isFree && t.teacher_group){
                        let gn = t.teacher_group;
                        if (!gmap[gn]) gmap[gn] = [];
                        gmap[gn].push({ id: id, name: t.name || id, phone: t.phone || id });
                    }
                });
                Object.keys(gmap).sort(function(a,b){ return _tgNum(a) - _tgNum(b); }).forEach(function(gn){
                    _groupsData.push({ num: _tgNum(gn), name: gn, members: gmap[gn] });
                });
            }
        } catch(e){ console.error('[groups] load teachers:', e); }
        return _groupsData;
    }

    async function _loadExamReg(){
        if (_examReg) return _examReg;
        _examReg = {};
        try {
            let url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/' + GITHUB_CONFIG.branch + '/data/exam-registry.json';
            let r = await fetch(url, { cache: 'no-store' });
            if (r.ok) _examReg = await r.json();
        } catch(e){ _examReg = {}; }
        return _examReg;
    }

    async function _loadClasses(){
        if (_classes) return _classes;
        _classes = [];
        try {
            let url = 'https://raw.githubusercontent.com/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/' + GITHUB_CONFIG.branch + '/data/private/classes.json?t=' + Date.now();
            let r = await fetch(url, { cache: 'no-store' });
            if (r.ok){
                let j = await r.json();
                _classes = j.classes || [];
            }
        } catch(e){ _classes = []; }
        return _classes;
    }

    function _teacherOwnerIds(tid, tname){
        // Các owner_id có thể có: SĐT, TD_<sdt>, tên
        let ids = [String(tid)];
        if (/^0[0-9]/.test(String(tid))) ids.push('TD_' + tid);
        return ids;
    }

    window.renderGroupStats = async function(){
        let sel = document.getElementById('groups-select');
        let listEl = document.getElementById('groups-stats-list');
        let countEl = document.getElementById('groups-count');
        if (!sel || !listEl) return;

        // Nạp dropdown lần đầu
        if (sel.options.length <= 1){
            let groups = await _loadGroupsData();
            groups.forEach(function(g){
                let o = document.createElement('option');
                o.value = g.num;
                o.textContent = g.name + ' (' + g.members.length + ' GV)';
                sel.appendChild(o);
            });
            if (countEl) countEl.textContent = groups.length + ' nhóm';
        }

        let gnum = parseInt(sel.value, 10) || 0;
        if (!gnum){
            listEl.innerHTML = '<p class="text-xs text-slate-400 italic p-4">Chọn nhóm để xem thống kê.</p>';
            return;
        }

        listEl.innerHTML = '<p class="text-xs text-slate-400 italic p-4">Đang tải thống kê...</p>';

        let groups = await _loadGroupsData();
        let examReg = await _loadExamReg();
        let classes = await _loadClasses();

        let g = groups.find(function(x){ return x.num === gnum; });
        if (!g){
            listEl.innerHTML = '<p class="text-xs text-red-500 p-4">Không tìm thấy nhóm.</p>';
            return;
        }

        // Tính thống kê từng GV
        let rows = g.members.map(function(m){
            let oids = _teacherOwnerIds(m.id, m.name);
            let lessons = 0, exams = 0;

            // Đếm từ exam-registry
            Object.keys(examReg).forEach(function(fp){
                let o = examReg[fp] || {};
                if (oids.indexOf(String(o.owner_id)) >= 0){
                    // Phân biệt bài học vs đề thi (nếu có type)
                    if (o.type === 'exam' || /exam|dethi/i.test(fp)) exams++;
                    else lessons++;
                }
            });

            // Đếm lớp học thêm
            let myClasses = classes.filter(function(c){
                let ctid = String(c.teacher_id || '');
                return oids.indexOf(ctid) >= 0 || ctid === String(m.id);
            });
            let totalStudents = 0;
            myClasses.forEach(function(c){
                totalStudents += (c.students || []).length;
            });

            return {
                name: m.name, id: m.id,
                lessons: lessons, exams: exams,
                classCount: myClasses.length,
                studentCount: totalStudents
            };
        });

        // Render bảng
        let html = '<div class="overflow-x-auto"><table class="w-full text-xs border-collapse">';
        html += '<thead><tr class="bg-violet-50 text-violet-900">'
            + '<th class="border px-2 py-2 text-left">STT</th>'
            + '<th class="border px-2 py-2 text-left">Giáo viên</th>'
            + '<th class="border px-2 py-2 text-center">Bài học</th>'
            + '<th class="border px-2 py-2 text-center">Đề thi</th>'
            + '<th class="border px-2 py-2 text-center">Lớp học thêm</th>'
            + '<th class="border px-2 py-2 text-center">Tổng HS</th>'
            + '</tr></thead><tbody>';
        rows.forEach(function(r, i){
            html += '<tr class="hover:bg-slate-50">'
                + '<td class="border px-2 py-2">' + (i+1) + '</td>'
                + '<td class="border px-2 py-2 font-bold">' + r.name + '<br><span class="text-[10px] text-slate-500 font-normal">' + r.id + '</span></td>'
                + '<td class="border px-2 py-2 text-center">' + r.lessons + '</td>'
                + '<td class="border px-2 py-2 text-center">' + r.exams + '</td>'
                + '<td class="border px-2 py-2 text-center">' + r.classCount + '</td>'
                + '<td class="border px-2 py-2 text-center font-bold text-blue-700">' + r.studentCount + '</td>'
                + '</tr>';
        });
        html += '</tbody></table></div>';
        listEl.innerHTML = html;
    };

    // Hiện tab Nhóm GV chỉ cho admin
    function _showGroupsTabIfAdmin(){
        try {
            if (typeof currentUser !== 'undefined' && currentUser.role === 'admin'){
                let b = document.getElementById('mod-tab-groups');
                if (b) b.style.display = '';
            }
        } catch(e){}
    }
    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', _showGroupsTabIfAdmin);
    } else { _showGroupsTabIfAdmin(); }
    // Thử lại sau 2s (đề phòng currentUser chưa load)
    setTimeout(_showGroupsTabIfAdmin, 2000);
})();
