# BATCH107 — Teacher Pilot Completion Slice

Mục tiêu: tạo một lát cắt demo giáo viên hoàn chỉnh ở mức offline/source-level để dự án không tiếp tục chững lại vì npm registry/build/hosted smoke.

Đã làm:
- Thêm `public/teacher-pilot-demo.html`: demo offline mở trực tiếp sau khi giải nén ZIP, không cần npm install/build.
- Thêm `data/teacher-pilot-completion-pack.json`: tiêu chí completion, profile lớp, chế độ Dễ dùng/Tiêu chuẩn/Nâng cao, claim policy.
- Thêm `lib/teacher-pilot-completion.ts`: dựng board và khung giáo án an toàn.
- Thêm API `/api/teacher-pilot/completion` và `/api/admin/teacher-pilot-completion-board`.
- Thêm report/validator Batch107.
- Thêm card Batch107 vào workspace và demo breakthrough.

Nguyên tắc giữ nguyên:
- không thêm AI;
- không tạo verified giả;
- không mở contentDepthAllowed giả;
- không claim hosted/runtime pass nếu install/build/smoke chưa pass;
- không claim production-ready.

Giới hạn:
- Đây là offline/source-level completion slice, không thay thế Vercel hosted runtime proof.
- Dữ liệu học thuật vẫn là seed/scaffold/draft; khung giáo án không sinh kiến thức sâu.

Marker vận hành: GIAOAN_BATCH107_TEACHER_PILOT_COMPLETION=offline_teacher_demo_slice_ready_source_level.
