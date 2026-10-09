# Prompt tạo đề mới chuẩn Sào Báy (saobay-exam10)

> Quy trình: mở teacher-hub → tab **Đẩy Đề Thi / Bài Tập** → bấm
> **"Copy Prompt Tạo Đề Mới"** (prompt đã điền sẵn Môn/Khối/Tên bài) → dán cho AI
> (NotebookLM / ChatGPT / Gemini) → **gửi kèm MA TRẬN chi tiết của bạn**
> → AI trả về 1 đề mới tinh → copy mã HTML → dán vào khung soạn thảo
> (chế độ **Mã HTML**) → **Lưu & Đẩy Đề Thi / Bài Tập**.

## Nguyên tắc mới: 1 đề mới theo ma trận

- **Không còn cơ chế 10 bộ đề cố định.** Mỗi lần chỉ tạo **1 đề duy nhất**,
  nhưng phải **mới hoàn toàn** — học sinh chưa từng thấy.
- **Ma trận do BẠN quyết định.** Trước khi dán prompt, hãy chuẩn bị ma trận gồm:
  - Chủ đề/chương cần ra (ví dụ: Chương 1: Mệnh đề, Chương 2: Tập hợp...)
  - Số câu cho mỗi chủ đề
  - Phân bố mức độ: bao nhiêu câu NB / TH / VD / VDC
  - Dạng câu: bao nhiêu `mcq` / `truefalse` / `short` / `essay`
  - Thời gian làm bài (nếu là bài kiểm tra tính giờ)
- Dán prompt → dán tiếp ma trận của bạn ngay sau đó → AI soạn đề tuân thủ
  **100% ma trận**, không tự ý thêm bớt.

## Nguyên tắc định dạng (bản chuẩn)

- AI **chỉ sinh DỮ LIỆU** (JSON đặt trong 1 file HTML). Phần hiển thị
  (nút "Đổi đề", chấm bài, đồng hồ tính giờ) do web đảm nhiệm —
  AI không viết HTML card, không viết JavaScript.
- File đẩy lên có tên dạng `..._Bai_tap_none.html` → trang chủ tự xếp vào tab
  **"Làm Bài Tập & Đề Thi"** (không lọt sang khung lý thuyết).
- 4 dạng câu hỏi web hiểu: `mcq` (trắc nghiệm 4 đáp án), `truefalse` (đúng/sai
  4 ý), `short` (trả lời ngắn), `essay` (tự luận, giáo viên chấm tay).

## Khung JSON bắt buộc AI phải xuất

```html
<div class="saobay-exam10">
<script type="application/json" class="saobay-exam10-data">
{
  "sets": [
    {
      "name": "Đề 1",
      "questions": [
        {"type":"mcq","level":"NB","q":"Nội dung câu hỏi?","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explain":"Giải thích ngắn gọn."},
        {"type":"truefalse","level":"TH","q":"Xét tính đúng/sai:","statements":["Ý a ...","Ý b ...","Ý c ...","Ý d ..."],"answer":["T","F","T","F"],"explain":"Giải thích từng ý."},
        {"type":"short","level":"VD","q":"Điền đáp số: ...?","answer":"24","explain":"Giải thích."},
        {"type":"essay","level":"VDC","q":"[TL] Câu tự luận: ...","explain":"Barem chấm từng ý."}
      ]
    }
  ]
}
</script>
</div>
```

### Chi tiết 4 dạng câu

| Dạng | Trường bắt buộc | Ghi chú |
|---|---|---|
| `mcq` | `options` (4 chuỗi "A. "/"B. "/"C. "/"D. "), `answer` = 1 ký tự A/B/C/D | Web chấm 0.25đ/câu |
| `truefalse` | `statements` (đúng 4 chuỗi), `answer` = mảng 4 giá trị "T"/"F" theo thứ tự a→d | Web chấm: 1 ý đúng=0.125, 2 ý=0.25, 3 ý=0.5, 4 ý=1 |
| `short` | `answer` = 1 chuỗi đáp số chuẩn | Web chấm 0.5đ/câu |
| `essay` | **không** có `answer`; `explain` ghi barem | Giáo viên chấm tay, 0đ tự động |

### 4 mức độ nhận thức (trường `level` bắt buộc mỗi câu)

- **NB** (Nhận biết): nhắc lại định nghĩa, khái niệm, công thức cơ bản.
- **TH** (Thông hiểu): hiểu bản chất, phân biệt khái niệm, áp dụng trực tiếp 1 công thức.
- **VD** (Vận dụng): tổng hợp 2–3 kiến thức để giải bài toán thông thường.
- **VDC** (Vận dụng cao): bài toán phân hóa, tư duy phức tạp, mô hình thực tiễn mới.

### Quy tắc kỹ thuật

- Viết TIẾNG VIỆT CÓ DẤU đầy đủ trong mọi chuỗi.
- Công thức Toán giữ nguyên 100% cú pháp TeX trong `$...$` hoặc `$$...$$`.
- TUYỆT ĐỐI không dùng ký tự `< > &` trong chuỗi JSON (dấu `<` viết thành
  `\u003c`). Không để dấu phẩy thừa cuối mảng/object làm vỡ JSON.
- Mỗi câu bắt buộc có `explain` ngắn gọn, dễ hiểu với học sinh.
- Đề phải MỚI TINH: không trùng lặp nội dung với các đề đã có trong ngân hàng.

## Ví dụ ma trận (bạn tự điều chỉnh)

```
MA TRẬN ĐỀ KIỂM TRA 45 PHÚT — Toán 10, Bài: Mệnh đề & Tập hợp
- Chủ đề 1 (Mệnh đề): 4 câu — 2 NB, 1 TH, 1 VD
- Chủ đề 2 (Tập hợp): 4 câu — 1 NB, 2 TH, 1 VD
- Chủ đề 3 (Các phép toán tập hợp): 2 câu — 1 VD, 1 VDC
- Dạng câu: 6 mcq + 2 truefalse + 2 short
- Tổng: 10 câu
```

## Lưu ý khi dán vào teacher-hub

- Dán mã AI trả về vào khung soạn thảo ở chế độ **Mã HTML**,
  rồi bấm **Lưu & Đẩy Đề Thi / Bài Tập**. Teacher-hub tự bọc tiêu đề và đẩy file
  `..._Bai_tap_none.html` lên đúng thư mục.
- Nếu AI trả về JSON lỗi, web sẽ báo lỗi — chỉ cần yêu cầu AI xuất lại.

## Chế độ Bài tập / Bài kiểm tra

- Web tự động sau mỗi lần bấm **Kiểm tra**: **khóa câu đó** (không cho sửa/làm lại).
- **Bài tập** (mặc định): không tính giờ.
- **Bài kiểm tra tính giờ**: ở tab **Đẩy Đề Thi / Bài Tập**, nhập số phút vào ô
  **"Bài kiểm tra tính giờ"** trước khi đẩy. Teacher-hub tự chèn
  `"time_limit": <số phút>` vào JSON → web hiện **đồng hồ đếm ngược** + nút **Nộp bài**.
