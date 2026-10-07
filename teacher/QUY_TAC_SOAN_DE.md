# QUY TẮC SOẠN ĐỀ & BIÊN SOẠN BÀI TẬP CHUẨN SÀO BÁY PORTAL
*(Tài liệu chuẩn hóa dành cho Giáo viên & Huấn luyện NotebookLM - AI Assistant)*

---

## PHẦN I: NGUYÊN TẮC CỐT LÕI CHO NOTEBOOKLM & GIÁO VIÊN

### 1. Mục đích
Tài liệu này quy định cấu trúc mã nguồn HTML, hệ thống phân loại mức độ nhận thức, các dạng bài tập và thuộc tính dữ liệu (`data-*`) chuẩn hóa cho hệ thống **Sào Báy Portal - Trường THPT Sào Báy**.
- **Đối với AI (NotebookLM)**: Đây là tài liệu nguồn tri thức (Knowledge Source). Khi nhận prompt biên soạn bài tập/đề thi, AI **bắt buộc tuân thủ 100%** cú pháp HTML và các thuộc tính dữ liệu trong tài liệu này.
- **Đối với Giáo viên**: Làm căn cứ để thiết lập đề kiểm tra định kỳ, đề ôn tập và xây dựng ngân hàng câu hỏi bám sát cấu trúc đề thi của Bộ Giáo dục & Đào tạo.
- **Đối với Hệ thống**: Mỗi câu hỏi là một module độc lập mang đầy đủ thẻ dữ liệu nhận dạng (`data-type`, `data-level`, `data-topic`, `data-answer`), giúp web tự động chấm điểm tương tác cho học sinh, đồng thời hỗ trợ thuật toán bóc tách câu hỏi để tự động lắp ráp đề thi mới theo Ma trận đề.

---

### 2. Các quy định kỹ thuật bất di bất dịch đối với AI xuất đề
1. **Xuất MÃ NGUỒN HTML NGUYÊN BẢN (Raw HTML Code)**:
   - Tuyệt đối không xuất rich-text định dạng sẵn của Word.
   - Toàn bộ nội dung đề thi được xuất dưới dạng mã HTML thô đặt trong một khối văn bản duy nhất để khi người dùng tải file `.docx` từ NotebookLM về, file Word đó mang trọn vẹn mã HTML nguyên thủy.
2. **Công thức Toán - Lý - Hóa (MathJax)**:
   - Giữ nguyên 100% cú pháp TeX / LaTeX.
   - Công thức nằm trên dòng: kẹp giữa hai dấu đô la đơn: `$công_thức$`, ví dụ: `$P(x): "x^2 - 4 = 0"$`, `$\vec{a} \cdot \vec{b} = |\vec{a}| |\vec{b}| \cos \theta$`.
   - Công thức nằm trên khối riêng: kẹp giữa hai dấu đô la kép: `$$công_thức$$`, ví dụ: `$$x = \frac{-b \pm \sqrt{\Delta}}{2a}$$`.
   - Tuyệt đối không dùng Equation của Word hoặc chuyển thành ảnh/ký tự lạ làm lỗi hiển thị MathJax.
3. **Giao diện hiện đại với Tailwind CSS**:
   - Sử dụng các lớp tiện ích của Tailwind CSS có sẵn trên hệ thống (card bo tròn `rounded-2xl`, viền `border border-slate-200`, đổ bóng nhẹ `shadow-sm`, khoảng cách hợp lý `p-5 space-y-4`).
4. **Mỗi câu hỏi phải là một Card độc lập mang metadata**:
   - Mỗi câu được bọc trong `<div class="question-card ...">` với đầy đủ các thuộc tính:
     - `data-question-id`: Mã câu hỏi (vd: `q1`, `q2`).
     - `data-type`: Loại câu hỏi (`mcq_4`, `true_false`, `short_answer`, `fill_blank`, `matching`, `ordering`, `multi_select`, `essay`).
     - `data-level`: Mức độ nhận thức (`NB`, `TH`, `VD`, `VDC`).
     - `data-topic`: Tên bài học / Chuyên đề kiến thức.
     - `data-points`: Điểm số của câu (vd: `0.25`, `1.0`, `2.0`).
     - `data-answer`: Chuỗi đáp án chuẩn hóa dùng cho thuật toán tự động chấm.

---

## PHẦN II: 4 MỨC ĐỘ NHẬN THỨC THEO CHUẨN BỘ GD&ĐT

Mỗi câu hỏi bắt buộc phải có nhãn hiển thị trực quan và thuộc tính `data-level`:

| Mã mức độ | Tên mức độ | Màu sắc nhận diện (Tailwind CSS) | Ý nghĩa & Tiêu chí nhận biết |
| :--- | :--- | :--- | :--- |
| **`NB`** | **Nhận biết** | `bg-blue-100 text-blue-700 border-blue-200` | Nhắc lại, nhận diện định nghĩa, khái niệm, công thức, định lý cơ bản; không cần biến đổi phức tạp. |
| **`TH`** | **Thông hiểu** | `bg-emerald-100 text-emerald-700 border-emerald-200` | Hiểu rõ bản chất, giải thích ý nghĩa, phân biệt các khái niệm, áp dụng trực tiếp 1 công thức đơn giản. |
| **`VD`** | **Vận dụng** | `bg-amber-100 text-amber-800 border-amber-200` | Vận dụng tổng hợp 2-3 kiến thức/công thức để giải quyết bài toán thông thường; giải quyết tình huống thực tiễn đơn giản. |
| **`VDC`** | **Vận dụng cao** | `bg-rose-100 text-rose-700 border-rose-200` | Bài toán phân hóa sâu, kết hợp đa chuyên đề, tư duy logic phức tạp, giải quyết vấn đề mô hình hóa thực tiễn mới lạ. |

