# Batch57 — Release Dossier Enforcement & Export/Public Workflow Integration

Ngày thực hiện: 27/04/2026

## Mục tiêu

Batch57 nối kín phần Batch56 đã tạo nhưng chưa enforce đủ: release dossier phải trở thành gate bắt buộc ở các flow rủi ro cao, đặc biệt là export DOCX/PDF và public tài nguyên cộng đồng. Batch này không thêm AI, không thêm billing thật, không tạo dữ liệu verified giả, không copy SGK/học liệu bản quyền.

## Thay đổi chính

### 1. Release dossier enforcement helper

File mới:
- `lib/release-dossier-enforcement.ts`

Helper mới:
- `extractReleaseDossierFlags()` đọc confirmation/sign-off/legal/media flags từ request body.
- `enforceReleaseDossierForExport()` dựng release dossier trước khi xuất DOCX/PDF, lưu snapshot JSON fallback, gắn `releaseDossierSnapshotId` và `releaseDossierSummary` vào payload export.
- `enforceReleaseDossierForCommunityResource()` dựng release dossier khi admin cố public tài nguyên cộng đồng.
- `isReleaseDossierPublicReady()` dùng để chặn public listing nếu tài nguyên không có dossier public-ready.

### 2. Enforce export DOCX/PDF

File sửa:
- `app/api/export/docx/route.ts`
- `app/api/export/pdf/route.ts`

Luồng mới:
1. Quota guard vẫn chạy như cũ.
2. `buildGuardedExportPayload()` vẫn dựng compliance/quality guard như Batch42+.
3. `applyOperatingExportPolicy()` vẫn áp quota/watermark theo plan.
4. `enforceReleaseDossierForExport()` chạy trước `generateDocxBuffer()` / `generatePdfBuffer()`.
5. Nếu dossier còn blocker hoặc watermark required, payload bị giữ `watermarkMode='always'` và `officialUseAllowed=false`.
6. Audit event export ghi thêm release dossier decision, snapshot id, số blocker và trạng thái downgrade.

Lưu ý: Batch57 không chặn mọi export nháp. Nếu chưa đủ dossier, hệ thống vẫn có thể cho tải bản nội bộ/watermarked để giáo viên sửa, nhưng không cho official/no-watermark.

### 3. Export appendix có release dossier

File sửa:
- `lib/export-document-model.ts`

Export DOCX/PDF có thêm:
- `PHỤ LỤC D. RELEASE DOSSIER / HỒ SƠ PHÁT HÀNH`
- snapshot id;
- dossier id;
- audience;
- decision;
- canExport/canPublishPublic;
- watermarkRequired;
- blocker/warning count;
- required sign-offs;
- missing/rejected sign-offs;
- policy note;
- issue codes;
- public disclosures.

### 4. Community/public enforcement

File sửa:
- `lib/community-moderation.ts`
- `app/api/community/resources/route.ts`
- `app/api/admin/community-resources/route.ts`

Luồng mới:
- Public listing chỉ trả tài nguyên `visibility='public'` nếu vừa pass moderation/legal readiness vừa có release dossier summary public-ready.
- Khi admin publish tài nguyên, route review vẫn gọi `reviewCommunityResource()`, nhưng library sẽ chạy release dossier gate.
- Nếu moderation/legal readiness fail hoặc release dossier bị block, resource bị đưa về `moderation_queue` thay vì public.
- Admin audit metadata ghi thêm release dossier decision/snapshot/blockers.

### 5. Type/Prisma prep

File sửa:
- `lib/types.ts`
- `prisma/schema.prisma`

Thêm type `ReleaseDossierActionSummary` và trường traceability:
- `releaseDossierSnapshotId`
- `releaseDossierSummary`

Community resource thêm source/release readiness fields:
- `releaseTier`
- `supportLevel`
- `referenceCount`
- `fieldEvidenceCount`

Prisma chỉ là prep. Chưa thể claim DB-backed runtime khi chưa chạy được `npx prisma generate` / `npx prisma db push`.

### 6. Validator/smoke/verifier

File mới:
- `scripts/validate-release-dossier-enforcement.mjs`
- `scripts/smoke-batch57-release-enforcement-source.mjs`
- `scripts/verify-batch57-source.mjs`

Package scripts mới:
- `release:enforcement-validate`
- `smoke:batch57`
- `verify:batch57`

## Điều Batch57 đã làm thật

- Export DOCX/PDF route thật sự gọi release dossier gate trước khi tạo buffer.
- Export payload có snapshot/summary để phụ lục D hiển thị trong file xuất.
- Community public listing bị chặn nếu thiếu release dossier public-ready.
- Admin publish tài nguyên cộng đồng bị downgrade về moderation queue nếu release dossier chưa đạt.
- Có source-level validator/smoke/verifier để kiểm tra enforcement.

## Phần vẫn là foundation/scaffold

- Release dossier snapshot vẫn JSON fallback, chưa DB-backed runtime thật.
- Chưa có UI admin ký sign-off đầy đủ theo vai trò.
- Chưa có workflow notification/comment request changes hoàn chỉnh.
- Sign-off vẫn được truyền qua request/snapshot; chưa nối với bảng reviewer/user-role workflow production.
- Chưa có immutable/WORM audit log.
- Chưa có HTTP runtime smoke qua Next server.

## Chưa verify runtime/build

Batch57 không production-ready vì:
- `node_modules` ban đầu không tồn tại.
- Chưa thể claim `npm install`, `npm run typecheck`, `npm run build`, `npx prisma generate`, `npx prisma db push` pass thật nếu các lệnh đó chưa chạy sạch trong môi trường đầy đủ.
- Các lệnh Batch57 hiện chủ yếu là source-level validation.

## Rủi ro còn lại

- JSON fallback có nguy cơ race condition khi nhiều request lưu snapshot đồng thời.
- Release dossier enforcement có thể làm export chính thức bị watermark nhiều hơn nếu giáo viên/reviewer chưa truyền confirmation/signOffs.
- Chưa có UI giải thích đủ thân thiện cho giáo viên về các confirmation/sign-off fields.
- Community resource public có thể bị chặn toàn bộ nếu dữ liệu cũ chưa có release dossier summary; đây là an toàn hơn nhưng cần backfill/admin workflow sau.
- Chưa có upload security đầy đủ cho học liệu/ảnh/file.
- Dữ liệu 1–12 vẫn seed/starter/scaffold ở nhiều phần, không phải verified corpus.

## Lệnh nên chạy

```bash
npm run release:enforcement-validate
npm run smoke:batch57
npm run verify:batch57
npm run release:dossier-validate
npm run smoke:batch56
npm run verify:batch56
npm run runtime:readiness-validate
npm run lint
npm run typecheck
npm run build
npm run data:validate
npx prisma generate
npx prisma db push
```

Nếu thiếu dependency, phải ghi rõ thiếu `node_modules`, `node_modules/.bin/next`, `node_modules/.bin/tsx`, `node_modules/.bin/prisma`, và không được nhận là build/runtime đã pass.
