# Prompt sinh 10 bộ đề trong 1 file bài tập (saobay-exam10)

> Quy trình: mở teacher-hub → tab **Đẩy Đề Thi / Bài Tập** → bấm
> **"Copy Prompt 10 Bộ Đề"** (prompt đã điền sẵn Môn/Khối/Tên bài) → dán cho AI
> (NotebookLM / ChatGPT / Gemini) → copy mã HTML AI trả về → dán vào khung soạn thảo
> (chế độ **Mã HTML**) → **Lưu & Đẩy Đề Thi / Bài Tập**.
>
> Học sinh mở bài sẽ thấy **ngẫu nhiên 1 trong 10 đề**, có nút **🔀 Đổi đề**,
> chấm đúng/sai từng câu kèm lời giải chi tiết.

## Nguyên tắc định dạng

- AI **chỉ sinh DỮ LIỆU** (JSON đặt trong 1 file HTML). Phần hiển thị
  (chọn ngẫu nhiên, nút "Đổi đề", chấm bài) do `index.html` đảm nhiệm qua hàm
  `mountExam10Viewers` — AI không cần viết JavaScript, không thể làm hỏng trình xem.
- File đẩy lên có tên dạng `..._Bai_tap_none.html` → trang chủ tự xếp vào tab
  **"Làm Bài Tập & Đề Thi"** (không lọt sang khung lý thuyết).
- 3 dạng câu hỏi: `mcq` (trắc nghiệm 4 đáp án), `truefalse` (đúng/sai 4 ý),
  `short` (trả lời ngắn).

## Khung HTML bắt buộc AI phải xuất

```html
<div class="saobay-exam10">
<script type="application/json" class="saobay-exam10-data">
{
  "sets": [
    {
      "name": "Đề 1",
      "questions": [
        {"type":"mcq","level":"NB","q":"Nội dung câu hỏi 1?","options":["A. Phương án A","B. Phương án B","C. Phương án C","D. Phương án D"],"answer":"B","explain":"Giải thích ngắn gọn vì sao chọn B."},
        {"type":"truefalse","level":"TH","q":"Xét tính đúng sai của các ý sau:","statements":["Ý a ...","Ý b ...","Ý c ...","Ý d ..."],"answer":["T","F","T","F"],"explain":"Giải thích từng ý."},
        {"type":"short","level":"VD","q":"Điền đáp án: ...?","answer":"đáp án đúng","explain":"Giải thích."}
      ]
    },
    {"name":"Đề 2","questions":[ ... ]},
    ... đủ 10 đề ...
  ]
}
</script>
</div>
```

## Prompt mẫu gửi cho AI

> Thay `[MÔN]`, `[LỚP]`, `[TÊN BÀI]` rồi gửi nguyên văn:

