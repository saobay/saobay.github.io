// teacher/hub-audit.js
// SB_AUDITFLOW_20261013_V1: Luong KIEM DUYET noi dung Bank 1 (ly thuyet + bai tap).
//   - GV khong co quyen duyet day bai -> file vao data/bank3/<uid>/<Mon>/ + ban ghi data/bank3/index.json (SB_BANK3_20261013_V1)
//   - Nguoi co quyen duyet (admin / bgh / to truong trong data/content-reviewers.json) day -> vao thang, hau to _id<uid>
//   - Tab "3. Tham Dinh & Duyet" chi hien voi nguoi co quyen duyet (ghi de len hideAuditTab cu)
//   - Hang doi duyet: xem truoc (iframe) -> Duyet (chuyen file vao thu muc that, hau to _id<nguoi duyet>)
//     / Tra ve (ly do bat buoc, giu ban ghi + file, GV tu xoa)
//   - GV tu xem bai minh cho duyet / bi tra ve trong module Quan ly + nut Xoa
(function(){
'use strict';
if (window.__sbAuditFlowV1) return;
window.__sbAuditFlowV1 = true;

var OWNER = 'saobay', REPO = 'saobay.github.io', BRANCH = 'main';
var REVIEWERS_PATH = 'data/content-reviewers.json';
var AUDIT_INDEX_PATH = 'data/bank3/index.json'; // SB_BANK3_20261013_V1: hang doi Bank 3
var GAS_URL = (typeof API_URL !== 'undefined') ? API_URL
    : 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';

function rawUrl(p){ return 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + p + '?t=' + Date.now(); }
function myUser(){ try { return (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null; } catch(e){ return null; } }
function myUid(){ var u = myUser(); return u ? String(u.id || '') : ''; }
function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtTime(iso){ try { var d = new Date(iso); return d.toLocaleString('vi-VN', {hour12:false}); } catch(e){ return String(iso||''); } }

// ---------- GAS push / delete (copy pattern hub-examsched.js + hub-manage.js) ----------
async function auditGasPush(filePath, content, commitMessage, title){
    var author = myUser() ? (myUser().name || myUser().id || 'GV') : 'GV';
    var lastErr = null;
    for (var attempt = 0; attempt < 3; attempt++){
        var pushRes = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ type: 'PUSH_TO_GITHUB', filePath: filePath, content: content,
                commitMessage: commitMessage, title: title || commitMessage, author: author })
        });
        var rj = null; try { rj = await pushRes.json(); } catch(e){}
        if (rj && rj.status === 'success') return true;
        var emsg = String((rj && rj.message) || '');
        if (emsg.indexOf('409') < 0) throw new Error(emsg || 'Luu that bai.');
        lastErr = new Error(emsg || 'Xung dot, dang thu lai...');
        await new Promise(function(r){ setTimeout(r, 1500); });
    }
    throw lastErr || new Error('Khong luu duoc, vui long thu lai.');
}
async function auditGasDelete(filePath, commitMessage){
    var rx = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type: 'DELETE_FROM_GITHUB', filePath: filePath, commitMessage: commitMessage || ('Xoa: ' + filePath) }) });
    var rj = null; try { rj = await rx.json(); } catch(e){}
    if (!rj || rj.status !== 'success') throw new Error(String((rj && rj.message) || 'Xoa that bai.'));
    return true;
}

// ---------- Quyen duyet: admin / bgh / to truong (data/content-reviewers.json) ----------
var _revCache = null, _revCacheAt = 0;
async function loadContentReviewers(){
    if (_revCache && (Date.now() - _revCacheAt) < 60000) return _revCache;
    try {
        var r = await fetch(rawUrl(REVIEWERS_PATH), { cache: 'no-store' });
        if (!r.ok){ _revCache = { reviewers: [] }; }
        else {
            var j = await r.json();
            _revCache = (j && Array.isArray(j.reviewers)) ? j : { reviewers: [] };
        }
    } catch(e){ _revCache = { reviewers: [] }; }
    _revCacheAt = Date.now();
    return _revCache;
}
window.sbContentCanReview = async function(){
    try {
        var u = myUser(); if (!u) return false;
        if (u.role === 'admin' || u.role === 'bgh') return true;
        var rev = await loadContentReviewers();
        var uid = myUid();
        return (rev.reviewers || []).some(function(x){ return String((x && x.id) || x) === uid; });
    } catch(e){ return false; }
};
window.sbIsContentAdmin = function(){
    try { var u = myUser(); return !!(u && u.role === 'admin'); } catch(e){ return false; }
};

