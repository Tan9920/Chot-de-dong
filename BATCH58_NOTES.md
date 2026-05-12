# Batch58 — Server-side Release Sign-off Workflow Hardening

Ngày: 27/04/2026

## Mục tiêu

Batch58 nâng cấp sau Batch57 bằng cách chặn rủi ro lớn còn lại: sign-off không được tin từ payload/client. Release dossier vẫn có human sign-off, nhưng từ Batch58 export/public/readiness chỉ dùng sign-off trusted được ghi qua workflow server-side.

Không thêm AI, không thêm billing thật, không tạo dữ liệu verified giả, không quảng cáo quá mức.

## Làm thật trong source

### 1. Server-side sign-off workflow

File mới:
- `lib/release-signoff-workflow.ts`
- `data/release-signoff-workflows.json`

Chức năng chính:
- Tạo target key ổn định cho lesson/community/school/marketing release.
- Xác định required sign-off roles theo audience.
- Ghi quyết định ký duyệt server-side với `trusted: true`.
- Phân quyền ký theo role:
  - `teacher_owner`: active session.
  - `subject_reviewer`, `pedagogy_reviewer`: leader/admin/canReviewLessons.
  - `legal_reviewer`: admin/canPublishContent/canManageContent.
  - `school_admin`: admin hoặc leader có canManageContent.
- Tổng hợp trạng thái workflow: `open`, `changes_requested`, `rejected`, `approved`.

### 2. API sign-off riêng

File mới:
- `app/api/release-dossier/signoffs/route.ts`

Route:
- `GET /api/release-dossier/signoffs`
  - cần active session;
  - trả workflow/sign-off summary theo target;
  - có policy nói rõ client-supplied signoff bị bỏ qua.

- `POST /api/release-dossier/signoffs`
  - cần active session;
  - cần write protection/CSRF;
  - rate limit;
  - ghi decision qua `recordReleaseSignOffDecision()`;
  - audit event `release_dossier_signoff`.

### 3. Release dossier readiness không tin signOffs từ client

File sửa:
- `app/api/release-dossier/readiness/route.ts`

Thay đổi:
- Import `collectTrustedReleaseSignOffs()`.
- Dossier readiness dùng `signOffWorkflow.trustedSignOffs`.
- Không dùng `payload.signOffs`.
- Response có `signOffWorkflow` và policy `signOffRequiresServerSideWorkflow`.

### 4. Export/community enforcement không tin signOffs từ client

File sửa:
- `lib/release-dossier-enforcement.ts`

Thay đổi:
- Export DOCX/PDF gate gọi `collectTrustedReleaseSignOffs()`.
- Community public gate gọi `collectTrustedReleaseSignOffs()`.
- `buildReleaseDossier()` nhận `signOffWorkflow.trustedSignOffs`.
- Summary thêm:
  - `trustedSignOffWorkflowId`;
  - `trustedSignOffWorkflowStatus`;
  - `trustedSignOffTargetKey`;
  - `clientSuppliedSignOffsIgnored`.

### 5. Admin board có sign-off workflow

File sửa:
- `app/api/admin/release-dossiers/route.ts`

Thay đổi:
- Trả thêm `signOffWorkflows`.
- Summary có số workflow approved/blocked.
- Policy nói rõ sign-off phải đến từ server-side workflow.

### 6. Type/schema prep

File sửa:
- `lib/types.ts`
- `prisma/schema.prisma`

Thêm fields summary cho trusted sign-off workflow.
Thêm Prisma prep model `ReleaseSignOffWorkflowRecord`.

Lưu ý: Prisma chỉ là prep/source-level; chưa claim DB runtime khi chưa `prisma generate/db push`.

### 7. Validator/smoke/verifier

File mới:
- `scripts/validate-release-signoff-workflow.mjs`
- `scripts/smoke-batch58-release-signoff-source.mjs`
- `scripts/verify-batch58-source.mjs`

Package scripts mới:
- `release:signoff-validate`
- `smoke:batch58`
- `verify:batch58`

## Chưa nối kín / còn foundation

- Chưa có UI reviewer ký duyệt hoàn chỉnh.
- Chưa có notification cho reviewer.
- JSON fallback chưa có transaction/immutable audit.
- Chưa test HTTP runtime thật.
- Chưa chạy Prisma migration/generate thật.
- Chưa có ràng buộc DB-level với user/role table.

## Rủi ro còn lại

- Runtime/build/typecheck phụ thuộc `npm install` vẫn cần verify.
- JSON fallback có nguy cơ race condition nếu nhiều reviewer ký cùng lúc.
- Người ký `teacher_owner` hiện chỉ yêu cầu active session; production nên nối ownership thật theo lesson/resource.
- Legal/school roles vẫn là source-level permission logic, chưa phải RBAC production đầy đủ.
- Release dossier là workflow giảm rủi ro, không phải legal guarantee.

## Lệnh kiểm tra

```bash
npm run release:signoff-validate
npm run smoke:batch58
npm run verify:batch58
npm run release:enforcement-validate
npm run smoke:batch57
npm run verify:batch57
npm run release:dossier-validate
npm run smoke:batch56
npm run verify:batch56
npm run runtime:readiness-validate
npm run typecheck
npm run build
npx prisma generate
npx prisma db push
```

Không được claim production-ready nếu typecheck/build/prisma/runtime HTTP chưa pass thật.
