# Batch46 — Auth, Invite & CSRF Foundation

## Mục tiêu

Nâng cấp tiếp từ Batch45 theo hướng nền vận hành thật hơn: tài khoản email/mật khẩu, invite code theo người/role, CSRF cho write routes, và giảm phụ thuộc vào đăng nhập demo bằng tên.

## Thay đổi chính

- Thêm `lib/account-security.ts` để đăng ký/đăng nhập bằng email + mật khẩu qua JSON fallback `data/auth-accounts.json`.
- Mật khẩu được hash bằng `crypto.scryptSync`, không lưu plain text.
- Thêm `lib/membership-invites.ts` và `data/membership-invites.json`.
- Invite code được lưu dạng hash SHA-256, chỉ trả raw code một lần khi tạo.
- Thêm route:
  - `POST /api/auth/register`
  - `GET /api/auth/csrf`
  - `GET/POST/DELETE /api/admin/membership-invites`
- Login demo bằng tên bị tắt mặc định, chỉ bật khi `GIAOAN_ALLOW_DEMO_LOGIN=true`.
- Login/register phát CSRF token và workspace gửi `x-csrf-token` cho các write request.
- Thêm `assertWriteProtection` trong `lib/runtime-security.ts` để kiểm tra same-origin và double-submit CSRF token.
- Tắt export DOCX/PDF qua GET để tránh CSRF/quota abuse; chỉ POST kèm CSRF token.
- Workspace thêm chế độ đăng ký/đăng nhập email/mật khẩu, mã mời quyền cao, và ghi rõ user tự đăng ký chỉ nhận quyền giáo viên.

## Giới hạn còn lại

- Chưa có xác minh email thật.
- Chưa có reset password.
- CSRF đang là double-submit cookie/token foundation, chưa phải session-bound server store.
- Rate limit vẫn in-memory, chưa phù hợp multi-instance production.
- Prisma schema chưa mở rộng cho password account/invite; batch này ưu tiên JSON fallback foundation để không phá DB hiện có.

## Verify gợi ý

```bash
npm run auth:invite-csrf-validate
npm run typecheck
npm run build
```

Nếu chưa có `node_modules`, có thể source-check bằng cách đọc các file nêu trên và chạy JSON parse cho `package.json`, `data/auth-accounts.json`, `data/membership-invites.json`.
