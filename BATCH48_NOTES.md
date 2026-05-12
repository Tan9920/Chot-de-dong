# Batch48 — Auth Lifecycle, Session Revocation & Security Ops Foundation

## Mục tiêu

Batch48 tiếp tục sau Batch47, tập trung hoàn thiện nền tài khoản thay vì thêm AI/billing:

- Thêm vòng đời tài khoản local auth: status, pending verification foundation, locked/disabled, failed-login counter.
- Khóa tài khoản tạm thời sau nhiều lần đăng nhập sai.
- Thêm đổi mật khẩu qua POST + session + CSRF + rate-limit + audit log.
- Gắn session với authAccountId để có thể thu hồi phiên theo tài khoản.
- Thêm logout-all để thu hồi toàn bộ phiên của tài khoản email/mật khẩu.
- Thêm API đọc security audit log cho người có quyền quản trị membership.
- Chuẩn bị Prisma schema cho session/auth lifecycle fields.
- Thêm validator chạy trực tiếp bằng Node, không cần node_modules.

## File tạo mới

- `BATCH48_NOTES.md`
- `app/api/auth/change-password/route.ts`
- `app/api/auth/logout-all/route.ts`
- `app/api/admin/security-audit/route.ts`
- `scripts/validate-auth-lifecycle.mjs`
- `scripts/validate-auth-lifecycle.ts`
- `scripts/verify-batch48-source.mjs`
- `scripts/verify-batch48-source.ts`

## File sửa chính

- `.env.example`
- `package.json`
- `prisma/schema.prisma`
- `lib/types.ts`
- `lib/storage.ts`
- `lib/account-security.ts`
- `lib/security-audit-log.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `components/workspace.tsx`

## Đã làm thật

### 1. Account lifecycle foundation

`lib/account-security.ts` hiện hỗ trợ:

- `LocalAuthAccountStatus`: `active`, `disabled`, `locked`, `pending_verification`.
- `failedLoginCount`.
- `lockedUntil`.
- `emailVerifiedAt` foundation.
- `passwordUpdatedAt`.
- `GIAOAN_REQUIRE_EMAIL_VERIFICATION` config foundation.
- `GIAOAN_AUTH_MAX_FAILED_LOGIN`.
- `GIAOAN_AUTH_LOCK_MINUTES`.
- `changePasswordAccount()`.

Nếu đăng nhập sai quá nhiều lần, tài khoản bị khóa tạm thời. Khi hết hạn lock, lần kiểm tra tiếp theo có thể mở lại về `active`.

### 2. Change password route

Tạo `POST /api/auth/change-password`:

- yêu cầu session active;
- yêu cầu `assertWriteProtection`;
- có `assertRuntimeRateLimit`;
- dùng `readJsonBody` giới hạn payload;
- gọi `changePasswordAccount`;
- mặc định thu hồi phiên khác qua `revokeSessionsByAuthAccountId`;
- ghi `auth_change_password` vào security audit log.

### 3. Logout all route

Tạo `POST /api/auth/logout-all`:

- yêu cầu session active;
- yêu cầu CSRF/write protection;
- có rate limit;
- chỉ hoạt động nếu session có `authAccountId`;
- thu hồi toàn bộ session của auth account;
- clear cookie session;
- ghi `auth_logout_all` audit event.

### 4. Session revocation foundation

`SessionUser` và `StoredSession` có thêm `authAccountId`.

`lib/storage.ts` có thêm:

- lưu `authAccountId` khi tạo session;
- trả `authAccountId` khi đọc session;
- `revokeSessionsByAuthAccountId`;
- `revokeAllSessionsForAuthAccount`.

### 5. Security audit ops API

Tạo `GET /api/admin/security-audit`:

- yêu cầu `membership:manage`;
- có rate limit;
- admin có thể lọc rộng hơn;
- leader bị giới hạn theo school/department của session;
- hỗ trợ filter `eventType`, `outcome`, `limit`, `schoolKey`, `departmentKey`.

`lib/security-audit-log.ts` có thêm `listSecurityAuditEvents()`.

### 6. Workspace UI

`components/workspace.tsx` có panel “Bảo mật tài khoản” khi đã đăng nhập:

- nhập email tài khoản;
- nhập mật khẩu hiện tại;
- nhập mật khẩu mới;
- nút đổi mật khẩu;
- nút đăng xuất mọi thiết bị.

## Vẫn là foundation/scaffold

- Chưa có email sender thật, nên `pending_verification` chỉ là nền trạng thái/config.
- Chưa có reset password qua email.
- Chưa có UI admin xem audit log đầy đủ; mới có API.
- Session revocation với DB cần Prisma migrate/generate thật.
- Rate limit vẫn in-memory, chưa Redis/distributed.
- JSON fallback vẫn dùng cho local/dev nếu chưa có DB.
- Chưa có full auth device management UI.

## Verify đã pass thật

Chạy trực tiếp trong repo:

```bash
node scripts/validate-auth-lifecycle.mjs
```

Kết quả:

```text
Batch48 auth lifecycle validation passed.
```

```bash
node scripts/verify-batch48-source.mjs
```

Kết quả:

```json
{
  "ok": true,
  "jsonFilesParsed": 39,
  "sourceFilesScanned": 268,
  "aiFindings": 0
}
```

```bash
node scripts/validate-route-hardening-db-auth.mjs
```

Kết quả:

```text
Batch47 route hardening + DB auth migration prep validation passed.
```

```bash
node scripts/verify-batch47-source.mjs
```

Kết quả:

```json
{
  "ok": true,
  "jsonFilesParsed": 39,
  "sourceFilesScanned": 209,
  "aiFindings": 0
}
```

## Chưa verify được

- `npm install --ignore-scripts --no-audit --no-fund` vẫn timeout trong môi trường này.
- `npm run auth:lifecycle-validate` qua npm bị timeout/không ổn định; chạy trực tiếp bằng `node scripts/validate-auth-lifecycle.mjs` thì pass.
- `tsc --noEmit --pretty false` timeout/chưa có kết quả pass.
- Chưa chạy được `npm run typecheck`, `npm run lint`, `npm run build` tới kết quả thật.
- Chưa smoke test HTTP thật qua Next server.
- Chưa Prisma generate/migrate/push.
- Chưa test runtime DOCX/PDF sau các thay đổi mới.

## Rủi ro còn lại

- Code đã có validator source-level nhưng chưa có build/runtime proof.
- `pending_verification` chưa có email verification flow thật.
- Reset password chưa làm.
- Account lockout dùng JSON/DB foundation, chưa có CAPTCHA/device intelligence.
- Audit log API chưa có UI dashboard đầy đủ.
- Dữ liệu giáo dục lớp 1–12 vẫn là seed/starter/scaffold, không phải verified corpus.
- Không được quảng cáo sản phẩm là “chuẩn Bộ”, “dùng ngay 100%”, hoặc “AI tạo giáo án chuẩn”.

## Lệnh nên chạy lại ở môi trường đủ deps

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run auth:lifecycle-validate
npm run route:hardening-validate
npm run verify:batch48
npm run verify:batch47
npm run auth:invite-csrf-validate
npm run runtime:security-ux-validate
npm run product:trust-security-validate
npm run data:validate
npm run typecheck
npm run lint
npm run build
npx prisma generate
npx prisma db push
```
