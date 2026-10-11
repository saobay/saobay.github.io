// SAOBAY_STUDENT_EXAM_TAB_VERSION:20261012_0600
// ĐÃ GỠ tab "Bài Kiểm Tra" riêng (2026-10-12 theo yêu cầu của GV):
// HS chỉ còn 2 tab (Học Lý Thuyết / Làm Bài Tập & Đề Thi).
// Đề kiểm tra được giao hiện trong tab "Làm Bài Tập & Đề Thi" (khung đỏ nổi bật)
// và trong mục "Lớp của tôi" ở trang chủ (khối SAOBAY MYCLASS TASKS trong index.html).
(function(){
    'use strict';
    function cleanup(){
        var b = document.getElementById('tab-exam'); if (b) b.remove();
        var c = document.getElementById('exam-list-container'); if (c) c.remove();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(cleanup, 1200); setTimeout(cleanup, 3000); });
    } else {
        setTimeout(cleanup, 1200); setTimeout(cleanup, 3000);
    }
})();
