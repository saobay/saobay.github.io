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

        // ---- Tính thời hạn tài khoản (2026-10-09) ----
        // Quy tắc: GV trường Sào Báy (có trong phân công) -> không thời hạn;
        // HS có mã trong DB trường -> 1 năm; HS ngoài/tự đăng ký -> 3 tháng dùng thử;
        // admin tạo tay -> theo lựa chọn (mặc định 3 tháng cho HS, không thời hạn cho GV)
        function calcExpiryDays(role, userId, db, chosenDays){
            if (chosenDays !== undefined && chosenDays !== null && chosenDays !== '') return chosenDays === 'unlimited' ? null : parseInt(chosenDays, 10);
            if (role === 'teacher'){
                let inSchool = false;
                (db.assignments || []).forEach(function(a){
                    if (String(a.teachers || '').indexOf(String(userId)) >= 0) inSchool = true;
                });
                if (inSchool) return null; // GV trường: không thời hạn
                return null; // GV do admin tạo: mặc định không thời hạn (admin đổi được)
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
            // o: {id, name, role: 'teacher'|'student', className, expiryDays}
            let db = await assignFetchUsed();
            if (!db.passwords) db.passwords = {};
            if (db.passwords[o.id]) throw new Error('Mã ' + o.id + ' đã có tài khoản.');
            db.passwords[o.id] = '12345678'; // mật khẩu mặc định, used.html bắt đổi ngay lần đầu
            if (o.role === 'teacher'){
                if (!db.teachers_registry || Array.isArray(db.teachers_registry)) db.teachers_registry = {};
                db.teachers_registry[o.id] = { name: o.name };
            } else {
                if (!db.students) db.students = {};
                let c = String(o.className || '').toUpperCase().trim();
                if (!c) throw new Error('Học sinh cần có lớp.');
                if (!Array.isArray(db.students[c])) db.students[c] = [];
                db.students[c].push({ id: o.id, name: o.name, dob: '' });
            }
            let expDays = calcExpiryDays(o.role, o.id, db, o.expiryDays);
            if (!db.account_expiry) db.account_expiry = {};
            db.account_expiry[o.id] = { expires_at: expiryDateISO(expDays),
                type: o.role === 'teacher' ? 'teacher' : (expDays === 365 ? 'school_student' : (expDays === 90 ? 'trial' : 'custom')),
                created_at: new Date().toISOString(), created_by: myUname() };
            await assignPushUsed(db, 'Tạo tài khoản ' + (o.role === 'teacher' ? 'giáo viên' : 'học sinh') + ': ' + o.name + ' (' + o.id + ')' + (expDays ? ' [hạn ' + expDays + ' ngày]' : ' [không thời hạn]'));
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
                + '<button id="um-tab-create" onclick="userMgrTab(\'create\')" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700">Tạo tài khoản</button>'
                + '<button id="um-tab-list" onclick="userMgrTab(\'list\')" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700">Danh sách TK</button>'
                + '</div>'
                + '<div id="users-body" class="p-5 overflow-y-auto"><p class="text-xs text-slate-400 italic">Đang tải...</p></div>'
                + '</div>';
            document.body.appendChild(modal);
            userMgrTab('pending');
        }

        function userMgrTab(tab){
            userMgrState.tab = tab;
            let bp = document.getElementById('um-tab-pending'), bc = document.getElementById('um-tab-create'), bl = document.getElementById('um-tab-list');
            if (bp){ bp.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'pending' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'); }
            if (bc){ bc.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'create' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'); }
            if (bl){ bl.className = 'px-4 py-2 rounded-lg font-bold text-xs ' + (tab === 'list' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'); }
            if (tab === 'pending') userMgrLoadPending(); else if (tab === 'list') userMgrLoadList(); else userMgrRenderCreate();
        }

        // Danh sach tai khoan + thoi han + gia han (2026-10-09)
        async function userMgrLoadList(){
            let body = document.getElementById('users-body');
            body.innerHTML = '<p class="text-xs text-slate-400 italic">Đang tải...</p>';
            try {
                let db = await assignFetchUsed();
                let exp = db.account_expiry || {};
                let ids = Object.keys(db.passwords || {}).filter(function(x){ return x !== 'admin'; });
                // Tim ten + vai tro
                function findName(uid){
                    let tr = db.teachers_registry || {};
                    if (tr[uid]) return { name: tr[uid].name, role: 'GV' };
                    let out = null;
                    Object.keys(db.students || {}).forEach(function(c){
                        (db.students[c] || []).forEach(function(st){
                            if (String(st.id) === String(uid)) out = { name: st.name, role: 'HS ' + c };
                        });
                    });
                    return out || { name: '(chưa rõ)', role: '?' };
                }
                let h = '<div class="space-y-2">';
                ids.forEach(function(uid){
                    let info = findName(uid);
                    let e = exp[uid] || {};
                    h += '<div class="border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">'
                        + '<div class="flex-1 min-w-[160px]"><p class="font-black text-slate-800">' + uEsc(info.name) + ' <span class="font-normal text-slate-400">(' + uEsc(uid) + ')</span></p>'
                        + '<p class="text-slate-500">' + uEsc(info.role) + ' • Hạn: ' + fmtExpiry(e.expires_at) + '</p></div>'
                        + '<button onclick="extendAccount(\'' + uEsc(uid) + '\')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg">Gia hạn</button>'
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
                let db = await assignFetchUsed();
                if (!db.account_expiry) db.account_expiry = {};
                let cur = db.account_expiry[uid] || {};
                let base = cur.expires_at && new Date(cur.expires_at).getTime() > Date.now() ? new Date(cur.expires_at) : new Date();
                if (days === 0){ cur.expires_at = null; }
                else { base.setDate(base.getDate() + days); cur.expires_at = base.toISOString(); }
                cur.extended_at = new Date().toISOString(); cur.extended_by = myUname();
                db.account_expiry[uid] = cur;
                await assignPushUsed(db, 'Gia hạn tài khoản ' + uid + (days === 0 ? ' [không thời hạn]' : ' thêm ' + days + ' ngày'));
                if (typeof showToast === 'function') showToast('Đã gia hạn!', 'success');
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
            let db = await assignFetchUsed();
            let regs = Array.isArray(db.registrations) ? db.registrations : [];
            let r = regs.filter(function(x){ return String(x.id) === String(id); })[0];
            if (!r) throw new Error('Không tìm thấy đăng ký.');
            r.status = status;
            r.decided_at = new Date().toISOString();
            r.decided_by = myUname();
            await assignPushUsed(db, (status === 'approved' ? 'Duyệt' : 'Từ chối') + ' đăng ký: ' + r.name + ' (' + r.id + ')');
            return r;
        }

        async function approveReg(id){
            if (!confirm('Duyệt tài khoản này? Mật khẩu mặc định: 12345678 (hệ thống bắt đổi ngay lần đầu đăng nhập).')) return;
            try {
                let db = await assignFetchUsed();
                let regs = Array.isArray(db.registrations) ? db.registrations : [];
                let r = regs.filter(function(x){ return String(x.id) === String(id) && x.status === 'pending'; })[0];
                if (!r) throw new Error('Đăng ký không còn chờ duyệt.');
                await createUserAccount({ id: r.id, name: r.name, role: r.role_requested, className: r.className });
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
            let role = document.getElementById('uc-role').value;
            let cls = document.getElementById('uc-class').value.trim().toUpperCase();
            let expSel = document.getElementById('uc-expiry');
            let expVal = expSel ? expSel.value : '';
            if (!name || id.length < 9){ alert('Nhập họ tên và mã đăng nhập (9-12 số).'); return; }
            if (role === 'student' && !cls){ alert('Học sinh cần nhập lớp.'); return; }
            if (!confirm('Tạo tài khoản ' + (role === 'teacher' ? 'giáo viên' : 'học sinh') + ' "' + name + '" (' + id + ')?')) return;
            try {
                await createUserAccount({ id: id, name: name, role: role, className: cls, expiryDays: expVal || undefined });
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
