# Batch60 — Release Sign-off Content Fingerprint & Stale Workflow Supersede

## Mục tiêu
Batch60 tiếp tục sau Batch59, tập trung vào lỗ hổng còn lại của release sign-off: chữ ký đã duyệt không được gây hiểu nhầm khi nội dung lesson/resource thay đổi. Batch này không thêm AI, không thêm billing thật, không tạo dữ liệu verified giả.

## Thay đổi chính

### 1. Server-derived content fingerprint
- `lib/release-signoff-workflow.ts` nay tự tính fingerprint bằng SHA-256 rút gọn từ dữ liệu server-side.
- Với `lesson_plan` có `targetId`, hash lấy từ `data/saved-lessons.json` thay vì tin `contentHash` client gửi.
- Với `community_resource` có `targetId`, hash lấy từ `data/community-resources.json` thay vì tin `contentHash` client gửi.
- Summary trả thêm:
  - `contentHash`
  - `contentHashSource`
  - `staleWorkflowIds`
  - `staleWorkflowCount`
- Policy trả thêm:
  - `serverDerivedContentHashWhenPossible: true`
  - `clientContentHashIgnoredWhenTargetResolvable: true`
  - `contentHashChangeRequiresFreshSignOff: true`

### 2. Content-versioned target key
- Tách `buildReleaseSignOffBaseTargetKey()` và `buildReleaseSignOffTargetKey()`.
- `targetKey` có thêm `|content:<hash>` khi có server-derived hash.
- Cùng lesson/resource nhưng đổi nội dung sẽ ra targetKey mới, không reuse chữ ký cũ.

### 3. Stale workflow supersede
- Khi ký decision mới cho target có content hash mới, workflow cũ cùng base target nhưng khác content hash sẽ bị đánh dấu `superseded`.
- Workflow cũ có thêm:
  - `supersededByTargetKey`
  - `supersededReason = content_hash_changed_requires_fresh_release_signoff`
  - `supersededAt`
- API POST trả `supersededWorkflowIds` để audit.

### 4. API/release readiness/export integration
- GET `/api/release-dossier/signoffs` dùng `summary.targetKey` đã resolve trusted target, không dùng raw targetKey từ client.
- POST audit metadata ghi `contentHash`, `contentHashSource`, `supersededWorkflowIds`.
- `/api/release-dossier/readiness` audit metadata ghi trusted targetKey, content hash source và stale workflow count.
- `lib/release-dossier-enforcement.ts` summary expose `contentHash`, `contentHashSource`, `staleSignOffWorkflowCount`.
- `LessonExportPayload`/`normalizeExportPayload()` giữ `id`, `lessonPlanId`, `releaseDossierTargetId` để export có thể gắn đúng saved lesson target khi payload có id.

### 5. Prisma prep
- `ReleaseSignOffWorkflowRecord` bổ sung:
  - `contentHashSource`
  - `supersededByTargetKey`
  - `supersededReason`
  - `supersededAt`
- Chưa claim DB migration/generate pass nếu chưa chạy Prisma thật.

## File tạo mới
- `BATCH60_NOTES.md`
- `scripts/validate-release-signoff-content-fingerprint.mjs`
- `scripts/smoke-batch60-release-signoff-content-source.mjs`
- `scripts/verify-batch60-source.mjs`
- `scripts/verify-runtime-toolchain.mjs`

## File sửa
- `lib/release-signoff-workflow.ts`
- `app/api/release-dossier/signoffs/route.ts`
- `app/api/release-dossier/readiness/route.ts`
- `lib/release-dossier-enforcement.ts`
- `lib/exporter.ts`
- `lib/types.ts`
- `prisma/schema.prisma`
- `package.json`

## Rủi ro còn lại
- Chưa có DB-backed workflow thật; JSON fallback vẫn không có transaction/lock/immutable audit.
- Stale workflow supersede chạy khi có decision mới; collect/readiness chỉ báo stale, không tự ghi file để tránh side effect khi đọc.
- Export chỉ derive server hash cho saved lesson nếu payload có `id`, `lessonPlanId` hoặc `releaseDossierTargetId`; unsaved/generated lesson vẫn không có owner/content fingerprint server-side đầy đủ.
- Typecheck/build/Prisma/runtime HTTP vẫn phụ thuộc dependency toolchain; chưa được claim production-ready.

## Lệnh kiểm tra mới
```bash
npm run release:signoff-content-validate
npm run smoke:batch60
npm run verify:batch60
npm run runtime:toolchain-probe
```
