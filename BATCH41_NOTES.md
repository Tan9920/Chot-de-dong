# Batch41 — Rule-based Lesson Quality Checklist & Runtime Gate

## Mục tiêu

Batch41 bổ sung một lớp kiểm tra chất lượng giáo án theo quy tắc rõ ràng, không dùng AI, để giảm rủi ro giáo án đẹp về hình thức nhưng thiếu cấu trúc kỹ thuật, thiếu minh chứng đánh giá, lệch lớp/khối hoặc thiếu nhãn governance/provenance.

## Phạm vi đã làm

- Thêm engine `lib/lesson-quality-checklist.ts` đánh giá giáo án theo các nhóm: Yêu cầu cần đạt, cấu trúc kỹ thuật hoạt động, đánh giá/minh chứng, học liệu/thiết bị, thời lượng, phù hợp lớp/khối, governance/provenance và tên môn học.
- Generator trả kèm `qualityChecklist` cho giáo án sinh từ template.
- API `/api/lesson-quality` cho phép chạy checklist lại trên nội dung đang chỉnh sửa.
- Save/create/update lesson chặn gửi duyệt hoặc duyệt nếu checklist còn blocker.
- Export DOCX/PDF đưa checklist vào compliance packet; nếu còn blocker thì ép watermark/chế độ nội bộ thay vì export nhìn như bản chính thức.
- Workspace hiển thị panel checklist và nút kiểm tra thủ công.
- Bổ sung script `npm run lesson:quality-validate`.

## Điều không làm trong batch này

- Không thêm AI, model, API key hay prompt generation.
- Không thêm dữ liệu verified giả.
- Không biến seed/starter thành nội dung đã kiểm chứng.
- Không chặn toàn bộ export nội bộ, vì giáo viên vẫn cần xuất bản nháp để rà soát; chỉ chặn/đánh dấu export chính thức khi còn blocker.
- Không thay workflow tổ chuyên môn bằng checklist; checklist chỉ là gate kỹ thuật ban đầu.

## Gate hiện tại

- `reviewGateAllowed = false` khi còn blocker.
- `officialExportGateAllowed = false` khi còn blocker hoặc điểm quá thấp.
- Lesson ở trạng thái `draft` vẫn có thể lưu để chỉnh sửa tiếp.
- Lesson gửi duyệt/approve phải qua checklist trước khi qua governance gate sẵn có.

## Lưu ý vận hành

Checklist hiện là rule-based heuristic. Nó giúp phát hiện thiếu cấu trúc và rủi ro hiển nhiên, nhưng không thay thế review chuyên môn, không xác nhận nội dung đã đúng SGK/CTGDPT và không biến tài liệu seed/community thành verified.