**Mẫu huy hiệu (Badge) mức độ hiển thị trên đầu mỗi câu hỏi:**
```html
<!-- Mức Nhận biết -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 mr-2">
  <i class="fa-solid fa-lightbulb mr-1"></i> [NB] Nhận biết
</span>

<!-- Mức Thông hiểu -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 mr-2">
  <i class="fa-solid fa-brain mr-1"></i> [TH] Thông hiểu
</span>

<!-- Mức Vận dụng -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 mr-2">
  <i class="fa-solid fa-gears mr-1"></i> [VD] Vận dụng
</span>

<!-- Mức Vận dụng cao -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 mr-2">
  <i class="fa-solid fa-trophy mr-1"></i> [VDC] Vận dụng cao
</span>
```

---

## PHẦN III: QUY ƯỚC MÃ HTML VÀ CÚ PHÁP CHO CÁC DẠNG BÀI TẬP

---

### DẠNG 1: TRẮC NGHIỆM 4 LỰA CHỌN (Multiple Choice - 4 Choices)
- **Mã loại (`data-type`)**: `mcq_4`
- **Đặc điểm**: Thí sinh chọn 1 trong 4 phương án $A, B, C, D$. Đây là dạng bài kiểm tra phổ biến nhất.
- **Quy ước `data-answer`**: Chữ cái in hoa của đáp án đúng: `"A"`, `"B"`, `"C"` hoặc `"D"`.

#### Mẫu mã HTML chuẩn:
```html
<div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 transition hover:shadow-md"
     data-question-id="q1"
     data-type="mcq_4"
     data-level="NB"
     data-topic="Mệnh đề Toán học"
     data-points="0.25"
     data-answer="A">
  <!-- Đầu câu: Mức độ + Tiêu đề câu -->
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 mr-2">
        <i class="fa-solid fa-lightbulb mr-1"></i> [NB] Nhận biết
      </span>
      <span class="text-xs text-slate-500 font-medium">Chủ đề: Mệnh đề Toán học</span>
    </div>
    <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">0.25 điểm</span>
  </div>

  <!-- Nội dung câu hỏi -->
  <div class="font-bold text-slate-800 mb-3 text-sm md:text-base leading-relaxed">
    Câu 1: Trong các câu sau đây, câu nào là mệnh đề chứa biến?
  </div>

  <!-- 4 Phương án lựa chọn A, B, C, D -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
    <label class="option-label flex items-center p-3 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition">
      <input type="radio" name="q1" value="A" class="w-4 h-4 text-blue-600 mr-3">
      <span class="text-sm font-semibold text-slate-700">A. $P(x): "x + 2 > 5"$</span>
    </label>
    <label class="option-label flex items-center p-3 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition">
      <input type="radio" name="q1" value="B" class="w-4 h-4 text-blue-600 mr-3">
      <span class="text-sm font-semibold text-slate-700">B. $3 + 5 = 9$</span>
    </label>
    <label class="option-label flex items-center p-3 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition">
      <input type="radio" name="q1" value="C" class="w-4 h-4 text-blue-600 mr-3">
      <span class="text-sm font-semibold text-slate-700">C. Thủ đô của Việt Nam là Hà Nội</span>
    </label>
    <label class="option-label flex items-center p-3 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition">
      <input type="radio" name="q1" value="D" class="w-4 h-4 text-blue-600 mr-3">
      <span class="text-sm font-semibold text-slate-700">D. Hôm nay trời đẹp quá!</span>
    </label>
  </div>

  <!-- Thanh điều khiển tương tác -->
  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
    <button type="button" onclick="checkSingleQuestion('q1')" class="btn-check bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center">
      <i class="fa-solid fa-check mr-1.5"></i> Kiểm tra đáp án
    </button>
    <button type="button" onclick="toggleSolution('q1')" class="btn-toggle-sol text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center transition">
      <i class="fa-solid fa-circle-info mr-1.5"></i> Xem lời giải chi tiết
    </button>
  </div>

  <!-- Lời giải chi tiết (Mặc định ẩn) -->
  <div id="solution-q1" class="solution-box hidden mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 leading-relaxed">
    <div class="font-bold text-blue-700 mb-1 flex items-center">
      <i class="fa-solid fa-key mr-1.5"></i> LỜI GIẢI CHI TIẾT (Đáp án đúng: A)
    </div>
    <p>- Phương án A: Câu $P(x): "x + 2 > 5"$ chứa biến $x$, tính đúng sai phụ thuộc vào giá trị của biến $x \in \mathbb{R}$. Đây là mệnh đề chứa biến.</p>
    <p>- Phương án B: Là mệnh đề sai (không chứa biến).</p>
    <p>- Phương án C: Là mệnh đề đúng.</p>
    <p>- Phương án D: Là câu cảm thán, không phải mệnh đề.</p>
  </div>
</div>
```

---

### DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI (True / False - Cấu trúc Đề thi 2025 Bộ GD&ĐT)
- **Mã loại (`data-type`)**: `true_false`
- **Đặc điểm**: Mỗi câu gồm 1 ngữ cảnh/bài toán chung và 4 lệnh hỏi con độc lập: $a), b), c), d)$. Thí sinh chọn **Đúng** hoặc **Sai** cho từng ý.
- **Thang điểm lũy tiến Bộ GD&ĐT**:
  - Đúng 1 ý: **0.1 điểm**
  - Đúng 2 ý: **0.25 điểm**
  - Đúng 3 ý: **0.50 điểm**
  - Đúng cả 4 ý: **1.00 điểm**
- **Quy ước `data-answer`**: Chuỗi ghép trạng thái của 4 ý phân cách bởi dấu gạch đứng:
  `"a:T|b:F|c:T|d:F"` (với `T` = Đúng, `F` = Sai).

