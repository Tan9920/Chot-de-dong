# Batch97 Version + Runtime Smoke Notes

Batch97 là cầu nối từ Batch96 sang Batch98. Trọng tâm là version consistency và smoke wiring đúng với auth gate thật.

Các smoke save/export phải đi qua:

1. CSRF.
2. Register/login tài khoản giáo viên thật.
3. `/api/auth/me` có session và `authAccountId`.
4. `/api/lessons` lưu lesson.
5. `/api/export/docx` và `/api/export/pdf` xuất bằng `lessonId`.

Nếu thiếu `node_modules`, thiếu Next SWC hoặc thiếu `.next/BUILD_ID`, không được claim runtime pass.