// ---------- Hang doi cho duyet ----------
async function auditLoadIndex(){
    try {
        var r = await fetch(rawUrl(AUDIT_INDEX_PATH), { cache: 'no-store' });
        if (!r.ok) return { items: [], approvedTotal: 0 };
        var j = await r.json();
        if (!j || !Array.isArray(j.items)) return { items: [], approvedTotal: 0 };
        if (typeof j.approvedTotal !== 'number') j.approvedTotal = 0;
        return j;
    } catch(e){ return { items: [], approvedTotal: 0 }; }
}
async function auditSaveIndex(idx){
    await auditGasPush(AUDIT_INDEX_PATH, JSON.stringify(idx, null, 1), 'Cap nhat hang doi Bank 3', 'bank3 index');
}
// SB_BANK3_20261013_V1: giu de tuong thich — hub-bank3.js alias sang sbBank3RecordPending
window.sbAuditRecordPending = async function(rec){
    var idx = await auditLoadIndex();
    idx.items = idx.items || [];
    rec.id = 'cd' + Date.now();
    rec.status = 'pending';
    idx.items.push(rec);
    await auditSaveIndex(idx);
    return rec.id;
};

// ---------- Gate tab "Tham Dinh & Duyet" (ghi de hideAuditTab cu) ----------
function gateAuditTab(){
    var tab = document.getElementById('mod-tab-audit');
    var view = document.getElementById('module-audit-view');
    if (!tab && !view) return;
    window.sbContentCanReview().then(function(ok){
        if (tab) tab.style.display = ok ? '' : 'none';
        if (view && ok) view.style.display = '';
    }).catch(function(){});
}
setTimeout(gateAuditTab, 4000);
setInterval(gateAuditTab, 10000);

// ---------- Render hang doi (duoc switchTeacherModule goi khi mo module audit) ----------
window.renderAuditList = function(){
    try {
        var container = document.getElementById('audit-lessons-container');
        var view = document.getElementById('module-audit-view');
        if (view) view.style.display = '';
        if (!container) return;
        window.sbContentCanReview().then(function(ok){
            if (!ok){
                container.innerHTML = '<div class="p-4 text-center text-sm text-slate-500">Bạn không có quyền thẩm định nội dung.</div>';
                return;
            }
            container.innerHTML = '<div class="p-4 text-center text-sm text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải hàng đợi...</div>';
            auditLoadIndex().then(function(idx){
                renderAuditQueue(container, idx);
            }).catch(function(e){
                container.innerHTML = '<div class="p-4 text-center text-sm text-red-500">Không tải được hàng đợi: ' + esc(e.message || e) + '</div>';
            });
        });
        renderReviewerBox();
    } catch(e){ console.error('[audit] renderAuditList loi:', e); }
};

function renderAuditQueue(container, idx){
    var pend = (idx.items || []).filter(function(x){ return x.status === 'pending'; });
    var rej = (idx.items || []).filter(function(x){ return x.status === 'rejected'; });
    var pc = document.getElementById('audit-pending-count'); if (pc) pc.textContent = pend.length;
    var ac = document.getElementById('audit-approved-count'); if (ac) ac.textContent = idx.approvedTotal || 0;
    var html = '';
    if (!pend.length && !rej.length){
        html = '<div class="p-6 text-center text-sm text-slate-400">🎉 Không có bài nào chờ duyệt.</div>';
    }
    pend.forEach(function(it){ html += auditCard(it, true); });
    if (rej.length){
        html += '<div class="text-xs font-extrabold uppercase text-slate-400 mt-4 mb-1">Bài đã trả về (' + rej.length + ')</div>';
        rej.forEach(function(it){ html += auditCard(it, false); });
    }
    container.innerHTML = html;
}

