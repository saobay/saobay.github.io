# Mèo con 7 — Soạn Chuyên đề thường môn Toán THPT còn thiếu (lệnh thầy 13:40 06/11/2026)

Thầy lệnh trong phòng họp Firebase (tin -P5j_VXsr5m77qYlY9Bl): "Còn 1 mèo rỗi làm chuyên đề thpt đi tương tự nèo làm thcs" — giao mèo con mới làm chuyên đề THPT đúng cách mèo con 5 đang làm THCS (việc #81, phiên Jules 5).

## Giao cho Jules (1 phiên = 1 việc, 1 nhánh + 1 PR riêng)

**Kho:** `saobay-jules` (riêng tư). **File nền đã có sẵn trong kho (do mèo con 5 đưa lên, không cần đưa lại):** thư mục `chuyende/` gồm:
- `chuyende/index.json` — mục lục live hiện hành (195 chuyên đề, trong đó Toán 109: lớp 10: 16, 11: 15, 12: 20).
- `chuyende/mau-coban.txt` — file mẫu mức cơ bản (492 dòng, "Chuyên đề Phân số").
- `chuyende/mau-nangcao.txt` — file mẫu mức nâng cao (469 dòng, chỉ để tham khảo cấu trúc, KHÔNG viết mức nâng cao trong phiên này).
- `chuyende/chapters-toan.json` — danh mục chương/bài Toán SGK Kết nối tri thức các lớp 6–12 (nguồn đối chiếu).
- Brief này lưu tại `chuyende-thpt/BRIEF.md` (chỉ để lưu vết, phiên làm việc đọc brief từ phần mô tả phiên).

Chỉ làm trong thư mục `chuyende/`. Không deploy, không giữ token, không sửa file nào ngoài `chuyende/`.

**HẠN CHÓT: phiên phải xong trước 11/11/2026** — trang Jules báo Jules chỉ còn tới 11/11/2026 để hoàn thiện các phiên đang chạy (ngừng hẳn 31/12/2026). Làm gọn, viết càng nhiều càng tốt trong thời gian còn lại; chưa xong thì liệt kê phần còn lại để giao phiên tiếp theo.

## Việc làm — 2 bước, đúng thứ tự

### Bước 1: Rà soát thiếu — CHỈ lớp 10–12 (làm trước, ghi kết quả vào PR)
Đối chiếu `chuyende/index.json` (tiêu đề + tóm tắt từng chuyên đề Toán lớp 10, 11, 12) với `chuyende/chapters-toan.json`:
- Một chương/bài được coi là ĐÃ CÓ chuyên đề nếu có chuyên đề cùng chủ đề bao phủ nó (kể cả khi tên không khớp từng chữ — ví dụ chuyên đề "Ước và bội, ƯCLN và BCNN" đã bao phủ cả chương "Tính chia hết"). Chỉ liệt kê là THIẾU khi thật sự không có chuyên đề nào bao phủ.
- **CHỈ rà lớp 10–12.** Mèo con 5 đang làm song song lớp 6–9 trong phiên riêng — KHÔNG rà, KHÔNG viết lớp 6–9 trong phiên này.
- Ghi danh sách thiếu chốt được (tên chương/bài + lớp) vào phần mô tả của PR.

### Bước 2: Viết chuyên đề mới — CHỈ môn Toán, CHỈ mức cơ bản, CHỈ lớp 10–12
- Viết file mới cho MỖI chủ đề thiếu đã chốt ở bước 1 — TỐI THIỂU 50 file, càng nhiều càng tốt (thầy sửa 13:47 06/11: bỏ giới hạn tối đa 12); viết theo thứ tự lớp 10 → 12, thiếu bao nhiêu viết hết bấy nhiêu; nếu một phiên không viết hết thì liệt kê phần còn lại vào mô tả PR để giao phiên tiếp theo làm nốt cho đủ 50.
- Mỗi file đặt tại `chuyende/TOAN_{lớp}/<slug>.txt` (slug tiếng Việt không dấu, gạch nối, ví dụ `tinh-chia-het.txt`).
- Làm theo ĐÚNG cấu trúc `mau-coban.txt`: dòng đầu `# Chuyên đề <tên>`; đoạn mở đầu nêu mạch kiến thức + cách học; `## Lý thuyết trọng tâm` — mỗi ý có ví dụ bằng số cụ thể ngay sau ý đó; các `## Dạng N: ...` — mỗi dạng có `### Phương pháp`, `### Ví dụ mẫu` (mỗi ví dụ có "Tư duy giải bài" trước lời giải), rồi `### Bài tập` (trắc nghiệm + tự luận, kèm đáp án/lời giải ngắn cuối file).
- Nội dung bám SGK Kết nối tri thức, đúng chương trình lớp đó; công thức toán viết trong `$...$` (không dùng `\(...\)`, không dùng ký tự Unicode thay công thức như x², √, π); số âm viết dấu trừ chuẩn, lời văn tiếng Việt đúng chính tả.
- KHÔNG sửa bất kỳ file chuyên đề nào đã có, KHÔNG đổi tên/xóa file cũ.
- **KHÔNG sửa `chuyende/index.json` trong phiên này** — mèo con 5 đang chạy song song cũng sửa file này, sửa cùng lúc sẽ xung đột khi gộp. Thay vào đó, liệt kê ĐẦY ĐỦ entry mới cho từng file đã viết vào phần mô tả của PR (mỗi entry đủ khóa: `id` (`toan{lớp}-{slug}`), `level` (`coban`), `subject` (`TOAN`), `grade` (số), `title` (`Chuyên đề <tên>`), `file` (`TOAN_{lớp}/<slug>.txt`), `summary` (1–2 câu nêu nội dung + dạng bài)). Mèo 1 gộp index.json sau khi soát.

## Không làm trong phiên này
- KHÔNG viết chuyên đề lớp 6–9 (mèo con 5 đang làm).
- KHÔNG viết chuyên đề môn khác (Lý, Hóa, Sinh, Anh, Địa...) — thầy dặn Toán trước, xong Toán mới sang môn khác; môn khác giao phiên sau.
- KHÔNG viết mức nâng cao.
- KHÔNG đăng lên web thật.

## Kiểm chứng (Mèo 1 làm sau khi nhận PR)
Đối chiếu từng file mới với SGK; kiểm tra không trùng chủ đề đã có (kể cả với file mèo con 5 viết song song); đọc thử 1 file mẫu bằng đúng bộ đọc của trang chuyên đề; gộp index.json từ danh sách entry trong mô tả PR.
