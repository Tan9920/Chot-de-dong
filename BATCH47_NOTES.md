# Batch47 — Verification, Route Hardening & Database Auth Migration Prep

## Mục tiêu

Batch47 tiếp tục từ Batch46 nhưng không thêm AI/billing/marketplace. Trọng tâm là giảm rủi ro runtime/security trước khi làm tính năng mới:

- Hoàn tất hardening các write route còn hở sau Batch46.
- Bỏ side effect `apply=true` trên GET của official source bootstrap.
- Chuẩn hóa body parser qua `readJsonBody()` có giới hạn payload.
- Phủ `assertRuntimeRateLimit()` cho các write route còn thiếu.
- Thêm audit log bảo mật foundation cho auth/invite/export.
- Chuẩn bị Prisma schema cho database-backed auth/invite/audit log, nhưng vẫn giữ JSON fallback.
- Thêm validator nguồn chạy được không cần `tsx`/`node_modules`.

## Thay đổi chính

### 1. Route hardening

Đã chuyển các route admin/content còn dùng `request.json()` thô sang `readJsonBody()`:

- `app/api/admin/content/[entity]/lifecycle/route.ts`
- `app/api/admin/content/[entity]/reviews/route.ts`
- `app/api/admin/content/[entity]/route.ts`
- `app/api/admin/content/[entity]/source-status/route.ts`
- `app/api/admin/content/dossiers/import/route.ts`
- `app/api/admin/content/evidence-ledger/materialize/route.ts`
- `app/api/admin/content/evidence-ledger/route.ts`
- `app/api/admin/content/import/route.ts`
- `app/api/admin/content/packs/curation-actions/route.ts`
- `app/api/admin/content/packs/curation-registry/route.ts`
- `app/api/admin/content/packs/evidence-review-actions/route.ts`
- `app/api/admin/content/packs/evidence-review-pack-actions/route.ts`
- `app/api/admin/content/packs/evidence-review-registry/route.ts`
- `app/api/admin/content/packs/execution-registry/route.ts`
- `app/api/admin/content/packs/route.ts`
- `app/api/admin/content/reference-bundles/route.ts`
- `app/api/admin/content/rollout-bootstrap/route.ts`
- `app/api/admin/content/rollout-waves/route.ts`
- `app/api/admin/lessons/provenance-backfill/route.ts`

Các route trên cũng được thêm `assertRuntimeRateLimit()` ở nhánh write.

### 2. Official source bootstrap an toàn hơn

`app/api/admin/content/official-source-bootstrap/route.ts`:

- `GET` giờ chỉ preview.
- Nếu gọi `GET ?apply=true`, route trả `405` và thông báo phải dùng `POST` kèm CSRF.
- `POST` có `assertWriteProtection()`, `assertRuntimeRateLimit()`, `readJsonBody()`.

### 3. Source authorities an toàn hơn

`app/api/admin/content/source-authorities/route.ts`:

- `POST` có `assertWriteProtection()`.
- `POST` có `assertRuntimeRateLimit()`.
- `POST` dùng `readJsonBody()` thay `request.json()` thô.

### 4. Auth bootstrap hardening

`app/api/auth/login/route.ts` và `app/api/auth/register/route.ts`:

- Thêm `assertSameOrigin()` cho auth bootstrap.
- Giữ nguyên việc login/register không bắt CSRF vì đây là route phát session/CSRF ban đầu.
- Thêm audit log cho success/failure/blocked.

`app/api/auth/logout/route.ts`:

- Thêm rate-limit.
- Thêm audit log logout success.

### 5. Lesson restore hardening

`app/api/lessons/[id]/versions/[versionId]/restore/route.ts`:

- Thêm `assertRuntimeRateLimit()` cho POST restore.

### 6. Security audit log foundation

Tạo mới:

- `lib/security-audit-log.ts`
- `data/security-audit-log.json`

Đặc điểm:

- JSON fallback mặc định.
- Nếu DB đã migrate/generate model `SecurityAuditLog`, helper có thể ghi DB qua Prisma rồi fallback JSON nếu lỗi.
- Không lưu email thô làm định danh chính; dùng `actorEmailHash`.
- Scrub metadata key nhạy cảm như password/token/code/secret.
- Ghi event cho login/register/logout, invite create/revoke, export DOCX/PDF success/quota-blocked.

### 7. Database auth migration prep

Cập nhật `prisma/schema.prisma` thêm:

- `LocalAuthAccountStatus`
- `MembershipInviteRecordStatus`
- `SecurityAuditLogOutcome`
- `SecurityAuditLogSeverity`
- `LocalAuthAccountRecord`
- `MembershipInviteRecord`
- `SecurityAuditLog`

`lib/account-security.ts` cũng được chuẩn bị để ưu tiên Prisma model `localAuthAccountRecord` nếu DB/client đã sẵn sàng, nhưng vẫn fallback JSON khi chưa migrate/generate.

Lưu ý: Membership invite runtime vẫn chủ yếu là JSON fallback; schema mới là migration prep, chưa phải migration production hoàn chỉnh.

### 8. Validator mới không cần node_modules

Tạo mới:

- `scripts/validate-route-hardening-db-auth.ts`
- `scripts/validate-route-hardening-db-auth.mjs`
- `scripts/verify-batch47-source.ts`
- `scripts/verify-batch47-source.mjs`

Cập nhật `package.json`:

- `route:hardening-validate`: `node scripts/validate-route-hardening-db-auth.mjs`
- `verify:batch47`: `node scripts/verify-batch47-source.mjs`

## Verify đã chạy thật

Chạy trực tiếp bằng Node, không qua `npm run`:

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
  "sourceFilesScanned": 204,
  "aiFindings": 0
}
```

Kiểm tra route source audit bằng Node inline:

- Không còn write route thiếu CSRF, trừ `auth/login` và `auth/register` là auth bootstrap route.
- Không còn `request.json()` thô trong write routes.
- Không còn write route thiếu `assertRuntimeRateLimit()` theo static audit.

## Verify chưa chạy/pass được

- `npm install --ignore-scripts --no-audit --no-fund` bị timeout, `node_modules` chưa được tạo.
- `npm run route:hardening-validate` bị timeout trong môi trường này dù `node scripts/validate-route-hardening-db-auth.mjs` chạy trực tiếp pass.
- `npm run typecheck`, `npm run lint`, `npm run build` chưa verify được do thiếu `node_modules`/môi trường cài dependency không hoàn tất.
- Chưa smoke test Next server thật.
- Chưa test HTTP thật login/register -> csrf -> generate -> save -> review -> export.
- Chưa chạy Prisma generate/migrate cho các model mới.

## Rủi ro còn lại

- Auth DB migration mới là prep; chưa migrate production.
- Invite DB runtime chưa chuyển hoàn toàn sang DB; vẫn JSON fallback là chính.
- Chưa có email verification/reset password/change password/account lockout hoàn chỉnh.
- Rate limit vẫn in-memory, chưa distributed.
- CSRF vẫn double-submit foundation, chưa session-bound server store.
- Security audit log JSON fallback chưa phải audit pipeline production.
- Dữ liệu giáo dục lớp 1-12 vẫn seed/starter/scaffold; không được nâng nhãn thành verified nếu chưa có review thật.
- Legal/community moderation/takedown vẫn còn là foundation, chưa vận hành đầy đủ.

## Lệnh nên chạy tiếp khi có môi trường đủ dependency

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run route:hardening-validate
npm run verify:batch47
npm run auth:invite-csrf-validate
npm run runtime:security-ux-validate
npm run product:trust-security-validate
npm run coverage:truth-validate
npm run lesson:quality-validate
npm run export:compliance-validate
npm run lesson:governance-validate
npm run operating:foundation-validate
npm run operating:runtime-validate
npm run lesson:pedagogy-validate
npm run lesson:grade-structure-validate
npm run lesson:technical-drafting-validate
npm run data:validate
npm run typecheck
npm run lint
npm run build
```