function auditCard(it, isPending){
    var id = esc(it.id);
    var previewUrl = 'https://saobay.github.io/' + it.path;
    var badge = isPending
        ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">⏳ Chờ duyệt</span>'
        : '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">❌ Đã trả về</span>';
    var btns = isPending
        ? '<button onclick="auditPreviewToggle(\'' + id + '\')" class="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold">👁 Xem trước</button> '
          + '<button onclick="auditApprove(\'' + id + '\')" class="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold">✅ Duyệt</button> '
          + '<button onclick="auditRejectShow(\'' + id + '\')" class="text-[11px] px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold">❌ Trả về</button>'
        : '<span class="text-[11px] text-slate-500">Lý do trả về: <b>' + esc(it.reason || it.rejectReason || '') + '</b> — GV tự xóa bài của mình trong mục Quản lý.</span>';
    return '<div class="border border-slate-200 rounded-xl p-3 bg-white" id="audit-card-' + id + '">'
        + '<div class="flex items-start justify-between gap-2 flex-wrap">'
        +   '<div class="min-w-0"><div class="text-sm font-extrabold text-slate-800">' + esc(it.title) + '</div>'
        +   '<div class="text-[11px] text-slate-500 mt-0.5">' + esc(it.subject || '') + (it.grade ? ' · Khối ' + esc(it.grade) : '') + (it.chapter ? ' · ' + esc(it.chapter) : '')
        +   ' · ' + esc(it.type || '') + ' · 👤 ' + esc(it.teacher_name || it.teacher_id || it.pushedByName || it.pushedBy || '') + ' · 🕐 ' + esc(fmtTime(it.submitted_at || it.pushedAt)) + '</div></div>'
        +   '<div class="flex items-center gap-1.5 flex-wrap">' + badge + btns + '</div>'
        + '</div>'
        + '<div id="audit-prev-' + id + '" class="hidden mt-2"><iframe src="' + esc(previewUrl) + '" class="w-full h-[420px] border border-slate-200 rounded-lg bg-white"></iframe></div>'
        + '<div id="audit-rej-' + id + '" class="hidden mt-2">'
        +   '<input id="audit-rej-input-' + id + '" placeholder="Nhập lý do trả về (bắt buộc)..." class="w-full px-2 py-1.5 border border-red-300 rounded-lg text-xs mb-1">'
        +   '<button onclick="auditRejectDo(\'' + id + '\')" class="text-[11px] px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Xác nhận trả về</button>'
        + '</div>'
        + '</div>';
}

window.auditPreviewToggle = function(id){
    var el = document.getElementById('audit-prev-' + id);
    if (el) el.classList.toggle('hidden');
};

window.auditApprove = async function(id){
    // SB_BANK3_20261013_V1: duyet = COPY vao Bank 1, GIU NGUYEN ban Bank 3 cua GV + danh dau approved
    if (!confirm('Duyệt bài này? Bài sẽ xuất hiện cho học sinh ngay.')) return;
    try {
        var idx = await auditLoadIndex();
        var it = (idx.items || []).find(function(x){ return String(x.id) === String(id); });
        if (!it || it.status !== 'pending'){ alert('Bài không còn trong hàng chờ.'); window.renderAuditList(); return; }
        var uid = myUid().replace(/[^a-zA-Z0-9]/g, '');
        var approvedName = String(it.fileName || '').replace(/_none/i, '_id' + uid);
        if (approvedName === it.fileName) approvedName = String(it.fileName || '').replace(/\.html$/i, '_id' + uid + '.html');
        var realPath = (it.targetFolder || '') + '/' + approvedName;
        // 1. Doc noi dung file tu Bank 3
        var r = await fetch(rawUrl(it.path), { cache: 'no-store' });
        if (!r.ok) throw new Error('Không đọc được file Bank 3 (HTTP ' + r.status + ')');
        var content = await r.text();
        // 2. COPY vao thu muc Bank 1 that voi hau to _id<nguoi duyet> (KHONG xoa ban Bank 3)
        await auditGasPush(realPath, content, 'Duyet bai Bank 3 -> Bank 1: ' + (it.title || it.fileName), it.title || approvedName);
        // 3. Danh dau approved, giu file Bank 3 + ban ghi de GV theo doi
        it.status = 'approved';
        it.approvedBy = myUser() ? (myUser().name || myUid()) : '';
        it.approvedAt = new Date().toISOString();
        it.approvedPath = realPath;
        idx.approvedTotal = (idx.approvedTotal || 0) + 1;
        await auditSaveIndex(idx);
        alert('✅ Đã duyệt! Bài "' + (it.title || '') + '" đã vào kho chung. Bản Bank 3 của GV được giữ nguyên.');
        window.renderAuditList();
    } catch(e){ alert('Lỗi khi duyệt: ' + (e.message || e)); }
};