#### Mẫu mã HTML chuẩn:
```html
<div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 transition hover:shadow-md"
     data-question-id="q2"
     data-type="true_false"
     data-level="TH"
     data-topic="Hàm số bậc hai"
     data-points="1.0"
     data-answer="a:T|b:F|c:T|d:F">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 mr-2">
        <i class="fa-solid fa-brain mr-1"></i> [TH] Thông hiểu
      </span>
      <span class="text-xs text-slate-500 font-medium">Chủ đề: Hàm số bậc hai</span>
    </div>
    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Tối đa 1.0 điểm</span>
  </div>

  <div class="font-bold text-slate-800 mb-3 text-sm md:text-base leading-relaxed">
    Câu 2: Cho hàm số bậc hai $y = f(x) = x^2 - 4x + 3$. Xét tính đúng/sai của các mệnh đề sau:
  </div>

  <!-- Bảng 4 lệnh hỏi Đúng/Sai -->
  <div class="overflow-x-auto mb-4 border border-slate-200 rounded-xl">
    <table class="w-full text-xs md:text-sm text-left">
      <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
        <tr>
          <th class="p-3 w-12 text-center">Ý</th>
          <th class="p-3">Mệnh đề khẳng định</th>
          <th class="p-3 w-20 text-center text-emerald-700">Đúng</th>
          <th class="p-3 w-20 text-center text-rose-700">Sai</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr class="hover:bg-slate-50" data-sub="a">
          <td class="p-3 text-center font-bold text-slate-600">a)</td>
          <td class="p-3 text-slate-800">Đồ thị hàm số có tọa độ đỉnh là $I(2; -1)$.</td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_a" value="T" class="w-4 h-4 text-emerald-600 cursor-pointer">
          </td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_a" value="F" class="w-4 h-4 text-rose-600 cursor-pointer">
          </td>
        </tr>
        <tr class="hover:bg-slate-50" data-sub="b">
          <td class="p-3 text-center font-bold text-slate-600">b)</td>
          <td class="p-3 text-slate-800">Hàm số đồng biến trên khoảng $(-\infty; 2)$.</td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_b" value="T" class="w-4 h-4 text-emerald-600 cursor-pointer">
          </td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_b" value="F" class="w-4 h-4 text-rose-600 cursor-pointer">
          </td>
        </tr>
        <tr class="hover:bg-slate-50" data-sub="c">
          <td class="p-3 text-center font-bold text-slate-600">c)</td>
          <td class="p-3 text-slate-800">Tập nghiệm của bất phương trình $f(x) < 0$ là khoảng $(1; 3)$.</td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_c" value="T" class="w-4 h-4 text-emerald-600 cursor-pointer">
          </td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_c" value="F" class="w-4 h-4 text-rose-600 cursor-pointer">
          </td>
        </tr>
        <tr class="hover:bg-slate-50" data-sub="d">
          <td class="p-3 text-center font-bold text-slate-600">d)</td>
          <td class="p-3 text-slate-800">Giá trị lớn nhất của hàm số trên $\mathbb{R}$ bằng $-1$.</td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_d" value="T" class="w-4 h-4 text-emerald-600 cursor-pointer">
          </td>
          <td class="p-3 text-center">
            <input type="radio" name="q2_d" value="F" class="w-4 h-4 text-rose-600 cursor-pointer">
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
    <button type="button" onclick="checkSingleQuestion('q2')" class="btn-check bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center">
      <i class="fa-solid fa-check mr-1.5"></i> Chấm điểm câu này
    </button>
    <button type="button" onclick="toggleSolution('q2')" class="btn-toggle-sol text-xs font-bold text-slate-600 hover:text-emerald-600 flex items-center transition">
      <i class="fa-solid fa-circle-info mr-1.5"></i> Xem lời giải chi tiết
    </button>
  </div>

  <div id="solution-q2" class="solution-box hidden mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 leading-relaxed">
    <div class="font-bold text-emerald-700 mb-2 flex items-center">
      <i class="fa-solid fa-key mr-1.5"></i> LỜI GIẢI CHI TIẾT (Đ - S - Đ - S)
    </div>
    <ul class="space-y-1.5 list-disc pl-4">
      <li><strong>a) ĐÚNG:</strong> Hoành độ đỉnh $x_I = -\frac{b}{2a} = 2$; tung độ đỉnh $y_I = f(2) = 2^2 - 4(2) + 3 = -1$. Do đó đỉnh $I(2; -1)$.</li>
      <li><strong>b) SAI:</strong> Do $a = 1 > 0$, hàm số nghịch biến trên khoảng $(-\infty; 2)$ và đồng biến trên $(2; +\infty)$.</li>
      <li><strong>c) ĐÚNG:</strong> $x^2 - 4x + 3 = 0 \Leftrightarrow x = 1$ hoặc $x = 3$. Trong khoảng $(1; 3)$ đa thức mang dấu âm, vậy $f(x) < 0 \Leftrightarrow x \in (1; 3)$.</li>
      <li><strong>d) SAI:</strong> Parabol quay bề lõm lên trên nên hàm số có giá trị nhỏ nhất là $-1$, không có giá trị lớn nhất trên $\mathbb{R}$.</li>
    </ul>
  </div>
</div>
```

---

### DẠNG 3: TRẮC NGHIỆM TRẢ LỜI NGẮN (Short Answer - Format 2025 Bộ GD&ĐT)
- **Mã loại (`data-type`)**: `short_answer`
- **Đặc điểm**: Đề bài yêu cầu thí sinh tự giải ra đáp số (thường là một giá trị số nguyên, số thập phân hoặc từ khóa ngắn) và nhập vào ô text.
- **Quy ước `data-answer`**: Giá trị đáp số chuẩn hoặc các biến thể tương đương cách nhau dấu `|`.
  Ví dụ: `"12.5|12,5"` hoặc `"-4"`.

