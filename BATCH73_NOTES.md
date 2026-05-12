# Batch73 — Runtime Security Closure for Demo Deploy

Ngày: 2026-04-29

## Mục tiêu

Đóng các điểm demo/no-op lớn nhất còn lại sau Batch72 trước khi public demo rộng hơn:

- Không để `getSessionUser()` trả `demoUser` vô điều kiện.
- Bắt CSRF tối thiểu cho write routes qua `x-csrf-token` + cookie.
- Có same-origin guard và content-type guard tối thiểu.
- Có in-memory rate-limit theo action/IP/user-agent.
- Không cho người dùng tự nâng role admin/leader nếu không có invite tin cậy.
- Permission guard cho SavedLesson/export theo owner/school/department/visibility.
- Có security audit log JSON cho các sự kiện auth/export/community.
- Không thêm AI, payment thật, marketplace tiền mặt, quỹ tiền mặt, verified giả.

## Thay đổi chính

### Auth/session

- `lib/auth.ts` đọc session cookie `giaoan_session` và resolve qua session store JSON.
- `lib/storage.ts` thêm `auth-sessions.json`, `createSessionUser`, `readSessionUserBySessionId`, revoke session/all sessions.
- `app/api/auth/csrf/route.ts` cấp CSRF token và bootstrap session `teacher` quyền thấp để giữ demo UX mà không cấp admin mặc định.

### Password account

- `lib/account-security.ts` chuyển từ stub verify-any sang JSON account store với `scryptSync`, salt riêng và `timingSafeEqual`.
- Đăng ký yêu cầu email hợp lệ và mật khẩu tối thiểu 8 ký tự.
- Đăng nhập không còn chấp nhận tùy ý mọi email/mật khẩu.

### Runtime guards

- `lib/runtime-security.ts` thêm:
  - CSRF header/cookie match;
  - same-origin check;
  - content-type guard tối thiểu;
  - in-memory rate bucket;
  - `requireActiveSession`/`requirePermission` dựa trên session thật.

### Lesson permission

- `lib/access.ts` không còn `return true` mặc định.
- `lib/governance.ts` và `lib/workflow.ts` delegate sang `assertLessonPermission`.
- Luồng read/export/manage phân biệt owner, admin/leader cùng phạm vi, school/department visibility.

### Audit log

- `lib/security-audit-log.ts` ghi/đọc `data/security-audit-events.json`.
- `data/auth-sessions.json` và `data/security-audit-events.json` được thêm làm JSON store foundation.

### Validator

- `scripts/validate-runtime-security-source.mjs` kiểm tra source-level các marker bảo mật chính.
- `package.json` thêm:
  - `runtime:security-validate`
  - `smoke:batch73`
  - `verify:batch73`

## Giới hạn còn lại

- Đây vẫn là security foundation, chưa production security.
- Session/account/audit còn JSON persistence, chưa DB-backed.
- Rate limit còn in-memory, chưa Redis/DB và không bền multi-instance.
- Chưa có email verification/reset password hoàn chỉnh.
- Chưa live HTTP smoke đầy đủ qua server thật.
- Chưa browser/mobile QA.
- Chưa mở DOCX/PDF bằng Word/Google Docs/LibreOffice.

## Kiểm tra cần chạy

```bash
npm run imports:validate
npm run data:validate
npm run demo:readiness-validate
npm run basic-flow:validate
npm run product:foundation-validate
npm run saved-lessons:persistence-validate
npm run export:compliance-validate
npm run runtime:security-validate
npm run smoke:batch73
npm run typecheck
npm run build
```
