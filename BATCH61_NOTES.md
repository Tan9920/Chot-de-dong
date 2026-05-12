# Batch61 — Release Sign-off Review Board & Reviewer Worklist

Ngày: 28/04/2026

## Mục tiêu

Batch61 nối các hardening Batch58–60 thành một tính năng vận hành rõ ràng cho reviewer/admin: bảng review sign-off release dossier có worklist, summary, filter, stale/superseded visibility và gợi ý role cần ký tiếp theo.

Batch này không thay đổi nguyên tắc cốt lõi:

- Không thêm AI/API AI/model/prompt-agent.
- Không thêm thanh toán thật/marketplace tiền mặt/quỹ tiền mặt/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không để client/payload tự gửi sign-offs để vượt gate.
- Không coi board là bảo đảm pháp lý hoặc chuyên môn tuyệt đối.

## Thay đổi chính

### 1. Release sign-off board library

Tạo mới `lib/release-signoff-board.ts`.

Có thật:

- `buildReleaseSignOffBoard()` đọc trusted workflow records từ `data/release-signoff-workflows.json` qua `readReleaseSignOffWorkflows()`.
- Chuẩn hóa filter theo `audience`, `subjectType`, `status`, `includeSuperseded`, `limit`.
- Sinh `ReleaseSignOffBoardSummary` gồm open/changesRequested/rejected/approved/superseded, needsMyAction, withStaleWorkflows, missing role counts.
- Sinh `ReleaseSignOffBoardItem` gồm target/scope/content hash/status/priority/missing roles/stale workflow ids/eligible action hints.
- Có policy rõ: board chỉ là operational worklist, POST `/api/release-dossier/signoffs` vẫn là source of truth.

### 2. Admin API cho sign-off board

Tạo mới `app/api/admin/release-signoffs/route.ts`.

Có thật:

- `GET /api/admin/release-signoffs`
- `requirePermission('content:review')`
- `assertRuntimeRateLimit()`
- hỗ trợ query filter: `audience`, `subjectType`, `status`, `includeSuperseded`, `limit`
- route read-only, không có POST/PATCH/DELETE
- response nhấn mạnh mọi decision vẫn phải ghi qua server-side signoff route có CSRF/session/rate-limit/ownership/role checks.

### 3. Tích hợp vào release dossier admin route

Sửa `app/api/admin/release-dossiers/route.ts`.

Có thật:

- gọi `buildReleaseSignOffBoard({ limit: 50 }, auth.user)`
- response có `signOffBoard`
- `summary` thêm `signOffNeedsMyAction`, `signOffWithStaleWorkflows`
- policy thêm `signOffReviewBoardAvailable`, `signOffBoardDoesNotReplacePostRouteChecks`

### 4. Scripts kiểm tra Batch61

Tạo mới:

- `scripts/validate-release-signoff-board.mjs`
- `scripts/smoke-batch61-release-signoff-board-source.mjs`
- `scripts/verify-batch61-source.mjs`

Sửa `package.json` thêm:

- `release:signoff-board-validate`
- `smoke:batch61`
- `verify:batch61`

## Cái vẫn là foundation/scaffold

- Board là source-level/API foundation, chưa có UI React đầy đủ cho reviewer thao tác trực quan.
- Board không tự ghi quyết định; write vẫn đi qua `/api/release-dossier/signoffs`.
- Chưa có notification/email/Zalo/in-app.
- Chưa có DB-backed board query; vẫn đọc JSON fallback workflow.
- Chưa có transaction/lock giữa signoff + audit + dossier snapshot.
- Chưa có HTTP runtime smoke thật do toolchain chưa hoàn tất.

## Rủi ro còn lại

- Nếu workflow JSON fallback bị ghi concurrent, vẫn có race condition.
- `needsMyAction` là gợi ý theo role/permission, không thay thế ownership check cuối cùng ở POST.
- Board chưa cross-link sâu với UI workspace/content-admin bằng form ký trực tiếp.
- Chưa có diff viewer hiển thị nội dung thay đổi khi workflow bị stale/superseded.
- Chưa có database migration/runtime verify thật.

## Verify nên chạy

```bash
npm run release:signoff-board-validate
npm run smoke:batch61
npm run verify:batch61
npm run release:signoff-content-validate
npm run smoke:batch60
npm run verify:batch60
npm run release:signoff-scope-validate
npm run smoke:batch59
npm run verify:batch59
npm run runtime:toolchain-probe
npm run typecheck
npm run build
```

Không được claim production-ready nếu `npm install`, `typecheck`, `build`, Prisma và HTTP smoke chưa pass thật.

## Bổ sung runtime probe trong Batch61

Sửa `scripts/verify-runtime-toolchain.mjs` để probe không spawn `npm -v` từ Node nữa vì trong sandbox audit việc gọi npm qua child process có thể treo dù `npm --version` chạy trực tiếp ở shell. Script hiện đọc `packageManager` từ `package.json`, kiểm tra `node`, `package-lock`, `node_modules`, local `next/tsx/prisma/tsc` bin và kiểm tra sự hiện diện của các file source quan trọng gồm `lib/release-signoff-board.ts` + route admin mới. Script không dùng child process nên không còn bị treo trong sandbox audit.
