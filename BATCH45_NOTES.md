# Batch45 — Runtime Security Hardening & Workspace UX Foundation

## Mục tiêu

Batch45 tiếp tục sau Batch44, không thêm AI, không thêm billing thật, không tạo dữ liệu verified giả. Trọng tâm là làm nền runtime an toàn hơn và giảm độ rối của workspace cho giáo viên.

## Thay đổi chính

### 1. Runtime security guard

- Thêm `lib/runtime-security.ts`:
  - rate limit in-memory theo fingerprint request;
  - đọc JSON body có giới hạn `content-length`;
  - helper `requireActiveSession`;
  - helper `requirePermission`;
  - helper text bounded.
- Thêm `middleware.ts` để gắn security headers cơ bản:
  - `X-Content-Type-Options: nosniff`;
  - `X-Frame-Options: DENY`;
  - `Referrer-Policy`;
  - `Permissions-Policy`;
  - `Cross-Origin-Opener-Policy`.

### 2. Route hardening

Đã nối guard/rate/body-limit vào các route nhạy cảm:

- `/api/auth/login`;
- `/api/generate` và `/api/template-builder` qua re-export;
- `/api/export/docx`;
- `/api/export/pdf`;
- `/api/lessons`;
- `/api/lessons/[id]`;
- `/api/lessons/[id]/reviews`;
- `/api/lesson-quality`;
- `/api/settings`;
- `/api/admin/memberships`.

Export DOCX/PDF giờ yêu cầu session active thay vì cho anonymous export trực tiếp bằng payload query/body.

### 3. Workspace UX foundation

- Thêm chế độ hiển thị:
  - Dễ dùng;
  - Tiêu chuẩn;
  - Nâng cao.
- Dễ dùng chỉ giữ flow chính: soạn giáo án, kho nội bộ, dashboard.
- Tiêu chuẩn mở thêm chương trình, ngân hàng câu hỏi/rubric, thư viện.
- Nâng cao mới mở vận hành, thiết lập, quản trị nội dung nếu có quyền.
- Login UI có thêm `Mã mời quyền cao nếu có`; bỏ trống thì không thể nhận quyền cao chỉ bằng tên.

## Chưa làm trong batch này

- Chưa thêm password/OAuth/email verification thật.
- Chưa thêm CSRF token hoàn chỉnh.
- Chưa có rate limit phân tán qua Redis/Postgres; hiện là in-memory foundation.
- Chưa refactor lớn `components/workspace.tsx` thành nhiều component nhỏ.
- Chưa smoke test runtime HTTP/Next server do môi trường thiếu `node_modules`.

## Lệnh kiểm tra mới

```bash
npm run runtime:security-ux-validate
```