#### Mẫu mã HTML chuẩn:
```html
<div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 transition hover:shadow-md"
     data-question-id="q3"
     data-type="short_answer"
     data-level="VD"
     data-topic="Hình học & Vector"
     data-points="0.5"
     data-answer="24">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 mr-2">
        <i class="fa-solid fa-gears mr-1"></i> [VD] Vận dụng
      </span>
      <span class="text-xs text-slate-500 font-medium">Chủ đề: Hình học & Vector</span>
    </div>
    <span class="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">0.5 điểm</span>
  </div>

  <div class="font-bold text-slate-800 mb-3 text-sm md:text-base leading-relaxed">
    Câu 3: Trong mặt phẳng tọa độ $Oxy$, cho tam giác $ABC$ có $A(1; 2)$, $B(5; 2)$ và $C(1; 8)$. Tính tích vô hướng $\vec{AB} \cdot \vec{AC}$ cộng với diện tích tam giác $ABC$.
  </div>

  <!-- Khung điền câu trả lời ngắn -->
  <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
    <label class="text-xs md:text-sm font-semibold text-slate-700 shrink-0">Đáp số của bạn:</label>
    <input type="text" id="input_q3" placeholder="Nhập số kết quả (vd: 24)..." class="short-answer-input w-full sm:w-64 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner">
  </div>

  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
    <button type="button" onclick="checkSingleQuestion('q3')" class="btn-check bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center">
      <i class="fa-solid fa-check mr-1.5"></i> Kiểm tra đáp số
    </button>
    <button type="button" onclick="toggleSolution('q3')" class="btn-toggle-sol text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center transition">
      <i class="fa-solid fa-circle-info mr-1.5"></i> Xem lời giải chi tiết
    </button>
  </div>

  <div id="solution-q3" class="solution-box hidden mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 leading-relaxed">
    <div class="font-bold text-blue-700 mb-1 flex items-center">
      <i class="fa-solid fa-key mr-1.5"></i> LỜI GIẢI CHI TIẾT (Đáp án: 24)
    </div>
    <p>1. Ta có $\vec{AB} = (4; 0)$ và $\vec{AC} = (0; 6)$.</p>
    <p>2. Tích vô hướng $\vec{AB} \cdot \vec{AC} = 4 \cdot 0 + 0 \cdot 6 = 0$. (Tam giác $ABC$ vuông tại $A$ do $\vec{AB} \perp \vec{AC}$).</p>
    <p>3. Độ dài $AB = 4$, $AC = 6$. Diện tích tam giác: $S_{ABC} = \frac{1}{2} \cdot AB \cdot AC = \frac{1}{2} \cdot 4 \cdot 6 = 12$.</p>
    <p>4. Kết quả yêu cầu: $\vec{AB} \cdot \vec{AC} + 2 \cdot S_{ABC} = 0 + 24 = \mathbf{24}$.</p>
  </div>
</div>
```

---

### DẠNG 4: ĐIỀN TỪ / CÂU VÀO CHỖ TRỐNG (Fill in the Blanks / Cloze Test)
- **Mã loại (`data-type`)**: `fill_blank`
- **Đặc điểm**: Thường dùng cho môn Ngoại ngữ (Tiếng Anh 6 - 12), Ngữ văn, Lịch sử, Sinh học,... Có đoạn văn bản chứa các chỗ trống đánh số `[1]`, `[2]`, `[3]`,... Học sinh điền từ chuẩn xác vào từng ô.
- **Quy ước `data-answer`**: Các đáp án chuẩn cách nhau bởi dấu gạch đứng:
  `"1:excited|2:uniform|3:science|4:play"` (không phân biệt chữ hoa/thường khi chấm).

#### Mẫu mã HTML chuẩn:
```html
<div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 transition hover:shadow-md"
     data-question-id="q4"
     data-type="fill_blank"
     data-level="TH"
     data-topic="Unit 1 - My New School"
     data-points="1.0"
     data-answer="1:excited|2:uniform|3:science|4:play">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 mr-2">
        <i class="fa-solid fa-brain mr-1"></i> [TH] Thông hiểu
      </span>
      <span class="text-xs text-slate-500 font-medium">Tiếng Anh - Unit 1: Reading Cloze</span>
    </div>
    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">1.0 điểm</span>
  </div>

  <div class="font-bold text-slate-800 mb-2 text-sm md:text-base leading-relaxed">
    Câu 4: Fill in each blank with the most appropriate word from the box:
  </div>

  <!-- Ngân hàng từ gợi ý (Word Bank) -->
  <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 text-xs font-bold text-indigo-800">
    <span class="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">uniform</span>
    <span class="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">excited</span>
    <span class="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">science</span>
    <span class="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">play</span>
    <span class="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">history</span>
  </div>

  <!-- Đoạn văn điền khuyết với ô input inline -->
  <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs md:text-sm text-slate-800 leading-loose mb-4">
    Today is my first day at secondary school. I feel very
    <input type="text" data-blank="1" placeholder="[1]..." class="blank-input inline-block w-28 px-2 py-1 mx-1 text-center font-bold text-blue-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
    about meeting new classmates. In the morning, I put on my new school
    <input type="text" data-blank="2" placeholder="[2]..." class="blank-input inline-block w-28 px-2 py-1 mx-1 text-center font-bold text-blue-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">.
    My favorite subject is
    <input type="text" data-blank="3" placeholder="[3]..." class="blank-input inline-block w-28 px-2 py-1 mx-1 text-center font-bold text-blue-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
    because I love doing experiments in the lab. During break time, we often
    <input type="text" data-blank="4" placeholder="[4]..." class="blank-input inline-block w-28 px-2 py-1 mx-1 text-center font-bold text-blue-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
    football in the large playground.
  </div>

  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
    <button type="button" onclick="checkSingleQuestion('q4')" class="btn-check bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center">
      <i class="fa-solid fa-check mr-1.5"></i> Chấm bài điền từ
    </button>
    <button type="button" onclick="toggleSolution('q4')" class="btn-toggle-sol text-xs font-bold text-slate-600 hover:text-emerald-600 flex items-center transition">
      <i class="fa-solid fa-circle-info mr-1.5"></i> Xem đáp án chuẩn
    </button>
  </div>

  <div id="solution-q4" class="solution-box hidden mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 leading-relaxed">
    <div class="font-bold text-emerald-700 mb-1 flex items-center">
      <i class="fa-solid fa-key mr-1.5"></i> ĐÁP ÁN CHUẨN:
    </div>
    <p>[1]: <strong>excited</strong> (cảm thấy hào hứng) | [2]: <strong>uniform</strong> (đồng phục trường)</p>
    <p>[3]: <strong>science</strong> (môn khoa học tự nhiên) | [4]: <strong>play</strong> (chơi bóng đá - play football)</p>
  </div>
</div>
```

---

### DẠNG 5: NỐI CỘT / GHÉP ĐÔI TƯƠNG ỨNG (Matching)
- **Mã loại (`data-type`)**: `matching`
- **Đặc điểm**: Nối các mục ở Cột A với các mục tương ứng ở Cột B.
- **Quy ước `data-answer`**: Cặp nối dạng `"1-C|2-A|3-D|4-B"`.

