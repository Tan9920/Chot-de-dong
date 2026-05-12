# Batch110 — Curriculum Matrix, Primary Bookset Mode & Safer Lesson Composer

## Mục tiêu
- Nâng sâu phần chiến lược ma trận dữ liệu/chương trình vừa bàn.
- Đặt Kết nối tri thức làm trục dữ liệu chính linh hoạt trong teacher flow.
- Ẩn Cánh Diều/Chân trời sáng tạo khỏi luồng giáo viên thường; giữ dạng legacy/reference-only cho admin/reference.
- Tạo Curriculum Compatibility Matrix: lớp → môn → bộ sách/trục → bài/chủ đề → recordType → dataStatus → supportLevel → contentDepthAllowed/releaseAllowed.
- Backend/source tự tính trạng thái dữ liệu; không tin input người dùng, không cho legacy/custom/unmapped thành verified.
- Cải thiện composer an toàn theo ngữ cảnh sĩ số/không gian/thiết bị/mức học sinh/mục tiêu tiết học.

## Phạm vi đã làm
- Thêm `data/curriculum-compatibility-matrix.json`.
- Thêm `lib/curriculum-compatibility-matrix.ts`.
- Thêm API `/api/curriculum/matrix` và `/api/admin/curriculum-gap-board`.
- Nối ma trận vào `/api/teacher-pilot/completion` và admin board.
- Cập nhật offline HTML `public/teacher-pilot-demo.html` với bookset primary, context selectors, matrix snapshot và gap board.
- Thêm validator/report Batch110.

## Guardrails
- Không thêm AI.
- Không tạo verified giả.
- Không claim hosted/runtime pass.
- Không claim DOCX/PDF server-side pass.
- Không copy dài SGK/tài liệu bản quyền.
- Nếu thiếu nguồn/reviewer/release gate thì chỉ dựng khung an toàn.