window.auditRejectShow = function(id){
    var el = document.getElementById('audit-rej-' + id);
    if (el){ el.classList.remove('hidden'); var inp = document.getElementById('audit-rej-input-' + id); if (inp) inp.focus(); }
};
window.auditRejectDo = async function(id){
    var inp = document.getElementById('audit-rej-input-' + id);
    var reason = inp ? inp.value.trim() : '';
    if (!reason){ alert('Vui lòng nhập lý do trả về.'); return; }
    try {
        var idx = await auditLoadIndex();
        var it = (idx.items || []).find(function(x){ return String(x.id) === String(id); });
        if (!it){ alert('Bài không còn trong hàng chờ.'); window.renderAuditList(); return; }
        it.status = 'rejected';
        it.rejectReason = reason;
        it.rejectedBy = myUser() ? (myUser().name || myUid()) : '';
        it.rejectedAt = new Date().toISOString();
        await auditSaveIndex(idx);
        alert('Đã trả bài về cho giáo viên kèm lý do.');
        window.renderAuditList();
    } catch(e){ alert('Lỗi khi trả về: ' + (e.message || e)); }
};

// ---------- GV tu xem / xoa bai cho duyet cua minh (trong module Quan ly) ----------
async function renderMyAuditStatus(){
    try {
        // SB_BANK3_20261013_V1: Bank 3 section (hub-bank3.js) thay the box cu -> tranh trung lap
        if (typeof window.renderBank3Section === 'function'){
            var _old = document.getElementById('my-audit-status-box');
            if (_old) _old.innerHTML = '';
            return;
        }
        var view = document.getElementById('module-manage-view');
        if (!view) return;
        var box = document.getElementById('my-audit-status-box');
        if (!box){
            box = document.createElement('div');
            box.id = 'my-audit-status-box';
            view.insertBefore(box, view.firstChild);
        }
        var uid = myUid();
        if (!uid){ box.innerHTML = ''; return; }
        var idx = await auditLoadIndex();
        var mine = (idx.items || []).filter(function(x){ return String(x.pushedBy) === uid && (x.status === 'pending' || x.status === 'rejected'); });
        if (!mine.length){ box.innerHTML = ''; return; }
        var html = '<div class="border border-amber-300 bg-amber-50 rounded-xl p-3 mb-1">'
            + '<div class="text-xs font-extrabold text-amber-900 mb-2">📋 Bài tôi đã gửi chờ kiểm duyệt (' + mine.length + ')</div>';
        mine.forEach(function(it){
            var badge = it.status === 'pending'
                ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">⏳ Chờ duyệt</span>'
                : '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900">❌ Bị trả về: ' + esc(it.rejectReason || '') + '</span>';
            html += '<div class="flex items-center justify-between gap-2 py-1.5 border-t border-amber-200 first:border-t-0">'
                + '<div class="min-w-0"><div class="text-xs font-bold text-slate-800 truncate">' + esc(it.title) + '</div>'
                + '<div class="text-[10px] text-slate-500">' + esc(it.subject || '') + ' · ' + esc(fmtTime(it.submitted_at || it.pushedAt)) + '</div></div>'
                + '<div class="flex items-center gap-1.5 shrink-0">' + badge
                + '<button onclick="myAuditDelete(\'' + esc(it.id) + '\')" class="text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-red-50 text-red-600 font-bold">🗑 Xóa</button>'
                + '</div></div>';
        });
        html += '</div>';
        box.innerHTML = html;
    } catch(e){ console.log('myAuditStatus note:', e); }
}
window.myAuditDelete = async function(id){
    if (!confirm('Xóa bài chờ duyệt này? File và bản ghi sẽ bị xóa hẳn.')) return;
    try {
        var idx = await auditLoadIndex();
        var it = (idx.items || []).find(function(x){ return String(x.id) === String(id); });
        if (it && String(it.teacher_id || it.pushedBy) !== myUid()){ alert('Bạn chỉ được xóa bài của mình.'); return; }
        if (it && it.path){
            try { await auditGasDelete(it.path, 'GV tu xoa bai cho duyet: ' + (it.fileName || '')); } catch(eDel){ console.log('audit self-delete note:', eDel); }
        }
        idx.items = (idx.items || []).filter(function(x){ return String(x.id) !== String(id); });
        await auditSaveIndex(idx);
        renderMyAuditStatus();
    } catch(e){ alert('Lỗi khi xóa: ' + (e.message || e)); }
};
// Moc vao switchTeacherModule (ban cua MONITORFIX) de hien box khi mo module Quan ly
setTimeout(function(){
    if (window.__sbAuditSwitchWrapped) return;
    if (typeof window.switchTeacherModule !== 'function') return;
    window.__sbAuditSwitchWrapped = true;
    var prev = window.switchTeacherModule;
    window.switchTeacherModule = function(modId){
        var r = prev.apply(this, arguments);
        try { if (modId === 'manage') renderMyAuditStatus(); } catch(e){}
        return r;
    };
}, 1200);