#### Mẫu mã HTML chuẩn:
```html
<div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 transition hover:shadow-md"
     data-question-id="q5"
     data-type="matching"
     data-level="TH"
     data-topic="Lịch sử & Địa lí"
     data-points="1.0"
     data-answer="1-C|2-A|3-D|4-B">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 mr-2">
        <i class="fa-solid fa-brain mr-1"></i> [TH] Thông hiểu
      </span>
      <span class="text-xs text-slate-500 font-medium">Lịch sử Việt Nam</span>
    </div>
    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">1.0 điểm</span>
  </div>

  <div class="font-bold text-slate-800 mb-3 text-sm md:text-base leading-relaxed">
    Câu 5: Hãy ghép mỗi mốc thời gian ở Cột A với sự kiện lịch sử tương ứng ở Cột B:
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <!-- Cột A -->
    <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
      <h4 class="font-bold text-xs text-blue-900 uppercase">Cột A: Mốc thời gian</h4>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">1. Năm 938</div>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">2. Năm 1010</div>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">3. Năm 1288</div>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">4. Năm 1945</div>
    </div>

    <!-- Cột B -->
    <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
      <h4 class="font-bold text-xs text-indigo-900 uppercase">Cột B: Sự kiện lịch sử</h4>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">A. Lý Thái Tổ dời đô về Thăng Long</div>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">B. Cách mạng Tháng Tám thành công</div>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">C. Chiến thắng Bạch Đằng của Ngô Quyền</div>
      <div class="text-xs font-semibold text-slate-800 p-2 bg-white rounded-lg border border-slate-200">D. Chiến thắng Bạch Đằng của nhà Trần</div>
    </div>
  </div>

  <!-- Vùng chọn ghép cặp -->
  <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
    <div class="flex items-center space-x-1.5">
      <span class="text-xs font-bold text-slate-700">1 nối:</span>
      <select data-match="1" class="matching-select text-xs font-bold border border-slate-300 rounded-lg p-1 bg-white">
        <option value="">Chọn</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>
    <div class="flex items-center space-x-1.5">
      <span class="text-xs font-bold text-slate-700">2 nối:</span>
      <select data-match="2" class="matching-select text-xs font-bold border border-slate-300 rounded-lg p-1 bg-white">
        <option value="">Chọn</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>
    <div class="flex items-center space-x-1.5">
      <span class="text-xs font-bold text-slate-700">3 nối:</span>
      <select data-match="3" class="matching-select text-xs font-bold border border-slate-300 rounded-lg p-1 bg-white">
        <option value="">Chọn</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>
    <div class="flex items-center space-x-1.5">
      <span class="text-xs font-bold text-slate-700">4 nối:</span>
      <select data-match="4" class="matching-select text-xs font-bold border border-slate-300 rounded-lg p-1 bg-white">
        <option value="">Chọn</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
      </select>
    </div>
  </div>

  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
    <button type="button" onclick="checkSingleQuestion('q5')" class="btn-check bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center">
      <i class="fa-solid fa-check mr-1.5"></i> Kiểm tra nối cột
    </button>
    <button type="button" onclick="toggleSolution('q5')" class="btn-toggle-sol text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center transition">
      <i class="fa-solid fa-circle-info mr-1.5"></i> Xem đáp án
    </button>
  </div>

  <div id="solution-q5" class="solution-box hidden mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 leading-relaxed">
    <div class="font-bold text-blue-700 mb-1 flex items-center">
      <i class="fa-solid fa-key mr-1.5"></i> ĐÁP ÁN NỐI GHÉP:
    </div>
    <p><strong>1 - C</strong> (938: Ngô Quyền đại phá quân Nam Hán trên sông Bạch Đằng)</p>
    <p><strong>2 - A</strong> (1010: Lý Thái Tổ ban Chiếu dời đô)</p>
    <p><strong>3 - D</strong> (1288: Chiến thắng quân Nguyên Mông lần 3 trên sông Bạch Đằng)</p>
    <p><strong>4 - B</strong> (1945: Khởi nghĩa Cách mạng Tháng Tám)</p>
  </div>
</div>
```

---

### DẠNG 6: SẮP XẾP THEO THỨ TỰ LOGIC (Ordering / Sequence)
- **Mã loại (`data-type`)**: `ordering`
- **Đặc điểm**: Sắp xếp các bước thực nghiệm, quy trình hóa sinh, diễn biến sự kiện, hoặc sắp xếp từ thành câu hoàn chỉnh.
- **Quy ước `data-answer`**: Dãy số thứ tự chuẩn nối nhau dấu gạch ngang, ví dụ: `"3-1-4-2"`.

