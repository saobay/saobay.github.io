# Mèo con 5 — Soạn Chuyên đề thường môn Toán còn thiếu (lệnh thầy 07:16 06/11/2026)

## Giao cho Jules (1 phiên = 1 việc, 1 nhánh + 1 PR riêng)

**Kho:** `saobay-jules` (riêng tư). **Đưa lên kho:** thư mục `chuyende/` gồm:
- `chuyende/index.json` — mục lục live hiện hành (195 chuyên đề, trong đó Toán 109: lớp 6: 11, 7: 11, 8: 14, 9: 22, 10: 16, 11: 15, 12: 20).
- `chuyende/mau-coban.txt` — file mẫu mức cơ bản (492 dòng, "Chuyên đề Phân số").
- `chuyende/mau-nangcao.txt` — file mẫu mức nâng cao (469 dòng, chỉ để tham khảo cấu trúc, KHÔNG viết mức nâng cao trong phiên này).
- `chuyende/chapters-toan.json` — danh mục chương/bài Toán SGK Kết nối tri thức các lớp 6–12 (nguồn đối chiếu).
- `chuyende/BRIEF.md` — brief này.

Chỉ làm trong thư mục `chuyende/`. Không deploy, không giữ token, không sửa file nào ngoài `chuyende/`.

## Việc làm — 2 bước, đúng thứ tự

### Bước 1: Rà soát thiếu (làm trước, ghi kết quả vào PR)
Đối chiếu `chuyende/index.json` (tiêu đề + tóm tắt từng chuyên đề Toán) với `chuyende/chapters-toan.json`:
- Một chương/bài được coi là ĐÃ CÓ chuyên đề nếu có chuyên đề cùng chủ đề bao phủ nó (kể cả khi tên không khớp từng chữ — ví dụ chuyên đề "Ước và bội, ƯCLN và BCNN" đã bao phủ cả chương "Tính chia hết"; chuyên đề "Số nguyên" đã bao phủ "Quy tắc dấu ngoặc"). Chỉ liệt kê là THIẾU khi thật sự không có chuyên đề nào bao phủ.
- Ghi danh sách thiếu chốt được (tên chương/bài + lớp) vào phần mô tả của PR.

### Bước 2: Viết chuyên đề mới — CHỈ môn Toán, CHỈ mức cơ bản, lớp 6 trước rồi lên dần
- Viết file mới cho MỖI chủ đề thiếu đã chốt ở bước 1 — TỐI THIỂU 50 file, càng nhiều càng tốt (thầy sửa 13:47 06/11: bỏ giới hạn tối đa 12); viết theo thứ tự lớp 6 → 12, thiếu bao nhiêu viết hết bấy nhiêu; nếu một phiên không viết hết thì liệt kê phần còn lại vào mô tả PR để giao phiên tiếp theo làm nốt cho đủ 50.
- Mỗi file đặt tại `chuyende/TOAN_{lớp}/<slug>.txt` (slug tiếng Việt không dấu, gạch nối, ví dụ `tinh-chia-het.txt`).
- Làm theo ĐÚNG cấu trúc `mau-coban.txt`: dòng đầu `# Chuyên đề <tên>`; đoạn mở đầu nêu mạch kiến thức + cách học; `## Lý thuyết trọng tâm` — mỗi ý có ví dụ bằng số cụ thể ngay sau ý đó; các `## Dạng N: ...` — mỗi dạng có `### Phương pháp`, `### Ví dụ mẫu` (mỗi ví dụ có "Tư duy giải bài" trước lời giải), rồi `### Bài tập` (trắc nghiệm + tự luận, kèm đáp án/lời giải ngắn cuối file).
- Nội dung bám SGK Kết nối tri thức, đúng chương trình lớp đó; công thức toán viết trong `$...$` (không dùng `\(...\)`, không dùng ký tự Unicode thay công thức như x², √, π); số âm viết dấu trừ chuẩn, lời văn tiếng Việt đúng chính tả.
- KHÔNG sửa bất kỳ file chuyên đề nào đã có, KHÔNG đổi tên/xóa file cũ.
- Cập nhật `chuyende/index.json`: CHỈ THÊM entry mới cho file mới viết (giữ nguyên mọi entry cũ, giữ nguyên thứ tự cũ, thêm mới vào cuối danh sách của đúng lớp đó), mỗi entry đủ khóa: `id` (`toan{lớp}-{slug}`), `level` (`coban`), `subject` (`TOAN`), `grade` (số), `title` (`Chuyên đề <tên>`), `file` (`TOAN_{lớp}/<slug>.txt`), `summary` (1–2 câu nêu nội dung + dạng bài). JSON phải hợp lệ.

## Không làm trong phiên này
- KHÔNG viết chuyên đề môn khác (Lý, Hóa, Sinh, Anh, Địa...) — thầy dặn Toán trước, xong Toán mới sang môn khác; môn khác giao phiên sau.
- KHÔNG viết mức nâng cao.
- KHÔNG đăng lên web thật.

## Kiểm chứng (Mèo 1 làm sau khi nhận PR)
Đối chiếu từng file mới với SGK; kiểm tra không trùng chủ đề đã có; JSON index hợp lệ; đọc thử 1 file mẫu bằng đúng bộ đọc của trang chuyên đề.