// ---------- Phan quyen to truong (chi admin) ----------
function renderReviewerBox(){
    try {
        var box = document.getElementById('content-reviewer-box');
        if (!box) return;
        var isAdm = window.sbIsContentAdmin();
        box.classList.toggle('hidden', !isAdm);
        if (isAdm) sbCReviewerRefresh();
    } catch(e){}
}
window.sbCReviewerAdd = async function(){
    var idEl = document.getElementById('content-reviewer-id');
    var nmEl = document.getElementById('content-reviewer-name');
    var id = idEl ? idEl.value.trim() : '', nm = nmEl ? nmEl.value.trim() : '';
    if (!id){ alert('Nhập mã GV.'); return; }
    if (!window.sbIsContentAdmin()){ alert('Chỉ admin được phân quyền.'); return; }
    try {
        var rev = await loadContentReviewers();
        rev.reviewers = rev.reviewers || [];
        if (!rev.reviewers.some(function(x){ return String((x && x.id) || x) === id; }))
            rev.reviewers.push({ id: id, name: nm, setAt: new Date().toISOString() });
        _revCache = rev; _revCacheAt = Date.now();
        await auditGasPush(REVIEWERS_PATH, JSON.stringify(rev, null, 1), 'Them quyen kiem duyet noi dung: ' + id, 'Quyen kiem duyet');
        if (idEl) idEl.value = ''; if (nmEl) nmEl.value = '';
        sbCReviewerRefresh();
    } catch(e){ alert('Không cập nhật được: ' + (e.message || e)); }
};
window.sbCReviewerRemove = async function(id){
    if (!confirm('Gỡ quyền kiểm duyệt của ' + id + '?')) return;
    if (!window.sbIsContentAdmin()){ alert('Chỉ admin được phân quyền.'); return; }
    try {
        var rev = await loadContentReviewers();
        rev.reviewers = (rev.reviewers || []).filter(function(x){ return String((x && x.id) || x) !== String(id); });
        _revCache = rev; _revCacheAt = Date.now();
        await auditGasPush(REVIEWERS_PATH, JSON.stringify(rev, null, 1), 'Go quyen kiem duyet noi dung: ' + id, 'Quyen kiem duyet');
        sbCReviewerRefresh();
    } catch(e){ alert('Không cập nhật được: ' + (e.message || e)); }
};
window.sbCReviewerRefresh = function(){ sbCReviewerRefresh(); };
function sbCReviewerRefresh(){
    try {
        var list = document.getElementById('content-reviewer-list');
        if (!list) return;
        loadContentReviewers().then(function(rev){
            var arr = rev.reviewers || [];
            list.innerHTML = arr.length
                ? arr.map(function(x){
                    return '<div class="flex items-center justify-between py-0.5 border-b border-emerald-200 last:border-0">'
                        + '<span>🛡️ <b>' + esc(x.id) + '</b>' + (x.name ? ' — ' + esc(x.name) : '') + '</span>'
                        + '<button onclick="sbCReviewerRemove(\'' + esc(String(x.id)).replace(/'/g,"\\'") + '\')" class="text-red-600 text-[11px] font-bold">Gỡ</button></div>';
                }).join('')
                : '<span class="text-slate-400 italic">Chưa có tổ trưởng nào được gán.</span>';
        });
    } catch(e){}
}

})();