#### Mẫu mã HTML chuẩn:
```html
<div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 transition hover:shadow-md"
     data-question-id="q6"
     data-type="ordering"
     data-level="VD"
     data-topic="Hóa học - Thí nghiệm"
     data-points="0.5"
     data-answer="2-4-1-3">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 mr-2">
        <i class="fa-solid fa-gears mr-1"></i> [VD] Vận dụng
      </span>
      <span class="text-xs text-slate-500 font-medium">Hóa học 10 - Thực hành</span>
    </div>
    <span class="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">0.5 điểm</span>
  </div>

  <div class="font-bold text-slate-800 mb-3 text-sm md:text-base leading-relaxed">
    Câu 6: Hãy sắp xếp các bước sau theo đúng trình tự tiến hành thí nghiệm điều chế và thu khí oxi ($O_2$) trong phòng thí nghiệm:
  </div>

  <div class="space-y-2 mb-4 text-xs md:text-sm">
    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"><strong>(1)</strong> Đun nóng đáy ống nghiệm bằng ngọn lửa đèn cồn.</div>
    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"><strong>(2)</strong> Cho một lượng nhỏ $KMnO_4$ vào ống nghiệm khô, đặt mẩu bông gần miệng ống rồi đậy nút có ống dẫn khí.</div>
    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"><strong>(3)</strong> Tháo ống dẫn khí trước khi tắt đèn cồn để tránh nước tràn ngược vào ống nghiệm.</div>
    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"><strong>(4)</strong> Lắp ống nghiệm lên giá sắt và úp ngược ống nghiệm thu khí đã chứa đầy nước vào chậu.</div>
  </div>

  <div class="flex items-center space-x-3 mb-4">
    <label class="text-xs font-bold text-slate-700">Trình tự đúng:</label>
    <input type="text" id="order_input_q6" placeholder="vd: 2-4-1-3" class="w-40 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 uppercase focus:ring-1 focus:ring-blue-500">
  </div>

  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
    <button type="button" onclick="checkSingleQuestion('q6')" class="btn-check bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center">
      <i class="fa-solid fa-check mr-1.5"></i> Kiểm tra thứ tự
    </button>
    <button type="button" onclick="toggleSolution('q6')" class="btn-toggle-sol text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center transition">
      <i class="fa-solid fa-circle-info mr-1.5"></i> Xem giải thích
    </button>
  </div>

  <div id="solution-q6" class="solution-box hidden mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 leading-relaxed">
    <div class="font-bold text-blue-700 mb-1 flex items-center">
      <i class="fa-solid fa-key mr-1.5"></i> TRÌNH TỰ CHUẨN: 2 $\rightarrow$ 4 $\rightarrow$ 1 $\rightarrow$ 3
    </div>
    <p>Bước 2: Nạp hóa chất và đậy nút $\rightarrow$ Bước 4: Lắp giá và chuẩn bị bình thu nước $\rightarrow$ Bước 1: Đun nóng điều chế $\rightarrow$ Bước 3: Tháo ống dẫn khí trước khi tắt đèn cồn (nguyên tắc an toàn chống vỡ ống nghiệm).</p>
  </div>
</div>
```

---

### DẠNG 7: TỰ LUẬN CÓ BAREM CHẤM ĐIỂM CHI TIẾT (Essay with Rubrics)
- **Mã loại (`data-type`)**: `essay`
- **Đặc điểm**: Câu hỏi tự luận giải bài toán, chứng minh, phân tích hoặc viết đoạn văn/bài văn. Có bảng Barem phân chia điểm chi tiết từng ý nhỏ.
- **Quy ước `data-answer`**: `"essay_rubric"` (kèm bảng barem trong phần lời giải).

#### Mẫu mã HTML chuẩn:
```html
<div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 transition hover:shadow-md"
     data-question-id="q7"
     data-type="essay"
     data-level="VDC"
     data-topic="Hình học không gian"
     data-points="2.0"
     data-answer="essay_rubric">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 mr-2">
        <i class="fa-solid fa-trophy mr-1"></i> [VDC] Vận dụng cao
      </span>
      <span class="text-xs text-slate-500 font-medium">Toán 11 - Hình học không gian</span>
    </div>
    <span class="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">2.0 điểm</span>
  </div>

  <div class="font-bold text-slate-800 mb-3 text-sm md:text-base leading-relaxed">
    Câu 7 (Tự luận): Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $SA \perp (ABCD)$ và $SA = a\sqrt{2}$.<br>
    a) Chứng minh rằng $BC \perp (SAB)$.<br>
    b) Tính khoảng cách từ điểm $A$ đến mặt phẳng $(SBD)$.
  </div>

  <!-- Vùng học sinh nhập lời giải nháp / tự đối chiếu -->
  <div class="mb-4">
    <label class="block text-xs font-bold text-slate-700 mb-1">Khu vực làm bài / ghi chú lời giải của học sinh:</label>
    <textarea rows="4" placeholder="Nhập tóm tắt các bước giải của bạn vào đây để đối chiếu với Barem..." class="w-full p-3 text-xs md:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
  </div>

  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
    <button type="button" onclick="toggleSolution('q7')" class="btn-toggle-sol bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center">
      <i class="fa-solid fa-list-check mr-1.5"></i> Mở Barem chấm điểm & Lời giải
    </button>
  </div>

  <!-- Barem chấm điểm chi tiết -->
  <div id="solution-q7" class="solution-box hidden mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 leading-relaxed">
    <div class="font-bold text-indigo-800 mb-2 flex items-center text-sm">
      <i class="fa-solid fa-scale-balanced mr-1.5"></i> BAREM HƯỚNG DẪN CHẤM ĐIỂM CHI TIẾT
    </div>

    <div class="overflow-x-auto border border-slate-200 rounded-xl mb-3">
      <table class="w-full text-xs text-left">
        <thead class="bg-indigo-50 text-indigo-900 font-bold border-b border-indigo-200">
          <tr>
            <th class="p-2.5 w-16 text-center">Ý</th>
            <th class="p-2.5">Nội dung yêu cầu / Các bước lập luận</th>
            <th class="p-2.5 w-20 text-center">Điểm</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white">
          <tr>
            <td class="p-2.5 text-center font-bold" rowspan="2">a)</td>
            <td class="p-2.5">Vì $ABCD$ là hình vuông nên $BC \perp AB$. (1)</td>
            <td class="p-2.5 text-center font-bold text-blue-700">0.50 đ</td>
          </tr>
          <tr>
            <td class="p-2.5">Vì $SA \perp (ABCD)$ mà $BC \subset (ABCD) \Rightarrow SA \perp BC$. (2)<br>Từ (1) và (2) suy ra $BC \perp (SAB)$ vì $AB \cap SA = A$.</td>
            <td class="p-2.5 text-center font-bold text-blue-700">0.50 đ</td>
          </tr>
          <tr>
            <td class="p-2.5 text-center font-bold" rowspan="2">b)</td>
            <td class="p-2.5">Gọi $O = AC \cap BD$. Ta có $AO \perp BD$ và $SA \perp BD \Rightarrow BD \perp (SAO)$.<br>Kẻ $AH \perp SO$ tại $H \Rightarrow AH \perp (SBD)$. Vậy $d(A, (SBD)) = AH$.</td>
            <td class="p-2.5 text-center font-bold text-blue-700">0.50 đ</td>
          </tr>
          <tr>
            <td class="p-2.5">Tam giác $SAO$ vuông tại $A$ có $SA = a\sqrt{2}$, $AO = \frac{a\sqrt{2}}{2}$.<br>Áp dụng hệ thức lượng: $\frac{1}{AH^2} = \frac{1}{SA^2} + \frac{1}{AO^2} = \frac{1}{2a^2} + \frac{2}{a^2} = \frac{5}{2a^2} \Rightarrow AH = a\sqrt{\frac{2}{5}} = \frac{a\sqrt{10}}{5}$.</td>
            <td class="p-2.5 text-center font-bold text-blue-700">0.50 đ</td>
          </tr>
          <tr class="bg-indigo-50 font-bold text-indigo-900">
            <td colspan="2" class="p-2.5 text-right uppercase">Tổng điểm:</td>
            <td class="p-2.5 text-center text-sm text-indigo-900">2.0 đ</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

---

## PHẦN IV: KHUNG MA TRẬN ĐỀ THI TỔNG HỢP & TỶ LỆ PHÂN BỔ

Khi hệ thống bóc tách các câu hỏi đơn lẻ từ các bài học lưu trữ trong thư viện, giáo viên có thể lập một **Đề thi tổng hợp** dựa theo Ma trận chuẩn Bộ GD&ĐT:

### 1. Tỷ lệ % điểm số theo mức độ nhận thức
- **Nhận biết (NB)**: 40% tổng điểm (thường là các câu hỏi MCQ 4 lựa chọn, câu hỏi lý thuyết, nhận diện đồ thị).
- **Thông hiểu (TH)**: 30% tổng điểm (áp dụng công thức, các câu Đúng/Sai ý a, b, điền khuyết cơ bản).
- **Vận dụng (VD)**: 20% tổng điểm (các câu Đúng/Sai ý c, d, trắc nghiệm trả lời ngắn, bài toán liên môn).
- **Vận dụng cao (VDC)**: 10% tổng điểm (bài toán cực trị, bài toán thực tiễn tối ưu, câu tự luận phân hóa).

### 2. Cấu trúc chuẩn cho 1 Đề thi hoàn chỉnh (Ví dụ: Môn Toán THPT - Format 2025)
- **Phần I (3.0 điểm)**: 12 câu trắc nghiệm 4 lựa chọn (`mcq_4`), mỗi câu 0.25đ. Gồm 8 câu NB + 4 câu TH.
- **Phần II (4.0 điểm)**: 4 câu trắc nghiệm Đúng/Sai (`true_false`), mỗi câu tối đa 1.0đ. Gồm 2 câu TH + 2 câu VD.
- **Phần III (3.0 điểm)**: 6 câu trắc nghiệm Trả lời ngắn (`short_answer`), mỗi câu 0.5đ. Gồm 4 câu VD + 2 câu VDC.
- **Tổng cộng**: 22 câu - Thời gian: 90 phút - Thang điểm 10.

---

## PHẦN V: PROMPT MASTER HUẤN LUYỆN NOTEBOOKLM XUẤT ĐỀ THI CHUẨN XÁC

Giáo viên có thể sao chép nguyên văn Prompt dưới đây để dán vào NotebookLM khi muốn tạo đề:

```text
Hãy đóng vai chuyên gia biên soạn đề thi theo định hướng đánh giá năng lực của Bộ GD&ĐT cho Môn: [TÊN MÔN] - Lớp: [LỚP]. 
Chủ đề bài học: "[TÊN CHỦ ĐỀ HOẶC NỘI DUNG]".

