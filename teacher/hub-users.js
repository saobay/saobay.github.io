        // ========================================================
        // QUẢN LÝ NGƯỜI DÙNG & LỚP RIÊNG (2026-10-08)
        // - Admin: duyệt đăng ký (từ used/register.html), tạo tài khoản tùy ý
        // - Giáo viên: tạo lớp riêng (ngoài danh sách trường, vd dạy thêm)
        // - Tài khoản lưu trong used/used.is: passwords / students /
        //   teachers_registry / registrations / custom_classes
        // ========================================================

        let userMgrState = { regs: [], tab: 'pending' };

        function usersIsAdmin(){
            try { return (typeof currentUser !== 'undefined' && currentUser.role === 'admin'); }
            catch(e){ return false; }
        }
        function myUid(){ try { return String((currentUser && currentUser.id) || ''); } catch(e){ return ''; } }
        function myUname(){ try { return String((currentUser && currentUser.name) || ''); } catch(e){ return ''; } }
        function uEsc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

        // ---- SĐT đăng nhập (2026-10-09): alias đăng nhập song song với ID ----
        function normalizePhoneHub(input){
            let d = String(input || '').replace(/\D/g, '');
            if (d.length === 11 && d.indexOf('84') === 0) d = '0' + d.slice(2);
            return d;
        }
        function findPhoneOwnerHub(db, phoneNorm, excludeId){
            let owner = null;
            let tr = (db && db.teachers_registry) || {};
            Object.keys(tr).forEach(function(tid){
                if (String(tid) !== String(excludeId) && tr[tid] && tr[tid].phone === phoneNorm)
                    owner = (tr[tid].name || tid) + ' (' + tid + ')';
            });
            let sts = (db && db.students) || {};
            Object.keys(sts).forEach(function(cl){
                (sts[cl] || []).forEach(function(st){
                    if (String(st.id) !== String(excludeId) && st.phone === phoneNorm)
                        owner = (st.name || st.id) + ' (' + st.id + ')';
                });
            });
            return owner;
        }

        // ---- Tính thời hạn tài khoản (2026-10-09) ----
        // Quy tắc: GV trường Sào Báy (có trong phân công) -> không thời hạn;
        // HS có mã trong DB trường -> 1 năm; HS ngoài/tự đăng ký -> 3 tháng dùng thử;
        // admin tạo tay -> theo lựa chọn (mặc định 3 tháng cho HS, không thời hạn cho GV)
        function calcExpiryDays(role, userId, db, chosenDays){
            if (chosenDays !== undefined && chosenDays !== null && chosenDays !== '') return chosenDays === 'unlimited' ? null : parseInt(chosenDays, 10);
            if (role === 'teacher' || role === 'bgh'){
                let inSchool = false;
                (db.assignments || []).forEach(function(a){
                    if (String(a.teachers || '').indexOf(String(userId)) >= 0) inSchool = true;
                });
                if (inSchool) return null; // GV trường: không thời hạn
                return null; // GV/BGH do admin tạo: mặc định không thời hạn (admin đổi được)
            }
            // student
            let inSchool = false;
            Object.keys(db.students || {}).forEach(function(c){
                (db.students[c] || []).forEach(function(st){
                    if (String(st.id) === String(userId)) inSchool = true;
                });
            });
            return inSchool ? 365 : 90; // HS trường: 1 năm; HS ngoài: 3 tháng
        }
        function expiryDateISO(days){
            if (days === null || days === undefined) return null;
            let d = new Date(); d.setDate(d.getDate() + days);
            return d.toISOString();
        }
        function fmtExpiry(iso){
            if (!iso) return '<span class="text-emerald-700 font-bold">Không thời hạn</span>';
            let t = new Date(iso).getTime(), now = Date.now();
            let days = Math.ceil((t - now) / 86400000);
            let ds = new Date(iso).toLocaleDateString('vi-VN');
            if (days < 0) return '<span class="text-rose-700 font-bold">Hết hạn ' + ds + '</span>';
            if (days <= 15) return '<span class="text-amber-700 font-bold">Còn ' + days + ' ngày (' + ds + ')</span>';
            return '<span class="text-slate-600">Đến ' + ds + '</span>';
        }

        // ---- Tạo tài khoản (dùng chung cho duyệt đăng ký & tạo tay) ----
        async function createUserAccount(o){
            // o: {id, name, role, className, expiryDays, password}
            // Co che thu lai khi xung dot SHA (phien khac dang day)
            let _rn = o.role === 'teacher' ? 'giáo viên' : (o.role === 'bgh' ? 'Ban Giám Hiệu' : 'học sinh');
            let db = await assignUpdateUsed(function(db){
                if (!db.passwords) db.passwords = {};
                if (db.passwords[o.id]) throw new Error('Mã ' + o.id + ' đã có tài khoản.');
                db.passwords[o.id] = o.password || '12345678';
                var UNASSIGNED = getUnassignedGroup(db);
                 o._forceTrial = UNASSIGNED === 'Trải nghiệm';
                 // TK nhà trường (có trong phân công/DS trường): không cần phân nhóm, quyền theo phân công chuyên môn
                 // TK mới: tự động vào nhóm Trải nghiệm
                 var isSchoolAccount = false;
                 if (o.role === 'teacher' || o.role === 'bgh'){
                     (db.assignments || []).forEach(function(a){
                         if (String(a.teachers || '').indexOf(String(o.id)) >= 0) isSchoolAccount = true;
                     });
                 } else {
                     Object.keys(db.students || {}).forEach(function(c){
                         (db.students[c] || []).forEach(function(st){
                             if (String(st.id) === String(o.id)) isSchoolAccount = true;
                         });
                     });
                 }
                 var targetGroup = isSchoolAccount ? '' : UNASSIGNED;
                 if (!isSchoolAccount) o._forceTrial = true;
                 if (o.role === 'teacher' || o.role === 'bgh'){
                     if (!db.teachers_registry || Array.isArray(db.teachers_registry)) db.teachers_registry = {};
                     db.teachers_registry[o.id] = { name: o.name, group: targetGroup, note: o.note || '', role: o.role };
                     if (_phoneNorm) db.teachers_registry[o.id].phone = _phoneNorm;
                 } else {
                     if (!isSchoolAccount) {
                         if (!db.students) db.students = {};
                         if (!Array.isArray(db.students[UNASSIGNED])) db.students[UNASSIGNED] = [];
                         let _st = { id: o.id, name: o.name, dob: '' };
                         if (_phoneNorm) _st.phone = _phoneNorm;
                         db.students[UNASSIGNED].push(_st);
                     } else {
                         Object.keys(db.students || {}).forEach(function(_c){
                             (db.students[_c] || []).forEach(function(_st2){
                                 if (String(_st2.id) === String(o.id) && _phoneNorm) _st2.phone = _phoneNorm;
                             });
                         });
                     }
                 }
            }, 'Tạo tài khoản ' + _rn + ': ' + o.name + ' (' + o.id + ')');
            let expDays = o._forceTrial ? 90 : calcExpiryDays(o.role, o.id, db, o.expiryDays);
            let expDb = await assignFetchExpiry();
            expDb[o.id] = { expires_at: expiryDateISO(expDays),
                type: (o.role === 'teacher' || o.role === 'bgh') ? o.role : (expDays === 365 ? 'school_student' : (expDays === 90 ? 'trial' : 'custom')),
                created_at: new Date().toISOString(), created_by: myUname() };
            await assignPushExpiry(expDb, 'Cấp thời hạn TK ' + o.id + (expDays ? ' [' + expDays + ' ngày]' : ' [không thời hạn]'));
            return true;
        }

        // ---- Mở trình quản lý (admin) ----
        function openUserManager(){
            if (!usersIsAdmin()){ alert('Chỉ admin mới được quản lý người dùng.'); return; }
            let old = document.getElementById('users-modal');
            if (old) old.remove();
            let modal = document.createElement('div');
            modal.id = 'users-modal';
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-3';
            modal.innerHTML =
                '<div class="absolute inset-0 bg-black/50" onclick="document.getElementById(\'users-modal\').remove()"></div>'
                + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">'
                + '<div class="flex items-center justify-between px-5 py-3 border-b bg-slate-800 text-white">'
                + '<h3 class="font-black text-sm"><i class="fa-solid fa-users mr-2"></i>Quản Lý Người Dùng</h3>'
                + '<button onclick="document.getElementById(\'users-modal\').remove()" class="text-white/80 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button></div>'
                + '<div class="flex gap-2 px-5 pt-3 text-xs font-bold">'
                + '<button id="um-tab-pending" onclick="userMgrTab(\'pending\')" class="px-4 py-2 rounded-lg bg-indigo-700 text-white">Chờ duyệt <span id="um-pending-count" class="ml-1 bg-white text-indigo-700 rounded-full px-1.5"></span></button>'
                + '<button id="um-tab-unassigned" onclick="userMgrTab(\'unassigned\')" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700">Chưa phân nhóm <span id="um-unassigned-count" class="ml-1 bg-amber-500 text-white rounded-full px-1.5"></span></button>'
                + '<button id="um-tab-trial" onclick="userMgrTab(\'trial\')" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700">Trải nghiệm <span id="um-trial-count" class="ml-1 bg-violet-500 text-white rounded-full px-1.5"></span></button>'
                + '<button id="um-tab-create" onclick="userMgrTab(\'create\')" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700">Tạo tài khoản</button>'
                + '<button id="um-tab-list" onclick="userMgrTab(\'list\')" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700">Danh sách TK</button>'
                + '</div>'
                + '<div id="users-body" class="p-5 overflow-y-auto"><p class="text-xs text-slate-400 italic">Đang tải...</p></div>'
                + '</div>';
            document.body.appendChild(modal);
            // FIX 2026-10-09: nếu không có pending thì mở tab Trải nghiệm thay vì Chờ duyệt
            (async function(){
                try {
                    let db0 = await assignFetchUsed();
                    let nPend = (Array.isArray(db0.registrations) ? db0.registrations : []).filter(function(r){ return r.status === 'pending'; }).length;
                    userMgrTab(nPend ? 'pending' : 'trial');
                } catch(e){ userMgrTab('trial'); }
            })();
            // Cap nhat badge Chua phan nhom
            // FIX 2026-10-09: loai GV da co trong phan cong (tu dong vao nhom) va GV da vao Trai nghiem
            (async function(){
                try {
                    let db = await assignFetchUsed();
                    let _ug = getUnassignedGroup(db);
                    let n = ((db.students && db.students[_ug]) || []).length;
                    let _assignedIds = {};
                    (db.assignments || []).forEach(function(a){
                        String(a.teachers || '').split(',').forEach(function(ts){
                            let mm = String(ts).trim().match(/\((\d+)\)\s*$/);
                            if (mm) _assignedIds[mm[1]] = true;
                        });
                    });
                    Object.keys(db.teachers_registry || {}).forEach(function(tid){
                        let t = db.teachers_registry[tid];
                        if (_assignedIds[String(tid)]) return; // da co trong phan cong -> tu dong vao nhom
                        if ((t.group || '') === 'Trải nghiệm') return; // da vao Trai nghiem -> co nhom roi
                        if (!t.group || t.group === _ug || t.group === 'Chưa phân nhóm lớp' || t.group === 'Chờ phân công lớp') n++;
                    });
                    let b = document.getElementById('um-unassigned-count');
                    if (b) b.textContent = n ? String(n) : '';
                    let nt = 0;
                    Object.keys(db.teachers_registry || {}).forEach(function(tid){
                        if ((db.teachers_registry[tid] || {}).group === 'Trải nghiệm') nt++;
                    });
                    nt += ((db.students && db.students['Trải nghiệm']) || []).length;
                    let bt2 = document.getElementById('um-trial-count');
                    if (bt2) bt2.textContent = nt ? String(nt) : '';
                } catch(e){}
            })();
        }

        function userMgrTab(tab){
            userMgrState.tab = tab;
            let bp = document.getElementById('um-tab-pending'), bu = document.getElementById('um-tab-unassigned'), bc = document.getElementById('um-tab-create'), bl = document.getElementById('um-tab-list'), bt = document.getElementById('um-tab-trial');
            if (bp){ bp.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'pending' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'); }
            if (bu){ bu.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'unassigned' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'); }
            if (bc){ bc.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'create' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'); }
            if (bl){ bl.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'list' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'); }
             if (bt){ bt.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'trial' ? 'bg-violet-700 text-white' : 'bg-slate-200 text-slate-700'); }
            if (tab === 'pending') userMgrLoadPending(); else if (tab === 'unassigned') userMgrLoadUnassigned(); else if (tab === 'list') userMgrLoadList(); else if (tab === 'trial') userMgrLoadTrial(); else userMgrRenderCreate();
        }

        // Danh sach tai khoan + thoi han + gia han (2026-10-09)
        async function userMgrLoadList(){
            let body = document.getElementById('users-body');
            body.innerHTML = '<p class="text-xs text-slate-400 italic">Đang tải...</p>';
            try {
                let db = await assignFetchUsed();
                let exp = await assignFetchExpiry();
                let ids = Object.keys(db.passwords || {}).filter(function(x){ return x !== 'admin'; });
                // Tim ten + vai tro + nhom
                function findName(uid){
                    let tr = db.teachers_registry || {};
                    if (tr[uid]) return { name: tr[uid].name, role: 'GV', rawRole: tr[uid].role || 'teacher', group: tr[uid].group || UNASSIGNED_GROUP, isTeacher: true, phone: tr[uid].phone || '' };
                    let out = null;
                    Object.keys(db.students || {}).forEach(function(c){
                        (db.students[c] || []).forEach(function(st){
                            if (String(st.id) === String(uid)) out = { name: st.name, role: 'HS', rawRole: 'student', group: c, isTeacher: false, phone: st.phone || '' };
                        });
                    });
                    return out || { name: '(chưa rõ)', role: '?', rawRole: '?', group: '?', isTeacher: false, phone: '' };
                }
                let h = '<div class="space-y-2">';
                ids.forEach(function(uid){
                    let info = findName(uid);
                    let e = exp[uid] || {};
                    let grpBadge = info.group === UNASSIGNED_GROUP
                        ? '<span class="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">' + uEsc(info.group) + '</span>'
                        : '<span class="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">' + uEsc(info.group) + '</span>';
                    h += '<div class="border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">'
                        + '<div class="flex-1 min-w-[160px]"><p class="font-black text-slate-800">' + uEsc(info.name) + ' <span class="font-normal text-slate-400">(' + uEsc(uid) + ')</span></p>'
                        + '<p class="text-slate-500">' + uEsc(info.role) + ' • ' + grpBadge + ' • Hạn: ' + fmtExpiry(e.expires_at) + (info.phone ? ' • <span class="text-teal-700 font-bold">📱 ' + uEsc(info.phone) + '</span>' : '') + '</p></div>'
                        + '<button onclick="setUserPhone(\'' + uEsc(uid) + '\",' + (info.isTeacher ? 'true' : 'false') + ')" title="Thêm/sửa SĐT đăng nhập" class="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg">📱 SĐT</button>'
                        + '<button onclick="changeUserGroup(\'' + uEsc(uid) + '\",' + (info.isTeacher ? 'true' : 'false') + ')" class="bg-slate-500 hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-lg">Đổi nhóm</button>'
                        + (info.rawRole === 'bgh' ? '' : '<button onclick="switchUserRole(\'' + uEsc(uid) + '\",' + (info.isTeacher ? 'true' : 'false') + ')" title="Đổi vai trò GV/HS (đăng ký nhầm)" class="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-lg">' + (info.isTeacher ? '→HS' : '→GV') + '</button>')
                        + '<button onclick="extendAccount(\'' + uEsc(uid) + '\')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg">Gia hạn</button>'
                         + '<button onclick="showUserPassword(\'' + uEsc(uid) + '\')" title="Xem mật khẩu" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg">👁️ MK</button>'
                        + '</div>';
                });
                body.innerHTML = h ? h + '</div>' : '<p class="text-xs text-slate-400 italic">Chưa có tài khoản nào.</p>';
            } catch(e){ body.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + uEsc(e.message || e) + '</p>'; }
        }
        async function extendAccount(uid){
            let v = prompt('Gia hạn tài khoản ' + uid + ' thêm bao nhiêu ngày? (nhập 0 = không thời hạn)', '90');
            if (v === null) return;
            let days = parseInt(v, 10);
            if (isNaN(days) || days < 0){ alert('Số ngày không hợp lệ.'); return; }
            try {
                let expDb = await assignFetchExpiry();
                let cur = expDb[uid] || {};
                let base = cur.expires_at && new Date(cur.expires_at).getTime() > Date.now() ? new Date(cur.expires_at) : new Date();
                if (days === 0){ cur.expires_at = null; }
                else { base.setDate(base.getDate() + days); cur.expires_at = base.toISOString(); }
                cur.extended_at = new Date().toISOString(); cur.extended_by = myUname();
                expDb[uid] = cur;
                await assignPushExpiry(expDb, 'Gia hạn tài khoản ' + uid + (days === 0 ? ' [không thời hạn]' : ' thêm ' + days + ' ngày'));
                if (typeof showToast === 'function') showToast('Đã gia hạn!', 'success');
                userMgrLoadList();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }
        // ---- SĐT đăng nhập (2026-10-09): admin thêm/sửa SĐT cho từng TK ----
        async function setUserPhone(uid, isTeacher){
            try {
                let db = await assignFetchUsed();
                let cur = '';
                if (isTeacher) {
                    cur = (db.teachers_registry && db.teachers_registry[uid] && db.teachers_registry[uid].phone) || '';
                } else {
                    Object.keys(db.students || {}).forEach(function(c){
                        (db.students[c] || []).forEach(function(st){
                            if (String(st.id) === String(uid)) cur = st.phone || cur;
                        });
                    });
                }
                let input = prompt('SĐT đăng nhập cho ' + uid + ' (để trống để xóa):', cur || '');
                if (input === null) return;
                input = String(input).trim();
                let norm = '';
                if (input) {
                    norm = normalizePhoneHub(input);
                    if (!/^0\d{9}$/.test(norm)) { alert('SĐT không hợp lệ! Phải là 10 số bắt đầu bằng 0.'); return; }
                    let dup = findPhoneOwnerHub(db, norm, uid);
                    if (dup) { alert('SĐT này đã được dùng cho tài khoản: ' + dup); return; }
                }
                await assignUpdateUsed(function(db2){
                    if (isTeacher) {
                        if (!db2.teachers_registry) db2.teachers_registry = {};
                        if (!db2.teachers_registry[uid]) db2.teachers_registry[uid] = { name: uid };
                        if (norm) db2.teachers_registry[uid].phone = norm;
                        else delete db2.teachers_registry[uid].phone;
                    } else {
                        Object.keys(db2.students || {}).forEach(function(c){
                            (db2.students[c] || []).forEach(function(st){
                                if (String(st.id) === String(uid)) {
                                    if (norm) st.phone = norm; else delete st.phone;
                                }
                            });
                        });
                    }
                }, (norm ? 'Thêm SĐT ' + norm : 'Xóa SĐT') + ' cho TK ' + uid);
                if (typeof showToast === 'function') showToast('Đã lưu SĐT cho ' + uid, 'success');
                else alert('Đã lưu SĐT cho ' + uid);
                userMgrLoadList();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }


        // ===== QUAN LY TAI KHOAN TRAI NGHIEM (2026-10-09) =====
var trialFilter = 'all';
function setTrialFilter(f){
    trialFilter = f;
    userMgrLoadTrial();
}
function trialDaysLeft(expires_at){
    if (!expires_at) return null;
    return Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000);
}
function trialDaysBadge(days){
    if (days === null) return '<span class="text-emerald-700 font-bold">Không thời hạn</span>';
    if (days < 0) return '<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Hết hạn ' + (-days) + ' ngày</span>';
    if (days === 0) return '<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Hết hạn hôm nay</span>';
    if (days < 7) return '<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Còn ' + days + ' ngày</span>';
    if (days < 15) return '<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Còn ' + days + ' ngày</span>';
    return '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Còn ' + days + ' ngày</span>';
}
async function userMgrLoadTrial(){
    let body = document.getElementById('users-body');
    body.innerHTML = '<p class="text-xs text-slate-400 italic">Đang tải...</p>';
    try {
        let db = await assignFetchUsed();
        let exp = await assignFetchExpiry();
        // Gom TK Trai nghiem: GV co group='Trải nghiệm' + HS trong students['Trải nghiệm']
        let trials = [];
        Object.keys(db.teachers_registry || {}).forEach(function(tid){
            let t = db.teachers_registry[tid] || {};
            if (t.group === 'Trải nghiệm') trials.push({ id: tid, name: t.name || '(chưa rõ)', role: 'GV', isTeacher: true });
        });
        ((db.students && db.students['Trải nghiệm']) || []).forEach(function(st){
            trials.push({ id: st.id, name: st.name || '(chưa rõ)', role: 'HS', isTeacher: false });
        });
        // FIX 2026-10-09: phat hien TK "ma" — co trong registry/students nhung KHONG co password
        // (xay ra khi push DB that bai giua chung hoac TK bi xoa tay). Danh dau de admin xu ly.
        let pwdb = db.passwords || {};
        trials.forEach(function(t){
            t.hasPassword = !!pwdb[t.id];
        });
        // Gan thong tin han su dung
        trials.forEach(function(t){
            let e = exp[t.id] || {};
            t.expires_at = e.expires_at || null;
            t.created_at = e.created_at || null;
            t.days = trialDaysLeft(t.expires_at);
        });
        let nBroken = trials.filter(function(t){ return !t.hasPassword; }).length;
        let nGV = trials.filter(function(t){ return t.role === 'GV'; }).length;
        let nHS = trials.filter(function(t){ return t.role === 'HS'; }).length;
        // Loc theo filter
        let shown = trials.filter(function(t){
            if (trialFilter === 'gv') return t.role === 'GV';
            if (trialFilter === 'hs') return t.role === 'HS';
            if (trialFilter === 'expiring') return t.days !== null && t.days >= 0 && t.days < 7;
            if (trialFilter === 'expired') return t.days !== null && t.days < 0;
            return true;
        });
        // Sap xep: het han truoc, sap het han, roi den con nhieu ngay
        shown.sort(function(a, b){
            let da = a.days === null ? 99999 : a.days, dbb = b.days === null ? 99999 : b.days;
            return da - dbb;
        });
        function fbtn(f, label){
            let on = trialFilter === f;
            return '<button onclick="setTrialFilter(\'' + f + '\')" class="px-3 py-1.5 rounded-lg font-bold text-xs ' + (on ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">' + label + '</button>';
        }
        let h = '<div class="space-y-3">';
        // Thong ke tong quan
        h += '<div class="grid grid-cols-3 gap-2">'
            + '<div class="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center"><p class="text-2xl font-black text-violet-700">' + trials.length + '</p><p class="text-[11px] text-violet-600 font-bold">Tổng TK trải nghiệm</p></div>'
            + '<div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><p class="text-2xl font-black text-blue-700">' + nGV + '</p><p class="text-[11px] text-blue-600 font-bold">Giáo viên</p></div>'
            + '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"><p class="text-2xl font-black text-emerald-700">' + nHS + '</p><p class="text-[11px] text-emerald-600 font-bold">Học sinh</p></div>'
            + '</div>';
        // Canh bao TK ma (neu co)
        if (nBroken > 0){
            h += '<div class="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-800">'
                + '<b>⚠️ Phát hiện ' + nBroken + ' tài khoản lỗi</b> (không có mật khẩu trong DB — người dùng sẽ báo "Không tìm thấy tài khoản" khi đăng nhập). '
                + 'Nguyên nhân thường do dữ liệu chưa đồng bộ hoặc TK đã bị xóa ở nơi khác. Bấm <b>🔄 Đồng bộ lại</b> để tải mới nhất; '
                + 'nếu vẫn còn, dùng nút <b>Xóa</b> để dọn khỏi danh sách.'
                + '</div>';
        }
        // Bo loc
        h += '<div class="flex flex-wrap gap-2">'
            + fbtn('all', 'Tất cả (' + trials.length + ')')
            + fbtn('gv', 'GV (' + nGV + ')')
            + fbtn('hs', 'HS (' + nHS + ')')
            + fbtn('expiring', 'Sắp hết hạn')
            + fbtn('expired', 'Đã hết hạn')
            + '<button onclick="userMgrLoadTrial()" title="Tải lại dữ liệu mới nhất từ server" class="px-3 py-1.5 rounded-lg font-bold text-xs bg-white border border-slate-300 text-slate-600 hover:bg-slate-100">🔄 Đồng bộ lại</button>'
            + '</div>';
        // Danh sach
        if (!shown.length){
            h += '<p class="text-xs text-slate-400 italic py-4 text-center">Không có tài khoản nào khớp bộ lọc.</p>';
        } else {
            h += '<div class="space-y-2">';
            shown.forEach(function(t){
                let regDate = t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN') : '—';
                let expDate = t.expires_at ? new Date(t.expires_at).toLocaleDateString('vi-VN') : 'Không thời hạn';
                let roleBadge = t.role === 'GV'
                    ? '<span class="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">GV</span>'
                    : '<span class="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">HS</span>';
                h += '<div class="border border-violet-200 bg-violet-50/50 rounded-xl p-3 text-xs">'
                    + '<div class="flex flex-wrap items-center gap-2">'
                    + '<div class="flex-1 min-w-[180px]">'
                    + '<p class="font-black text-slate-800">' + uEsc(t.name) + ' ' + roleBadge + ' <span class="font-normal text-slate-400">(' + uEsc(t.id) + ')</span></p>'
                    + (t.hasPassword ? '' : '<p class="mt-1"><span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">⚠️ TK lỗi — không đăng nhập được</span></p>')
                    + '<p class="text-slate-500 mt-0.5">ĐK: ' + regDate + ' • Hết hạn: ' + expDate + '</p>'
                    + '<p class="mt-1">' + trialDaysBadge(t.days) + '</p>'
                    + '</div>'
                    + '<div class="flex flex-wrap gap-1.5">'
                    + '<button onclick="extendAccount(\'' + uEsc(t.id) + '\')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg">Gia hạn</button>'
                    + '<button onclick="changeUserGroup(\'' + uEsc(t.id) + '\',' + (t.isTeacher ? 'true' : 'false') + ')" class="bg-slate-500 hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-lg">Chuyển nhóm</button>'
                    + '<button onclick="deleteTrialAccount(\'' + uEsc(t.id) + '\',' + (t.isTeacher ? 'true' : 'false') + ')" class="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg">Xóa</button>'
                     + '<button onclick="showUserPassword(\'' + uEsc(t.id) + '\')" title="Xem mật khẩu" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg">👁️ MK</button>'
                    + '</div></div></div>';
            });
            h += '</div>';
        }
        h += '</div>';
        body.innerHTML = h;
    } catch(e){ body.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + uEsc(e.message || e) + '</p>'; }
}
        // ---- Xem MK (2026-10-09): admin xem mật khẩu đã giải mã của TK ----
        async function showUserPassword(uid){
            try {
                let db = await assignFetchUsed();
                let saved = db.passwords ? db.passwords[uid] : undefined;
                if (!saved){ alert('Tài khoản ' + uid + ' chưa có mật khẩu trong DB.'); return; }
                let shown = saved;
                if (saved !== '12345678'){
                    try { shown = decodeURIComponent(escape(atob(saved))); } catch(e){ shown = saved; }
                } else {
                    shown = '12345678 (mặc định)';
                }
                prompt('Mật khẩu của ' + uid + ' (bấm Ctrl+C để copy):', shown);
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }
async function deleteTrialAccount(uid, isTeacher){
    let nm = uid;
    try {
        let db0 = await assignFetchUsed();
        if (isTeacher && db0.teachers_registry && db0.teachers_registry[uid]) nm = db0.teachers_registry[uid].name || uid;
        if (!isTeacher) Object.keys(db0.students || {}).forEach(function(c){ (db0.students[c] || []).forEach(function(st){ if (String(st.id) === String(uid)) nm = st.name || uid; }); });
    } catch(e){}
    if (!confirm('Xóa vĩnh viễn tài khoản trải nghiệm "' + nm + '" (' + uid + ')?')) return;
    try {
        let db = await assignUpdateUsed(function(db){
            if (db.passwords) delete db.passwords[uid];
            if (isTeacher){
                if (db.teachers_registry) delete db.teachers_registry[uid];
            } else {
                Object.keys(db.students || {}).forEach(function(c){
                    db.students[c] = (db.students[c] || []).filter(function(st){ return String(st.id) !== String(uid); });
                });
            }
            if (Array.isArray(db.registrations)) db.registrations = db.registrations.filter(function(r){ return String(r.id) !== String(uid); });
        }, 'Xóa TK trải nghiệm ' + uid);
        try {
            let expDb = await assignFetchExpiry();
            delete expDb[uid];
            await assignPushExpiry(expDb, 'Xóa hạn TK ' + uid);
        } catch(e){}
        if (typeof showToast === 'function') showToast('Đã xóa tài khoản ' + uid, 'success');
        userMgrLoadTrial();
        // Cap nhat badge
        let bt2 = document.getElementById('um-trial-count');
        if (bt2){ let n = parseInt(bt2.textContent || '0', 10); if (n > 0) bt2.textContent = String(n - 1); }
    } catch(e){ alert('Lỗi xóa: ' + (e.message || e)); }
}
// ===== END QUAN LY TAI KHOAN TRAI NGHIEM =====

        // ===== CHUA PHAN NHOM LOP / TRAI NGHIEM (2026-10-09) =====
        function getUnassignedGroup(db){
            // trial_mode=true: nhom "Trải nghiệm" (full 3 thang); false: "Chờ phân công lớp" (chua duoc hoc)
            let tm = db && db.settings && db.settings.trial_mode;
            if (tm === undefined || tm === null) tm = true; // mac dinh dang trial
            return tm ? 'Trải nghiệm' : 'Chờ phân công lớp';
        }
        var UNASSIGNED_GROUP = 'Trải nghiệm'; // fallback, dung getUnassignedGroup(db) khi co db
        async function userMgrLoadUnassigned(){
            let body = document.getElementById('users-body');
            body.innerHTML = '<p class="text-xs text-slate-400 italic">Đang tải...</p>';
            try {
                let db = await assignFetchUsed();
                let _ug2 = getUnassignedGroup(db);
                // HS chua phan nhom
                let unSt = (db.students && db.students[_ug2]) || [];
                // GV chua phan nhom (gom ca ten cu)
                // FIX 2026-10-09: loai GV da co trong phan cong chuyen mon (tu dong vao nhom theo mon/lop)
                // va GV da vao nhom Trai nghiem (da co nhom that su)
                let unTv = [];
                let _assignedIds2 = {};
                (db.assignments || []).forEach(function(a){
                    String(a.teachers || '').split(',').forEach(function(ts){
                        let mm = String(ts).trim().match(/\((\d+)\)\s*$/);
                        if (mm) _assignedIds2[mm[1]] = true;
                    });
                });
                Object.keys(db.teachers_registry || {}).forEach(function(tid){
                    let t = db.teachers_registry[tid];
                    if (_assignedIds2[String(tid)]) return; // GV truong: tu dong vao nhom theo phan cong
                    if ((t.group || '') === 'Trải nghiệm') return; // da vao Trai nghiem: co nhom roi
                    if (!t.group || t.group === _ug2 || t.group === 'Chưa phân nhóm lớp' || t.group === 'Chờ phân công lớp') unTv.push({ id: tid, name: t.name, requested: t.note });
                });
                // Danh sach lop hien co (de chon)
                let classes = Object.keys(db.students || {}).filter(function(c){ return c !== _ug2 && c !== 'Chưa phân nhóm lớp' && c !== 'Trải nghiệm' && c !== 'Chờ phân công lớp'; }).sort();
                let h = '';
                // HS
                if (unSt.length){
                    h += '<h4 class="font-black text-xs text-slate-700 mb-2"><i class="fa-solid fa-user-graduate mr-1 text-emerald-600"></i>Học sinh chờ xếp lớp (' + unSt.length + ')</h4><div class="space-y-2 mb-4">';
                    unSt.forEach(function(st){
                        let req = st.requestedClass ? ' <span class="text-slate-400">(xin vào ' + uEsc(st.requestedClass) + ')</span>' : '';
                        h += '<div class="border border-amber-200 bg-amber-50 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">'
                            + '<div class="flex-1 min-w-[140px]"><p class="font-black text-slate-800">' + uEsc(st.name) + '</p>'
                            + '<p class="text-slate-500">' + uEsc(st.id) + req + '</p></div>'
                            + '<select id="uas-cls-' + uEsc(st.id) + '" class="border rounded-lg px-2 py-1.5 text-xs font-bold">'
                            + '<option value="">-- Chọn lớp --</option>'
                            + classes.map(function(c){ return '<option value="' + uEsc(c) + '"' + (st.requestedClass === c ? ' selected' : '') + '>' + uEsc(c) + '</option>'; }).join('')
                            + '</select>'
                            + '<button onclick="assignStudentToClass(\'' + uEsc(st.id) + '\')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg">Xếp lớp</button>'
                            + '</div>';
                    });
                    h += '</div>';
                }
                // GV
                if (unTv.length){
                    h += '<h4 class="font-black text-xs text-slate-700 mb-2"><i class="fa-solid fa-chalkboard-user mr-1 text-blue-600"></i>Giáo viên chờ phân nhóm (' + unTv.length + ')</h4><div class="space-y-2">';
                    unTv.forEach(function(t){
                        h += '<div class="border border-amber-200 bg-amber-50 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">'
                            + '<div class="flex-1 min-w-[140px]"><p class="font-black text-slate-800">' + uEsc(t.name) + '</p>'
                            + '<p class="text-slate-500">' + uEsc(t.id) + '</p></div>'
                            + '<input id="uas-grp-' + uEsc(t.id) + '" placeholder="Nhóm (VD: Tổ Toán)" class="border rounded-lg px-2 py-1.5 text-xs w-36">'
                            + '<button onclick="assignTeacherToGroup(\'' + uEsc(t.id) + '\')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg">Phân nhóm</button>'
                            + '</div>';
                    });
                    h += '</div>';
                }
                let _tm = !(db.settings && db.settings.trial_mode === false);
                let toggleHtml = '<div class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-xs">'
                    + '<div><p class="font-black text-blue-900">Chế độ trải nghiệm 3 tháng: ' + (_tm ? '<span class="text-emerald-700">ĐANG BẬT</span>' : '<span class="text-slate-500">ĐANG TẮT</span>') + '</p>'
                    + '<p class="text-slate-500 text-[11px]">' + (_tm ? 'TK mới vào nhóm "Trải nghiệm", dùng full 3 tháng.' : 'TK mới vào "Chờ phân công lớp", chưa được học.') + '</p></div>'
                    + '<button onclick="toggleTrialMode()" class="shrink-0 font-bold px-3 py-1.5 rounded-lg ' + (_tm ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white') + '">'
                    + (_tm ? 'Tắt trial' : 'Bật trial') + '</button></div>';
                if (!h) h = '<p class="text-xs text-slate-400 italic">Không có ai chờ phân nhóm. Tất cả đã được xếp lớp/nhóm.</p>';
                else h = '<p class="text-[11px] text-slate-500 mb-3"><i class="fa-solid fa-circle-info mr-1"></i>Tài khoản mới duyệt sẽ vào đây. Admin xếp lớp/nhóm cho từng người.</p>' + h;
                h = toggleHtml + h;
                body.innerHTML = h;
                // Cap nhat badge
                let badge = document.getElementById('um-unassigned-count');
                if (badge) badge.textContent = unSt.length + unTv.length;
            } catch(e){ body.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + uEsc(e.message || e) + '</p>'; }
        }
        async function toggleTrialMode(){
            try {
                let db = await assignFetchUsed();
                if (!db.settings) db.settings = {};
                let cur = !(db.settings.trial_mode === false);
                db.settings.trial_mode = !cur;
                await assignPushUsed(db, (cur ? 'Tắt' : 'Bật') + ' chế độ trải nghiệm 3 tháng');
                if (typeof showToast === 'function') showToast(cur ? 'Đã tắt trial.' : 'Đã bật trial.', 'success');
                userMgrLoadUnassigned();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }
        async function assignStudentToClass(sid){
            let sel = document.getElementById('uas-cls-' + sid);
            let cls = sel ? sel.value.trim().toUpperCase() : '';
            if (!cls){ alert('Hãy chọn lớp cho học sinh.'); return; }
            try {
                let db = await assignFetchUsed();
                let _ug3 = getUnassignedGroup(db);
                let arr = db.students[_ug3] || [];
                let idx = arr.findIndex(function(x){ return String(x.id) === String(sid); });
                if (idx < 0) throw new Error('Không tìm thấy HS.');
                let st = arr.splice(idx, 1)[0];
                if (!Array.isArray(db.students[cls])) db.students[cls] = [];
                db.students[cls].push({ id: st.id, name: st.name, dob: st.dob || '' });
                await assignPushUsed(db, 'Xếp lớp ' + cls + ' cho HS: ' + st.name + ' (' + sid + ')');
                if (typeof showToast === 'function') showToast('Đã xếp ' + st.name + ' vào lớp ' + cls, 'success');
                userMgrLoadUnassigned();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }
        async function assignTeacherToGroup(tid){
            let inp = document.getElementById('uas-grp-' + tid);
            let grp = inp ? inp.value.trim() : '';
            if (!grp){ alert('Hãy nhập tên nhóm cho giáo viên (VD: Tổ Toán, Tổ Văn...).'); return; }
            try {
                let db = await assignFetchUsed();
                if (!db.teachers_registry || !db.teachers_registry[tid]) throw new Error('Không tìm thấy GV.');
                db.teachers_registry[tid].group = grp;
                await assignPushUsed(db, 'Phân nhóm "' + grp + '" cho GV: ' + db.teachers_registry[tid].name + ' (' + tid + ')');
                if (typeof showToast === 'function') showToast('Đã phân nhóm!', 'success');
                userMgrLoadUnassigned();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }
        // Doi nhom/lop cho TK da co (trong Danh sach TK)
        async function changeUserGroup(uid, isTeacher){
            try {
                let db = await assignFetchUsed();
                if (isTeacher){
                    let cur = (db.teachers_registry[uid] && db.teachers_registry[uid].group) || UNASSIGNED_GROUP;
                    let v = prompt('Đổi nhóm cho GV (hiện tại: ' + cur + '). Nhập tên nhóm mới:', cur === UNASSIGNED_GROUP ? '' : cur);
                    if (v === null) return;
                    v = v.trim() || UNASSIGNED_GROUP;
                    db.teachers_registry[uid].group = v;
                    await assignPushUsed(db, 'Đổi nhóm GV ' + uid + ' → "' + v + '"');
                } else {
                    let cur = '', nm = uid, curDob = '';
                    Object.keys(db.students || {}).forEach(function(c){
                        (db.students[c] || []).forEach(function(st){
                            if (String(st.id) === String(uid)){ cur = c; nm = st.name; curDob = st.dob || ''; }
                        });
                    });
                    let v = prompt('Đổi lớp cho HS ' + nm + ' (hiện tại: ' + cur + '). Nhập lớp mới:', cur === UNASSIGNED_GROUP ? '' : cur);
                    if (v === null) return;
                    v = (v.trim().toUpperCase()) || UNASSIGNED_GROUP;
                    if (v === cur){ return; }
                    Object.keys(db.students || {}).forEach(function(c){
                        db.students[c] = (db.students[c] || []).filter(function(st){ return String(st.id) !== String(uid); });
                    });
                    if (!Array.isArray(db.students[v])) db.students[v] = [];
                    db.students[v].push({ id: uid, name: nm, dob: curDob });
                    await assignPushUsed(db, 'Đổi lớp HS ' + nm + ' (' + uid + '): ' + cur + ' → ' + v);
                }
                if (typeof showToast === 'function') showToast('Đã đổi!', 'success');
                userMgrLoadList();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }

        // Đổi vai trò GV<->HS (admin, khi đăng ký nhầm) — 2026-10-10
        async function switchUserRole(uid, isTeacher){
            try {
                let db = await assignFetchUsed();
                let unassigned = (typeof getUnassignedGroup === 'function') ? getUnassignedGroup(db) : 'Trải nghiệm';
                let name = uid, phone = '';
                if (isTeacher){
                    let tr = (db.teachers_registry || {})[uid] || {};
                    if (tr.role === 'bgh'){ alert('Tài khoản Ban Giám Hiệu không đổi vai trò tại đây.'); return; }
                    name = tr.name || uid; phone = tr.phone || '';
                    let cls = prompt('Đổi "' + name + '" từ GIÁO VIÊN thành HỌC SINH.\nNhập lớp cho HS:', '');
                    if (cls === null) return;
                    cls = (cls.trim().toUpperCase()) || unassigned;
                    if (!confirm('Xác nhận đổi "' + name + ' (' + uid + ')"\nTừ: Giáo viên\nThành: Học sinh lớp ' + cls + '?')) return;
                    delete db.teachers_registry[uid];
                    if (!db.students) db.students = {};
                    if (!Array.isArray(db.students[cls])) db.students[cls] = [];
                    let st = { id: uid, name: name, dob: '' };
                    if (phone) st.phone = phone;
                    db.students[cls].push(st);
                    await assignPushUsed(db, 'Đổi vai trò GV→HS: ' + name + ' (' + uid + ') → lớp ' + cls);
                    try {
                        let expDb = await assignFetchExpiry();
                        let old = expDb[uid] || {};
                        expDb[uid] = { expires_at: expiryDateISO(90), type: 'trial', created_at: old.created_at || new Date().toISOString(), created_by: myUname() };
                        await assignPushExpiry(expDb, 'Đổi vai trò GV→HS, cấp trial 90 ngày: ' + uid);
                    } catch(e2){}
                } else {
                    Object.keys(db.students || {}).forEach(function(c){
                        (db.students[c] || []).forEach(function(st){
                            if (String(st.id) === String(uid)){ name = st.name || uid; phone = st.phone || ''; }
                        });
                    });
                    if (!confirm('Xác nhận đổi "' + name + ' (' + uid + ')"\nTừ: Học sinh\nThành: Giáo viên?')) return;
                    Object.keys(db.students || {}).forEach(function(c){
                        db.students[c] = (db.students[c] || []).filter(function(st){ return String(st.id) !== String(uid); });
                    });
                    if (!db.teachers_registry || Array.isArray(db.teachers_registry)) db.teachers_registry = {};
                    let tr = { name: name, group: unassigned, note: '', role: 'teacher' };
                    if (phone) tr.phone = phone;
                    db.teachers_registry[uid] = tr;
                    await assignPushUsed(db, 'Đổi vai trò HS→GV: ' + name + ' (' + uid + ')');
                    try {
                        let expDb = await assignFetchExpiry();
                        let old = expDb[uid] || {};
                        expDb[uid] = { expires_at: null, type: 'teacher', created_at: old.created_at || new Date().toISOString(), created_by: myUname() };
                        await assignPushExpiry(expDb, 'Đổi vai trò HS→GV, không thời hạn: ' + uid);
                    } catch(e2){}
                }
                if (typeof showToast === 'function') showToast('Đã đổi vai trò!', 'success');
                else alert('Đã đổi vai trò thành công!');
                userMgrLoadList();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }

        async function userMgrLoadPending(){
            let body = document.getElementById('users-body');
            try {
                let db = await assignFetchUsed();
                let regs = Array.isArray(db.registrations) ? db.registrations : [];
                userMgrState.regs = regs;
                let pend = regs.filter(function(r){ return r.status === 'pending'; });
                let pc = document.getElementById('um-pending-count');
                if (pc) pc.textContent = pend.length ? String(pend.length) : '';
                // FIX 2026-10-09: ẩn tab Chờ duyệt khi trống (đăng ký mới tự vào Trải nghiệm)
                let ptab = document.getElementById('um-tab-pending');
                if (ptab) ptab.style.display = pend.length ? '' : 'none';
                if (!pend.length){
                    body.innerHTML = '<p class="text-xs text-slate-400 italic">Không có đăng ký nào chờ duyệt.</p>';
                    updateRegBadge();
                    return;
                }
                let h = '<div class="space-y-2">';
                pend.forEach(function(r){
                    h += '<div class="border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">'
                        + '<div class="flex-1 min-w-[180px]"><p class="font-black text-slate-800">' + uEsc(r.name) + '</p>'
                        + '<p class="text-slate-500">Mã: <b>' + uEsc(r.id) + '</b> • ' + (r.role_requested === 'teacher' ? 'Giáo viên' : 'Học sinh' + (r.className ? ' lớp ' + uEsc(r.className) : ''))
                        + (r.note ? ' • <i>' + uEsc(r.note) + '</i>' : '') + '</p>'
                        + '<p class="text-slate-400 text-[10px]">' + uEsc(r.created_at || '').replace('T', ' ').slice(0, 16) + '</p></div>'
                        + '<button onclick="approveReg(\'' + uEsc(r.id) + '\')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg">Duyệt</button>'
                        + '<button onclick="rejectReg(\'' + uEsc(r.id) + '\')" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg">Từ chối</button>'
                        + '</div>';
                });
                body.innerHTML = h + '</div>';
            } catch(e){ body.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + uEsc(e.message || e) + '</p>'; }
        }

        async function setRegStatus(id, status){
            // FIX 2026-10-09: dùng assignUpdateUsed (atomic + tự retry khi 409)
            // thay vì fetch+push rời rạc dễ bị SHA mismatch
            let result = null;
            let rname = '';
            await assignUpdateUsed(function(db){
                let regs = Array.isArray(db.registrations) ? db.registrations : [];
                let r = regs.filter(function(x){ return String(x.id) === String(id); })[0];
                if (!r) throw new Error('Không tìm thấy đăng ký.');
                r.status = status;
                r.decided_at = new Date().toISOString();
                r.decided_by = myUname();
                rname = r.name;
                result = r;
            }, (status === 'approved' ? 'Duyệt' : 'Từ chối') + ' đăng ký: ' + id);
            return result;
        }

        async function approveReg(id){
            if (!confirm('Duyệt tài khoản này?')) return;
            try {
                let db = await assignFetchUsed();
                let regs = Array.isArray(db.registrations) ? db.registrations : [];
                let r = regs.filter(function(x){ return String(x.id) === String(id) && x.status === 'pending'; })[0];
                if (!r) throw new Error('Đăng ký không còn chờ duyệt.');
                let userPass = null;
                try { if (r.password) userPass = decodeURIComponent(escape(atob(r.password))); } catch(e){}
                await createUserAccount({ id: r.id, name: r.name, role: r.role_requested, className: r.className, password: userPass });
                await setRegStatus(id, 'approved');
                if (typeof showToast === 'function') showToast('Đã duyệt & tạo tài khoản cho ' + r.name, 'success');
                userMgrLoadPending();
            } catch(e){ alert('Lỗi duyệt: ' + (e.message || e)); }
        }

        async function rejectReg(id){
            if (!confirm('Từ chối đăng ký này?')) return;
            try {
                await setRegStatus(id, 'rejected');
                userMgrLoadPending();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }

        function userMgrRenderCreate(){
            let body = document.getElementById('users-body');
            body.innerHTML =
                '<div class="space-y-3 text-sm max-w-md">'
                + '<div><label class="text-xs font-bold text-slate-600">Họ và tên *</label>'
                + '<input id="uc-name" class="mt-1 w-full border rounded-lg px-3 py-2.5" placeholder="VD: Nguyễn Văn A"></div>'
                + '<div><label class="text-xs font-bold text-slate-600">Mã đăng nhập (SĐT/Zalo) *</label>'
                + '<input id="uc-id" inputmode="numeric" class="mt-1 w-full border rounded-lg px-3 py-2.5" placeholder="VD: 0912345678"></div>'
                + '<div><label class="text-xs font-bold text-slate-600">SĐT đăng nhập <span class="font-normal text-slate-400">(không bắt buộc — để đăng nhập bằng SĐT)</span></label>'
                + '<input id="uc-phone" inputmode="tel" class="mt-1 w-full border rounded-lg px-3 py-2.5" placeholder="VD: 0912345678"></div>'
                + '<div><label class="text-xs font-bold text-slate-600">Vai trò *</label>'
                + '<select id="uc-role" onchange="document.getElementById(\'uc-class-row\').classList.toggle(\'hidden\', this.value !== \'student\')" class="mt-1 w-full border rounded-lg px-3 py-2.5 font-semibold">'
                + '<option value="teacher">Giáo viên</option><option value="student">Học sinh</option></select></div>'
                + '<div id="uc-class-row" class="hidden"><label class="text-xs font-bold text-slate-600">Lớp (học sinh) *</label>'
                + '<input id="uc-class" class="mt-1 w-full border rounded-lg px-3 py-2.5 uppercase" placeholder="VD: 10A1"></div>'
                + '<div><label class="text-xs font-bold text-slate-600">Thời hạn sử dụng</label>'
                + '<select id="uc-expiry" class="mt-1 w-full border rounded-lg px-3 py-2.5 font-semibold">'
                + '<option value="">Tự động (GV trường: không hạn / HS trường: 1 năm / HS ngoài: 3 tháng)</option>'
                + '<option value="30">1 tháng</option><option value="90">3 tháng</option>'
                + '<option value="180">6 tháng</option><option value="365">1 năm</option>'
                + '<option value="730">2 năm</option><option value="unlimited">Không thời hạn</option>'
                + '</select></div>'
                + '<button onclick="createAccountNow()" class="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 rounded-xl"><i class="fa-solid fa-user-plus mr-1"></i>Tạo tài khoản</button>'
                + '<p class="text-[11px] text-slate-500">Mật khẩu mặc định: <b>12345678</b> — hệ thống bắt đổi ngay lần đầu đăng nhập.</p>'
                + '</div>';
        }

        async function createAccountNow(){
            let name = document.getElementById('uc-name').value.trim();
            let id = document.getElementById('uc-id').value.replace(/\D/g, '');
            let phoneRaw = document.getElementById('uc-phone').value.trim();
            let phone = '';
            if (phoneRaw) {
                phone = normalizePhoneHub(phoneRaw);
                if (!/^0\d{9}$/.test(phone)) { alert('SĐT không hợp lệ! Phải là 10 số bắt đầu bằng 0.'); return; }
            }
            let role = document.getElementById('uc-role').value;
            let cls = document.getElementById('uc-class').value.trim().toUpperCase();
            let expSel = document.getElementById('uc-expiry');
            let expVal = expSel ? expSel.value : '';
            if (!name || id.length < 9){ alert('Nhập họ tên và mã đăng nhập (9-12 số).'); return; }
            if (role === 'student' && !cls){ alert('Học sinh cần nhập lớp.'); return; }
            let roleName = role === 'teacher' ? 'giáo viên' : (role === 'bgh' ? 'Ban Giám Hiệu' : 'học sinh');
            if (!confirm('Tạo tài khoản ' + roleName + ' "' + name + '" (' + id + ')?')) return;
            try {
                await createUserAccount({ id: id, name: name, role: role, className: cls, expiryDays: expVal || undefined, phone: phone || undefined });
                if (typeof showToast === 'function') showToast('Đã tạo tài khoản cho ' + name, 'success');
                else alert('Đã tạo tài khoản cho ' + name);
                userMgrRenderCreate();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }

        // Badge "có đăng ký mới" cho admin (gọi 1 lần khi hub khởi động)
        async function updateRegBadge(){
            try {
                if (!usersIsAdmin()) return;
                let db = await assignFetchUsed();
                let n = (Array.isArray(db.registrations) ? db.registrations : []).filter(function(r){ return r.status === 'pending'; }).length;
                let badge = document.getElementById('admin-users-badge');
                if (badge){ badge.textContent = n ? String(n) : ''; badge.classList.toggle('hidden', !n); }
            } catch(e){}
        }

        // ============ LỚP RIÊNG CỦA GIÁO VIÊN ============
        function openMyClasses(){
            let old = document.getElementById('classes-modal');
            if (old) old.remove();
            let isAdmin = usersIsAdmin();
            let modal = document.createElement('div');
            modal.id = 'classes-modal';
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-3';
            modal.innerHTML =
                '<div class="absolute inset-0 bg-black/50" onclick="document.getElementById(\'classes-modal\').remove()"></div>'
                + '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">'
                + '<div class="flex items-center justify-between px-5 py-3 border-b bg-teal-700 text-white">'
                + '<h3 class="font-black text-sm"><i class="fa-solid fa-users-rectangle mr-2"></i>' + (isAdmin ? 'Tất Cả Lớp Riêng' : 'Lớp Riêng Của Tôi') + '</h3>'
                + '<button onclick="document.getElementById(\'classes-modal\').remove()" class="text-white/80 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button></div>'
                + '<div class="p-5 space-y-3">'
                + '<p class="text-[11px] text-slate-500">Lớp riêng nằm <b>ngoài danh sách nhà trường</b> (vd: lớp dạy thêm). Điểm của học sinh nộp bài với tên lớp này sẽ báo về đúng cho bạn.</p>'
                + '<div class="flex gap-2">'
                + '<input id="new-class-name" class="flex-1 text-sm border rounded-lg px-3 py-2" placeholder="VD: Toán 10 - Dạy thêm tối T3">'
                + '<button onclick="createCustomClass()" class="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg"><i class="fa-solid fa-plus mr-1"></i>Tạo lớp</button>'
                + '</div>'
                + '<div id="classes-body"><p class="text-xs text-slate-400 italic">Đang tải...</p></div>'
                + '</div></div>';
            document.body.appendChild(modal);
            renderMyClasses();
        }

        async function renderMyClasses(){
            let body = document.getElementById('classes-body');
            if (!body) return;
            try {
                let db = await assignFetchUsed();
                let all = Array.isArray(db.custom_classes) ? db.custom_classes : [];
                let isAdmin = usersIsAdmin();
                let mine = isAdmin ? all : all.filter(function(c){ return String(c.created_by) === myUid(); });
                if (!mine.length){ body.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa có lớp riêng nào.</p>'; return; }
                body.innerHTML = '<div class="space-y-2">' + mine.map(function(c){
                    return '<div class="border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm">'
                        + '<div class="flex-1"><p class="font-bold text-slate-800">' + uEsc(c.name) + '</p>'
                        + '<p class="text-[10px] text-slate-400">' + uEsc(c.created_by_name || '') + ' • ' + uEsc((c.created_at || '').slice(0, 10)) + '</p></div>'
                        + '<button onclick="deleteCustomClass(\'' + uEsc(c.id) + '\')" class="text-rose-600 hover:text-rose-800 text-xs font-bold px-2 py-1 rounded bg-rose-50" title="Xoá lớp"><i class="fa-solid fa-trash"></i></button>'
                        + '</div>';
                }).join('') + '</div>';
            } catch(e){ body.innerHTML = '<p class="text-xs text-rose-600">Lỗi: ' + uEsc(e.message || e) + '</p>'; }
        }

        async function createCustomClass(){
            let inp = document.getElementById('new-class-name');
            let name = inp ? inp.value.trim() : '';
            if (!name){ alert('Nhập tên lớp.'); return; }
            try {
                let db = await assignFetchUsed();
                if (!Array.isArray(db.custom_classes)) db.custom_classes = [];
                db.custom_classes.push({ id: 'CLS' + Date.now(), name: name,
                    created_by: myUid(), created_by_name: myUname(), created_at: new Date().toISOString() });
                await assignPushUsed(db, 'Tạo lớp riêng: ' + name + ' (' + myUname() + ')');
                inp.value = '';
                renderMyClasses();
                if (typeof showToast === 'function') showToast('Đã tạo lớp "' + name + '"', 'success');
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }

        async function deleteCustomClass(id){
            if (!confirm('Xoá lớp riêng này?')) return;
            try {
                let db = await assignFetchUsed();
                let all = Array.isArray(db.custom_classes) ? db.custom_classes : [];
                let c = all.filter(function(x){ return String(x.id) === String(id); })[0];
                if (!c) throw new Error('Không tìm thấy lớp.');
                if (!usersIsAdmin() && String(c.created_by) !== myUid()) throw new Error('Bạn chỉ được xoá lớp do mình tạo.');
                db.custom_classes = all.filter(function(x){ return String(x.id) !== String(id); });
                await assignPushUsed(db, 'Xoá lớp riêng: ' + c.name);
                renderMyClasses();
            } catch(e){ alert('Lỗi: ' + (e.message || e)); }
        }

        // Lớp mà giáo viên hiện tại quản lý (phân công chính thức + lớp riêng)
        async function myManagedClasses(){
            let out = [];
            try {
                let db = await assignFetchUsed();
                let assigns = Array.isArray(db.assignments) ? db.assignments : [];
                let uname = myUname().toLowerCase(), uid = myUid();
                assigns.forEach(function(a){
                    let t = String(a.teachers || '');
                    if ((uname && t.toLowerCase().indexOf(uname) >= 0) || (uid && t.indexOf(uid) >= 0)){
                        if (a.class && out.indexOf(a.class) < 0) out.push(a.class);
                    }
                });
                let customs = Array.isArray(db.custom_classes) ? db.custom_classes : [];
                customs.forEach(function(c){
                    if (String(c.created_by) === uid && out.indexOf(c.name) < 0) out.push(c.name);
                });
            } catch(e){}
            return out;
        }