```
Xuất DUY NHẤT mã HTML thô (raw code, không bọc khối code markdown, không thêm chữ giải thích ngoài) cho 1 FILE BÀI TẬP gồm 10 BỘ ĐỀ của Bài: "[TÊN BÀI]" - Môn: [MÔN] - Lớp: [LỚP].
ĐỊNH DẠNG BẮT BUỘC (viết TIẾNG VIỆT CÓ DẤU đầy đủ trong mọi chuỗi), chỉ xuất đúng khối sau (không thêm <html>, <head>, <body>):

<div class="saobay-exam10">
<script type="application/json" class="saobay-exam10-data">
{
  "sets": [
    {
      "name": "Đề 1",
      "questions": [
        {"type":"mcq","level":"NB","q":"Nội dung câu hỏi 1?","options":["A. Phương án A","B. Phương án B","C. Phương án C","D. Phương án D"],"answer":"B","explain":"Giải thích ngắn gọn vì sao chọn B."},
        {"type":"truefalse","level":"TH","q":"Xét tính đúng sai của các ý sau:","statements":["Ý a ...","Ý b ...","Ý c ...","Ý d ..."],"answer":["T","F","T","F"],"explain":"Giải thích từng ý."},
        {"type":"short","level":"VD","q":"Điền đáp án: ...?","answer":"đáp án đúng","explain":"Giải thích."}
      ]
    },
    {"name":"Đề 2","questions":[ ... ]},
    ... (đủ 10 đề: "Đề 1" đến "Đề 10") ...
  ]
}
</script>
</div>

YÊU CẦU CHI TIẾT:
1. Đúng 10 đề, mỗi đề 8-12 câu, bao phủ toàn bộ kiến thức trọng tâm của bài "[TÊN BÀI]". Các đề KHÁC NHAU rõ rệt: đảo thứ tự câu, đổi số liệu, đổi cách hỏi, không lặp nguyên câu giữa các đề.
2. Phối hợp 3 dạng câu: mcq (trắc nghiệm 4 đáp án, trường answer là ký tự A/B/C/D), truefalse (4 ý a-d, trường answer là mảng 4 giá trị "T"/"F" tương ứng), short (trả lời ngắn, answer là chuỗi đáp án chuẩn).
   Mỗi câu BẮT BUỘC có trường "level" phân loại mức độ: "NB" (nhận biết), "TH" (thông hiểu), "VD" (vận dụng), "VDC" (vận dụng cao) — phân bố đều các mức trong mỗi đề.
3. Mỗi câu bắt buộc có "explain" giải thích ngắn gọn, dễ hiểu với học sinh.
4. Công thức Toán viết bằng $...$ hoặc $$...$$, giữ nguyên 100% cú pháp TeX.
5. TUYỆT ĐỐI không dùng ký tự < > & trong chuỗi JSON (dấu nhỏ hơn viết thành \u003c). Không để dấu phẩy thừa cuối mảng/object làm vỡ JSON.
6. Nếu nội dung quá dài cho 1 lần trả lời: chia thành nhiều lần xuất, mỗi lần ghi rõ "BỘ ĐỀ n/10", giữ nguyên cấu trúc; lần cuối gộp đủ 10 bộ.
7. Chỉ xuất thuần mã HTML theo đúng khung trên, không thêm bất kỳ văn bản nào ngoài khung.
```

## Lưu ý khi dán vào teacher-hub

- Dán mã AI trả về vào khung soạn thảo ở chế độ **Mã HTML** (hoặc bấm "Dán từ NotebookLM"),
  rồi bấm **Lưu & Đẩy Đề Thi / Bài Tập**. Teacher-hub tự bọc tiêu đề và đẩy file
  `..._Bai_tap_none.html` lên đúng thư mục.
- Nếu AI trả về thiếu đề hoặc JSON lỗi, web sẽ báo "Không đọc được dữ liệu 10 bộ đề"
  — chỉ cần yêu cầu AI xuất lại phần thiếu.

## Chế độ Bài tập / Bài kiểm tra (mới 2026-10-08)

- Web tự động sau mỗi lần bấm **Kiểm tra**: **khóa câu đó** (không cho sửa/làm lại),
  đúng cộng **+1 điểm** vào thanh **Điểm: X/Y** trên thanh công cụ.
- **Bài tập** (mặc định): không tính giờ — học sinh làm từng câu tùy ý.
- **Bài kiểm tra tính giờ**: ở tab **Đẩy Đề Thi / Bài Tập**, nhập số phút vào ô
  **"Bài kiểm tra tính giờ"** trước khi đẩy. Teacher-hub tự chèn
  `"time_limit": <số phút>` vào JSON. Khi đó web hiện **đồng hồ đếm ngược** +
  nút **Nộp bài**; hết giờ tự khóa toàn bộ câu chưa làm (tính là sai) và hiện
  bảng điểm tổng kết.
- Nếu tự viết JSON thủ công, thêm `"time_limit": 15` ngang hàng với `"sets"`
  để bật chế độ tính giờ (đơn vị: phút).
