# Prompt sinh 10 bộ đề chuẩn Sào Báy (saobay-exam10)

> Quy trình: mở teacher-hub → tab **Đẩy Đề Thi / Bài Tập** → bấm
> **"Copy Prompt 10 Bộ Đề"** (prompt đã điền sẵn Môn/Khối/Tên bài) → dán cho AI
> (NotebookLM / ChatGPT / Gemini) → **xin từng ĐỀ một** (Đề 1, rồi "tiếp tục Đề 2"...)
> → gộp đủ 10 đề → copy mã HTML → dán vào khung soạn thảo (chế độ **Mã HTML**)
> → **Lưu & Đẩy Đề Thi / Bài Tập**.
>
> Học sinh mở bài sẽ thấy **ngẫu nhiên 1 trong 10 đề**, có nút **🔀 Đổi đề**,
> chấm đúng/sai từng câu kèm lời giải chi tiết.

## ⚠️ Quy tắc cũ KHÔNG dùng được — vì sao phải viết lại

Quy tắc cũ của bạn mô tả **kiến trúc HTML card + data-\* + JS tự viết**
(`question-card`, `data-type="mcq_4"`, `checkSingleQuestion()`...). Web Sào Báy
**không dùng kiến trúc đó**. Nếu AI làm theo quy tắc cũ, file đẩy lên sẽ:

1. **Không hiện đề cho học sinh** — trình xem (`mountExam10Viewers` trong
   `index.html`) chỉ đọc JSON trong `<script class="saobay-exam10-data">`,
   không đọc HTML card.
2. **Không vào được ngân hàng câu hỏi** — bộ bóc câu hỏi (`hub-bank.js`) cũng
   chỉ bóc từ JSON, 7 dạng `mcq_4/true_false/fill_blank/matching/ordering...`
   web không hiểu (web chỉ có 4 dạng: `mcq`, `truefalse`, `short`, `essay`).
3. **Sai thang điểm Đúng/Sai** — quy tắc cũ ghi 0.1/0.25/0.5/1.0 (Bộ GD),
   web đang chấm 0.125/0.25/0.5/1.0.
4. **JS tự viết là thừa và nguy hiểm** — web tự render + chấm bài, AI không
   cần (và không được) viết JavaScript.

Phần **sư phạm** trong quy tắc cũ (4 mức độ NB/TH/VD/VDC, MathJax, cách ra đề
hay) thì rất tốt — đã giữ lại đầy đủ bên dưới.

## Nguyên tắc định dạng (bản chuẩn)

- AI **chỉ sinh DỮ LIỆU** (JSON đặt trong 1 file HTML). Phần hiển thị
  (chọn ngẫu nhiên, nút "Đổi đề", chấm bài, đồng hồ tính giờ) do web đảm nhiệm —
  AI không viết HTML card, không viết JavaScript.
- File đẩy lên có tên dạng `..._Bai_tap_none.html` → trang chủ tự xếp vào tab
  **"Làm Bài Tập & Đề Thi"** (không lọt sang khung lý thuyết).
- 4 dạng câu hỏi web hiểu: `mcq` (trắc nghiệm 4 đáp án), `truefalse` (đúng/sai
  4 ý), `short` (trả lời ngắn), `essay` (tự luận, giáo viên chấm tay).
- **NotebookLM: xin 1 ĐỀ/lần.** Xin 10 đề 1 lúc quá dài sẽ treo ở "Thoughts".
  Xong Đề 1 thì gõ "tiếp tục Đề 2"... đến Đề 10, rồi "gộp đủ 10 bộ".

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

Mỗi đề 10 câu: 6 `mcq` + 2 `truefalse` + 2 `short` (đề kiểm tra có thể thay
1 `short` bằng `essay`). Phân bố đều NB/TH/VD/VDC.

### Quy tắc kỹ thuật

- Viết TIẾNG VIỆT CÓ DẤU đầy đủ trong mọi chuỗi.
- Công thức Toán giữ nguyên 100% cú pháp TeX trong `$...$` hoặc `$$...$$`.
- TUYỆT ĐỐI không dùng ký tự `< > &` trong chuỗi JSON (dấu `<` viết thành
  `\u003c`). Không để dấu phẩy thừa cuối mảng/object làm vỡ JSON.
- Mỗi câu bắt buộc có `explain` ngắn gọn, dễ hiểu với học sinh.

## Prompt mẫu (nút "Copy Prompt 10 Bộ Đề" đã dùng bản này)

```
Bạn là chuyên gia biên soạn đề thi theo định hướng đánh giá năng lực của Bộ GD&ĐT.
Nhiệm vụ: soạn ĐỀ 1 (làm từng đề một, KHÔNG làm 10 đề cùng lúc) cho Bài: "[TÊN BÀI]" - Môn: [MÔN] - Lớp: [LỚP].
[... khung JSON và quy tắc như trên ...]
Sau khi tôi duyệt "Đề 1", tôi sẽ yêu cầu "tiếp tục Đề 2"... đến "Đề 10",
mỗi đề KHÁC NHAU rõ rệt (đảo thứ tự, đổi số liệu, đổi cách hỏi).
```

## Lưu ý khi dán vào teacher-hub

- Dán mã AI trả về vào khung soạn thảo ở chế độ **Mã HTML** (hoặc bấm "Dán từ NotebookLM"),
  rồi bấm **Lưu & Đẩy Đề Thi / Bài Tập**. Teacher-hub tự bọc tiêu đề và đẩy file
  `..._Bai_tap_none.html` lên đúng thư mục.
- Nếu AI trả về thiếu đề hoặc JSON lỗi, web sẽ báo "Không đọc được dữ liệu 10 bộ đề"
  — chỉ cần yêu cầu AI xuất lại phần thiếu.

## Chế độ Bài tập / Bài kiểm tra

- Web tự động sau mỗi lần bấm **Kiểm tra**: **khóa câu đó** (không cho sửa/làm lại).
- **Bài tập** (mặc định): không tính giờ.
- **Bài kiểm tra tính giờ**: ở tab **Đẩy Đề Thi / Bài Tập**, nhập số phút vào ô
  **"Bài kiểm tra tính giờ"** trước khi đẩy. Teacher-hub tự chèn
  `"time_limit": <số phút>` vào JSON → web hiện **đồng hồ đếm ngược** + nút **Nộp bài**.
