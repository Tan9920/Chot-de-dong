# Batch34 - lesson compliance packet + release board

## Trọng tâm
Đưa governance của giáo án đã lưu tiến thêm một tầng từ snapshot/gating sang **lesson-level compliance packet** có thể audit và dùng cho approval/release board.

Batch này không làm dày riêng lớp 6. Nó áp dụng cho mọi giáo án thuộc scope 1–12 vì packet đọc từ `SavedLessonPlan.governanceSnapshot`, settings trường/tổ, citation appendix và workflow status của chính giáo án.

## Những gì đã thêm
- Type mới:
  - `LessonCitationAppendixEntry`
  - `LessonComplianceIssue`
  - `LessonCompliancePacket`
  - `LessonComplianceBoardItem`
  - `LessonComplianceBoardSummary`
- Module mới `lib/lesson-compliance.ts`:
  - build citation appendix từ source references
  - kiểm tra locator, access model, storage policy, rights status
  - gom governance assessment + citation/legal/workflow/release issues
  - quyết định `official_release_ready` / `internal_review_only` / `blocked`
  - build board toàn bộ giáo án nhìn theo grade/support/source/release/blockers
- API mới:
  - `GET /api/lessons/[id]/compliance`
  - `GET /api/admin/lessons/compliance-board`
- Export DOCX/PDF:
  - nhận `lessonStatus`
  - sinh `LessonCompliancePacket` trong export guard
  - in thêm phần `LESSON COMPLIANCE PACKET`
  - ép watermark nếu packet còn blocker hoặc export guard không đạt
- Workspace:
  - giữ `currentLessonStatus`
  - truyền `lessonStatus` khi export để packet không đánh đồng draft/review/approved

## Giá trị thực tế
- Leader/admin có một board cấp giáo án để nhìn blocker release, không chỉ nhìn pack/content.
- Export không chỉ có provenance lines và citation appendix mà còn có packet ngắn về legal/workflow/release status.
- Giáo án đã lưu từ mọi lớp 1–12 đều đi qua cùng mô hình compliance, không có đường tắt riêng cho lớp 6.

## Giới hạn còn lại
- Chưa có UI riêng cho compliance board trong workspace/admin; hiện mới có API.
- Chưa có reviewer multi-signature cấp giáo án; packet dùng review count/history hiện có.
- Compliance packet vẫn dựa vào snapshot đã lưu và citation metadata; không tự xác minh nguồn ngoài hệ thống.
- Nếu dữ liệu cũ chưa có `governanceSnapshot`, packet sẽ chặn/hạ xuống nội bộ đúng theo nguyên tắc an toàn, không tự bịa provenance.
