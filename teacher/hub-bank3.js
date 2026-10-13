// teacher/hub-bank3.js
// SB_BANK3_20261013_V1: Bank 3 — kho rieng cua GV cho bai Bank 1 cho duyet.
//   - GV khong co quyen duyet day ly thuyet/bai tap -> file vao data/bank3/<uid>/<Mon>/ (thay vi cho-duyet vo hinh)
//   - GV thay bai cua minh trong "Bank 3 cua toi" (module Quan ly): xem truoc, copy link giao HS ngay, tu xoa
//   - Nguoi duyet (admin/BGH/to truong): duyet -> COPY vao Bank 1 (giu ban Bank 3), tra ve -> kem ly do
//   - Index hang doi: data/bank3/index.json
(function(){
'use strict';
if (window.__sbBank3V1) return;
window.__sbBank3V1 = true;

var OWNER = 'saobay', REPO = 'saobay.github.io', BRANCH = 'main';
var BANK3_INDEX = 'data/bank3/index.json';
var GAS_URL = (typeof API_URL !== 'undefined') ? API_URL
    : 'https://script.google.com/macros/s/AKfycbxXntnyiuk4NaQgSfjMu3eZSum-nHIOh4oPM8XMcthn55ExTAnq1AUXk3GLzVFE2Kq7/exec';

function rawUrl(p){ return 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + p + '?t=' + Date.now(); }
function myUser(){ try { return (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null; } catch(e){ return null; } }
function myUid(){ var u = myUser(); return u ? String(u.id || '') : ''; }
function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtTime(iso){ try { return new Date(iso).toLocaleString('vi-VN', {hour12:false}); } catch(e){ return String(iso || ''); } }
// Sanitize teacher_id de dung trong duong dan GitHub
window.sbBank3SanitizeUid = function(uid){ return String(uid || '').replace(/[^a-zA-Z0-9]/g, '') || 'gv'; };

// ---------- GAS push / delete ----------
async function b3GasPush(filePath, content, commitMessage, title){
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
async function b3GasDelete(filePath, commitMessage){
    var rx = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type: 'DELETE_FROM_GITHUB', filePath: filePath, commitMessage: commitMessage || ('Xoa: ' + filePath) }) });
    var rj = null; try { rj = await rx.json(); } catch(e){}
    if (!rj || rj.status !== 'success') throw new Error(String((rj && rj.message) || 'Xoa that bai.'));
    return true;
}

// ---------- Index Bank 3 ----------
async function sbBank3LoadIndex(){
    try {
        var r = await fetch(rawUrl(BANK3_INDEX), { cache: 'no-store' });
        if (!r.ok) return { items: [], approvedTotal: 0 };
        var j = await r.json();
        if (!j || !Array.isArray(j.items)) return { items: [], approvedTotal: 0 };
        if (typeof j.approvedTotal !== 'number') j.approvedTotal = 0;
        return j;
    } catch(e){ return { items: [], approvedTotal: 0 }; }
}
async function sbBank3SaveIndex(idx){
    await b3GasPush(BANK3_INDEX, JSON.stringify(idx, null, 1), 'Cap nhat Bank 3 index', 'bank3 index');
}
// Goi tu hub-publish.js sau khi day file Bank 3 thanh cong
window.sbBank3RecordPending = async function(rec){
    var idx = await sbBank3LoadIndex();
    idx.items = idx.items || [];
    rec.id = 'b3' + Date.now();
    rec.status = 'pending';
    rec.reason = '';
    idx.items.push(rec);
    await sbBank3SaveIndex(idx);
    return rec.id;
};
// Tuong thich nguoc: code cu goi sbAuditRecordPending
window.sbAuditRecordPending = window.sbBank3RecordPending;

// ---------- UI "Bank 3 cua toi" trong module Quan ly ----------
window.renderBank3Section = function(){
    try {
        var view = document.getElementById('module-manage-view');
        if (!view) return;
        var sec = document.getElementById('bank3-my-section');
        if (!sec){
            sec = document.createElement('div');
            sec.id = 'bank3-my-section';
            var anchor = document.getElementById('my-audit-status-box');
            if (anchor && anchor.parentNode === view) view.insertBefore(sec, anchor.nextSibling);
            else view.insertBefore(sec, view.firstChild);
        }
        var uid = myUid();
        if (!uid){ sec.innerHTML = ''; return; }
        sec.innerHTML = '<div class="p-3 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Đang tải Bank 3...</div>';
        sbBank3LoadIndex().then(function(idx){
            var mine = (idx.items || []).filter(function(x){ return String(x.teacher_id || x.pushedBy) === uid; });
            mine.sort(function(a, b){ return String(b.submitted_at || b.pushedAt || '').localeCompare(String(a.submitted_at || a.pushedAt || '')); });
            var html = '<div class="border border-violet-300 bg-violet-50 rounded-xl p-3 mb-1">'
                + '<div class="flex items-center justify-between mb-1 flex-wrap gap-1">'
                + '<div class="text-xs font-extrabold text-violet-900">📦 Bank 3 của tôi (' + mine.length + ')</div>'
                + '<span class="text-[10px] text-violet-700">Bài chờ duyệt — bạn xem / giao cho HS ngay được</span></div>';
            if (!mine.length){
                html += '<div class="text-[11px] text-slate-500 italic">Chưa có bài nào trong Bank 3. Bài bạn đẩy lên mà chưa có quyền duyệt sẽ vào đây.</div>';
            }
            mine.forEach(function(it){ html += bank3Row(it); });
            html += '</div>';
            sec.innerHTML = html;
        }).catch(function(e){
            sec.innerHTML = '<div class="text-[11px] text-red-500 p-2">Không tải được Bank 3: ' + esc(e.message || e) + '</div>';
        });
    } catch(e){ console.log('bank3 render note:', e); }
};

