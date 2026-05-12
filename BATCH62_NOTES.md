# Batch62 — Runtime Verification Closure & Sign-off JSON Store Hardening

## Mục tiêu

Batch62 xử lý trực tiếp các lý do còn khiến repo chưa thể được gọi là hoàn thiện sau Batch61:

- JSON fallback sign-off chưa có lock/atomic write.
- Chưa có một runtime closure report tách rõ source-level pass với dependency/build/Prisma/runtime blocker.
- Chưa có source-level HTTP route contract smoke cho sign-off/readiness/board routes.
- Chưa có verification suite chạy gom các check source-level và thử các lệnh runtime thật với timeout, không treo vô hạn.
- NPM/toolchain vẫn phải được cài thật trước khi claim typecheck/build/Prisma/HTTP runtime pass; Batch62 không tạo package-lock hoặc node_modules giả.

## Thay đổi chính

### 1. Release sign-off JSON store hardening

File: `lib/release-signoff-workflow.ts`

- Thêm lock directory `data/release-signoff-workflows.json.lock` cho write path.
- Thêm timeout lock `release_signoff_workflow_store_locked_timeout`.
- Chuyển ghi JSON sang temp file + `fs.rename()` để giảm nguy cơ file nửa chừng.
- `recordReleaseSignOffDecision()` chạy phần read/mutate/write trong `withReleaseSignOffWorkflowWriteLock()`.

Giới hạn: đây vẫn là JSON fallback cho dev/demo, không thay thế DB transaction production.

### 2. Runtime closure validation

Tạo:

- `scripts/validate-runtime-closure.mjs`
- `scripts/run-runtime-verification-suite.mjs`
- `scripts/smoke-http-route-contract-source.mjs`
- `scripts/validate-release-signoff-json-store.mjs`
- `scripts/smoke-batch62-runtime-closure-source.mjs`
- `scripts/verify-batch62-source.mjs`

Các script này giúp báo rõ:

- source-level đã đủ chưa;
- còn thiếu package-lock/node_modules/local next/tsx/prisma/tsc không;
- lệnh runtime thật nào pass/fail/timeout;
- không treo vô hạn khi gọi suite.

### 3. NPM runtime config

Tạo `.npmrc` để ép package-lock, tắt audit/fund/progress trong môi trường bootstrap.

Không tạo `package-lock.json` giả. Lockfile chỉ hợp lệ khi sinh từ `npm install` thật.

## Scripts mới

- `npm run release:signoff-json-store-validate`
- `npm run runtime:closure-validate`
- `npm run runtime:http-smoke-source`
- `npm run runtime:verification-suite`
- `npm run smoke:batch62`
- `npm run verify:batch62`

## Không thay đổi

- Không thêm AI.
- Không thêm API AI.
- Không thêm billing/marketplace/quỹ tiền mặt.
- Không tạo dữ liệu verified giả.
- Không copy SGK/tài liệu bản quyền.

## Trạng thái thật

Batch62 làm repo khó “nói mơ hồ” hơn: blocker runtime giờ được report bằng script rõ ràng, write path JSON fallback an toàn hơn, và source-level HTTP contract có smoke check.

Nhưng repo vẫn chưa production-ready nếu chưa chạy pass thật:

- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm run prisma:generate`
- `npm run db:push`
- HTTP smoke trên Next server thật với session/cookie/CSRF