QUY TẮC BẮT BUỘC ĐỂ XUẤT RA FILE WORD MANG NGUYÊN BẢN MÃ HTML:
1. MỤC ĐÍCH: Dữ liệu này sẽ được tải xuống dưới dạng tệp Word (.docx) để nạp trực tiếp vào hệ thống Sào Báy Portal. Vì vậy, bạn BẮT BUỘC phải xuất TOÀN BỘ nội dung dưới dạng MÃ NGUỒN HTML NGUYÊN BẢN (RAW HTML CODE). TUYỆT ĐỐI KHÔNG xuất văn bản Word thông thường.
2. CẤU TRÚC ĐỀ THI ĐA DẠNG:
   Hãy tạo bộ câu hỏi phong phú bao gồm các dạng bài tập theo đúng Quy tắc soạn đề chuẩn Sào Báy:
   - Dạng 1: Trắc nghiệm 4 lựa chọn (data-type="mcq_4")
   - Dạng 2: Trắc nghiệm Đúng / Sai 4 ý a,b,c,d theo chuẩn 2025 (data-type="true_false")
   - Dạng 3: Trắc nghiệm Trả lời ngắn (data-type="short_answer")
   - Dạng 4: Điền từ / Điền khuyết (data-type="fill_blank")
   - Dạng 5: Nối cột tương ứng (data-type="matching")
   - Dạng 6: Tự luận có Barem chấm điểm (data-type="essay")
3. PHÂN BỔ MỨC ĐỘ NHẬN THỨC:
   Mỗi câu hỏi BẮT BUỘC có thuộc tính data-level và nhãn hiển thị trực quan:
   - [NB] Nhận biết (bg-blue-100 text-blue-700)
   - [TH] Thông hiểu (bg-emerald-100 text-emerald-700)
   - [VD] Vận dụng (bg-amber-100 text-amber-800)
   - [VDC] Vận dụng cao (bg-rose-100 text-rose-700)
4. METADATA TRÊN TỪNG CÂU HỎI:
   Mỗi câu hỏi phải là một khối: <div class="question-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5" data-question-id="..." data-type="..." data-level="..." data-topic="..." data-points="..." data-answer="...">
   Có đầy đủ nút "Kiểm tra đáp án", nút "Xem lời giải chi tiết", và khối giải thích chi tiết <div id="solution-..." class="solution-box hidden ...">.
5. CÔNG THỨC TOÁN HỌC (MATHJAX):
   Giữ nguyên 100% cú pháp TeX/LaTeX trong $...$ hoặc $$...$$. Tuyệt đối không làm mất ký hiệu toán.
6. ĐẦU RA YÊU CẦU:
   Chỉ xuất DUY NHẤT chuỗi mã nguồn HTML nguyên bản từ thẻ <div class="exam-container ..."> đến hết kịch bản <script>.