function bank3StatusBadge(it){
    var st = it.status || 'pending';
    if (st === 'approved') return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">✅ Đã duyệt</span>';
    if (st === 'rejected') return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900">❌ Bị trả về</span>';
    return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">⏳ Chờ duyệt</span>';
}

function bank3Row(it){
    var id = esc(it.id);
    var st = it.status || 'pending';
    var extra = '';
    if (st === 'approved'){
        extra = '<div class="text-[10px] text-emerald-700 mt-0.5">Đã vào Bank chung' + (it.approvedAt ? ' lúc ' + esc(fmtTime(it.approvedAt)) : '') + ' — bản Bank 3 này bạn vẫn giữ.</div>';
    } else if (st === 'rejected'){
        extra = '<div class="text-[10px] text-red-700 mt-0.5">Lý do trả về: <b>' + esc(it.reason || it.rejectReason || '') + '</b></div>';
    }
    var link = 'https://saobay.github.io/' + it.path;
    return '<div class="py-2 border-t border-violet-200 first:border-t-0" id="bank3-row-' + id + '">'
        + '<div class="flex items-start justify-between gap-2 flex-wrap">'
        + '<div class="min-w-0 flex-1"><div class="text-xs font-bold text-slate-800">' + esc(it.title) + '</div>'
        + '<div class="text-[10px] text-slate-500 mt-0.5">' + esc(it.subject || '') + (it.grade ? ' · K' + esc(it.grade) : '') + (it.chapter ? ' · ' + esc(it.chapter) : '')
        + ' · ' + esc(it.type || '') + ' · ' + esc(fmtTime(it.submitted_at || it.pushedAt)) + '</div>' + extra + '</div>'
        + '<div class="flex items-center gap-1 shrink-0">' + bank3StatusBadge(it) + '</div></div>'
        + '<div class="flex items-center gap-1.5 mt-1.5 flex-wrap">'
        + '<button onclick="bank3PreviewToggle(\'' + id + '\')" class="text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold">👁 Xem</button>'
        + '<button onclick="bank3CopyLink(\'' + id + '\')" class="text-[10px] px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold">🔗 Copy link</button>'
        + '<button onclick="bank3DeleteItem(\'' + id + '\')" class="text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-red-50 text-red-600 font-bold">🗑 Xóa</button>'
        + '</div>'
        + '<div id="bank3-prev-' + id + '" class="hidden mt-2"><iframe src="' + esc(link) + '" class="w-full h-[420px] border border-slate-200 rounded-lg bg-white"></iframe></div>'
        + '</div>';
}

window.bank3PreviewToggle = function(id){
    var el = document.getElementById('bank3-prev-' + id);
    if (el) el.classList.toggle('hidden');
};

window.bank3CopyLink = async function(id){
    try {
        var idx = await sbBank3LoadIndex();
        var it = (idx.items || []).find(function(x){ return String(x.id) === String(id); });
        if (!it || !it.path){ alert('Không tìm thấy bài.'); return; }
        var link = 'https://saobay.github.io/' + it.path;
        var ok = false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(link); ok = true; }
        } catch(e){}
        if (!ok){
            var ta = document.createElement('textarea');
            ta.value = link; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { ok = document.execCommand('copy'); } catch(e2){}
            document.body.removeChild(ta);
        }
        if (ok) alert('🔗 Đã copy link bài:\n' + link + '\n\nGửi link này cho HS để các em mở học / làm bài ngay.');
        else prompt('Copy link bài thủ công:', link);
    } catch(e){ alert('Lỗi: ' + (e.message || e)); }
};

window.bank3DeleteItem = async function(id){
    if (!confirm('Xóa bài này khỏi Bank 3? File và bản ghi sẽ bị xóa hẳn.')) return;
    try {
        var idx = await sbBank3LoadIndex();
        var it = (idx.items || []).find(function(x){ return String(x.id) === String(id); });
        if (!it){ alert('Bài không còn.'); window.renderBank3Section(); return; }
        if (String(it.teacher_id || it.pushedBy) !== myUid()){ alert('Bạn chỉ được xóa bài của mình.'); return; }
        if (it.path){
            try { await b3GasDelete(it.path, 'GV tu xoa bai Bank 3: ' + (it.fileName || '')); } catch(eDel){ console.log('bank3 delete note:', eDel); }
        }
        idx.items = (idx.items || []).filter(function(x){ return String(x.id) !== String(id); });
        await sbBank3SaveIndex(idx);
        window.renderBank3Section();
    } catch(e){ alert('Lỗi khi xóa: ' + (e.message || e)); }
};

// Hook vao switchTeacherModule de render khi mo module Quan ly (chain voi wrapper cua hub-audit.js)
setTimeout(function(){
    if (window.__sbBank3SwitchWrapped) return;
    if (typeof window.switchTeacherModule !== 'function') return;
    window.__sbBank3SwitchWrapped = true;
    var prev = window.switchTeacherModule;
    window.switchTeacherModule = function(modId){
        var r = prev.apply(this, arguments);
        try { if (modId === 'manage' && typeof window.renderBank3Section === 'function') window.renderBank3Section(); } catch(e){}
        return r;
    };
}, 1200);

})();
