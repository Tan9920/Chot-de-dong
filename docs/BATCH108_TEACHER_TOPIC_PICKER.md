# Batch108 — Teacher Topic Picker & Data Label Safety Upgrade

## Vấn đề thật sau khi test Batch107

Người dùng thử demo offline và thấy bản nháp có thể ra:

- Lớp 5
- Môn Tiếng Việt
- Chủ đề/Bài học: Phân số
- Nhãn dữ liệu: verified

Đây là lỗi UX + governance nghiêm trọng vì:

1. `Phân số` là chủ đề Toán, không phải Tiếng Việt.
2. Giáo viên bị bắt tự biết và tự gõ chủ đề.
3. Người dùng không được tự chọn `verified`; verified phải đến từ catalog/registry/source/reviewer/license thật.
4. Nếu để sai, sản phẩm dễ mất uy tín dù mới là demo.

## Giải pháp Batch108

### 1. Topic picker theo lớp + môn

Thêm `data/teacher-pilot-topic-picker-catalog.json` để UI sinh dropdown theo ngữ cảnh.

### 2. Không còn nhãn verified do người dùng tự chọn

HTML không còn `<select id="source">`. Nhãn dữ liệu hiện là:

- `seed` cho catalog demo/chưa review;
- `custom_teacher_input` cho chủ đề giáo viên tự nhập;
- `verified` chỉ có thể xuất hiện khi catalog/registry thật có bằng chứng.

### 3. Chủ đề tự nhập là ngoại lệ có cảnh báo

Giáo viên vẫn có thể bật "Tôi muốn tự nhập chủ đề khác", nhưng hệ thống ghi rõ đó là `custom_teacher_input`, không phải verified.

### 4. Không sinh kiến thức sâu

Batch108 vẫn chỉ dựng khung giáo án an toàn. Nội dung học thuật, bài tập, đáp án, học liệu, ngữ liệu phải do giáo viên nhập/chọn từ nguồn hợp lệ.

## Trạng thái thật

Batch108 là source-level/offline improvement. Nó hoàn thành lát cắt nhập liệu giáo viên tốt hơn, nhưng không claim hosted/runtime pass. Các blocker registry/install/build/smoke của Batch105–106 vẫn cần xử lý bằng môi trường có npm registry và hosted URL thật.

## Claim policy

Có thể nói:

- Đã có demo offline mở trực tiếp.
- Đã sửa lỗi Tiếng Việt + Phân số.
- Đã bỏ quyền tự chọn verified.
- Đã có catalog lớp/môn/chủ đề bước đầu.

Không được nói:

- production-ready;
- hosted đã chạy thật;
- verified học thuật 1–12;
- sinh giáo án đầy đủ nội dung chuyên môn;
- chuẩn Bộ/đúng 100%.

## Guardrails

- không thêm AI;
- không tạo verified giả;
- không copy dài SGK/tài liệu bản quyền;
- không sinh Casio/máy tính cầm tay nếu thiếu dữ liệu duyệt hoặc giáo viên tự nhập;
- không public community content nếu thiếu moderation/review;
- không claim hosted/runtime pass.