```

---

## PHẦN VI: BỘ MÃ JAVASCRIPT TƯƠNG TÁC TỰ ĐỘNG (INTERACTIVE ENGINE V2)

Đoạn mã JavaScript dưới đây được đặt ở cuối file đề thi để tự động kích hoạt tính năng làm bài và chấm điểm cho tất cả các dạng bài:

```html
<script>
// BỘ ĐIỀU KHIỂN CHẤM ĐIỂM TƯƠNG TÁC SÀO BÁY PORTAL V2
function toggleSolution(qid) {
    let sol = document.getElementById('solution-' + qid);
    if (sol) {
        sol.classList.toggle('hidden');
        if (!sol.classList.contains('hidden') && window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([sol]).catch(e => {});
        }
    }
}

function checkSingleQuestion(qid) {
    let card = document.querySelector(`.question-card[data-question-id="${qid}"]`);
    if (!card) return;

    let type = card.getAttribute('data-type');
    let ans = card.getAttribute('data-answer') || '';
    let isCorrect = false;
    let earnedPoints = 0;
    let maxPoints = parseFloat(card.getAttribute('data-points')) || 0;

    if (type === 'mcq_4') {
        let sel = card.querySelector(`input[name="${qid}"]:checked`);
        if (!sel) {
            alert('Vui lòng chọn 1 đáp án trước khi kiểm tra!');
            return;
        }
        isCorrect = (sel.value.toUpperCase() === ans.trim().toUpperCase());
        earnedPoints = isCorrect ? maxPoints : 0;
    } 
    else if (type === 'true_false') {
        // ans format: "a:T|b:F|c:T|d:F"
        let parts = ans.split('|').map(p => p.trim());
        let totalSubs = parts.length;
        let correctCount = 0;
        let hasUnanswered = false;

        parts.forEach(p => {
            let [subKey, expected] = p.split(':');
            let sel = card.querySelector(`input[name="${qid}_${subKey}"]:checked`);
            if (!sel) hasUnanswered = true;
            else if (sel.value === expected) correctCount++;
        });

        if (hasUnanswered) {
            alert('Vui lòng trả lời đủ cả 4 ý Đúng/Sai trước khi chấm điểm!');
            return;
        }

        // Quy chế Bộ GD&ĐT
        if (correctCount === 4) earnedPoints = maxPoints; // 1.0đ
        else if (correctCount === 3) earnedPoints = maxPoints * 0.5; // 0.5đ
        else if (correctCount === 2) earnedPoints = maxPoints * 0.25; // 0.25đ
        else if (correctCount === 1) earnedPoints = maxPoints * 0.1; // 0.1đ
        else earnedPoints = 0;

        isCorrect = (correctCount === 4);
    } 
    else if (type === 'short_answer') {
        let inputEl = card.querySelector('.short-answer-input');
        if (!inputEl || !inputEl.value.trim()) {
            alert('Vui lòng nhập đáp số trước khi kiểm tra!');
            return;
        }
        let userVal = inputEl.value.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
        let accepted = ans.toLowerCase().split('|').map(s => s.trim().replace(/\s+/g, '').replace(',', '.'));
        isCorrect = accepted.includes(userVal);
        earnedPoints = isCorrect ? maxPoints : 0;
    } 
    else if (type === 'fill_blank') {
        // ans format: "1:val1|2:val2"
        let parts = ans.split('|').map(p => p.trim());
        let correctCount = 0;
        parts.forEach(p => {
            let [idx, expVal] = p.split(':');
            let input = card.querySelector(`input[data-blank="${idx}"]`);
            if (input && input.value.trim().toLowerCase() === expVal.trim().toLowerCase()) {
                correctCount++;
                input.classList.remove('border-rose-500', 'bg-rose-50');
                input.classList.add('border-emerald-500', 'bg-emerald-50');
            } else if (input) {
                input.classList.remove('border-emerald-500', 'bg-emerald-50');
                input.classList.add('border-rose-500', 'bg-rose-50');
            }
        });
        isCorrect = (correctCount === parts.length);
        earnedPoints = (correctCount / parts.length) * maxPoints;
    } 
    else if (type === 'matching') {
        // ans format: "1-C|2-A|3-D|4-B"
        let pairs = ans.split('|').map(p => p.trim().toUpperCase());
        let correctCount = 0;
        pairs.forEach(pair => {
            let [left, right] = pair.split('-');
            let sel = card.querySelector(`select[data-match="${left}"]`);
            if (sel && sel.value.toUpperCase() === right) {
                correctCount++;
            }
        });
        isCorrect = (correctCount === pairs.length);
        earnedPoints = (correctCount / pairs.length) * maxPoints;
    } 
    else if (type === 'ordering') {
        let inputEl = card.querySelector('input[type="text"]');
        if (!inputEl || !inputEl.value.trim()) {
            alert('Vui lòng nhập thứ tự các bước trước khi kiểm tra!');
            return;
        }
        let userVal = inputEl.value.trim().replace(/\s+/g, '').replace(/[\rightarrow,>]/g, '-').toUpperCase();
        let expected = ans.trim().replace(/\s+/g, '').toUpperCase();
        isCorrect = (userVal === expected);
        earnedPoints = isCorrect ? maxPoints : 0;
    }

    // Hiển thị trạng thái phản hồi
    card.classList.remove('border-slate-200', 'border-emerald-500', 'border-rose-500', 'bg-emerald-50/20', 'bg-rose-50/20');
    if (isCorrect) {
        card.classList.add('border-emerald-500', 'bg-emerald-50/20');
        alert(`Chúc mừng! Bạn đã trả lời CHÍNH XÁC. (+${earnedPoints.toFixed(2)} điểm)`);
    } else {
        card.classList.add('border-rose-500', 'bg-rose-50/20');
        alert(`Chưa chính xác! Điểm đạt được: ${earnedPoints.toFixed(2)}/${maxPoints} điểm. Hãy bấm "Xem lời giải chi tiết" để hiểu rõ hơn.`);
    }
}
</script>
```
