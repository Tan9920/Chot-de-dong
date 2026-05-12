# Batch52 — Dependency, Build, Prisma & Runtime Smoke Recovery

Ngày: 27/04/2026

## Mục tiêu

Batch52 không thêm AI, không thêm billing thật và không tạo dữ liệu verified giả. Mục tiêu là tăng khả năng kiểm chứng repo sau Batch51, vì post-batch audit cho thấy source-level validators pass nhưng dependency/build/Prisma/Next runtime chưa được chứng minh trong môi trường đầy đủ.

## Thay đổi chính

### 1. Dependency/build readiness foundation

- Thêm `packageManager: npm@10.9.2` để ghi rõ package manager dùng cho audit.
- Đổi `npm run lint` từ `next lint` sang `node scripts/source-lint.mjs` để có một lint/source audit chạy được không cần Next CLI local.
- Giữ `npm run lint:next-legacy` cho môi trường đã cài Next nếu vẫn muốn chạy lệnh legacy.
- Thêm `npm run runtime:readiness-validate` để kiểm tra source-level readiness và trạng thái local toolchain (`node_modules`, `next`, `tsx`, `prisma`, `@prisma/client`).

Ghi chú: script readiness không được dùng để tự nhận build/runtime pass. Nó chỉ phân biệt rõ `sourceOk` và `runtimeReady`.

### 2. Prisma schema prep cho community/legal

Thêm model chuẩn bị DB-backed runtime:

- `CommunityResourceRecord`
- `LegalAssetRecord`

Runtime hiện vẫn fallback JSON nếu chưa generate/migrate Prisma hoặc chưa bật `DATABASE_URL`.

### 3. Community/legal takedown propagation

Batch51 đã chặn public khi legal asset linked không đạt readiness, nhưng chưa tự chuyển các resource liên quan khỏi public khi asset bị takedown. Batch52 thêm:

- `holdCommunityResourcesForLegalAsset()` trong `lib/community-moderation.ts`
- `PATCH /api/admin/legal-assets` gọi hàm trên khi `action=takedown`
- audit metadata có `linkedResourcesHeld`
- response trả thêm `linkedHold`

Việc này vẫn là JSON fallback foundation, chưa phải workflow pháp lý production-grade.

### 4. Dependency-light smoke/source verification

Thêm script:

- `scripts/source-lint.mjs`
- `scripts/validate-runtime-readiness.mjs`
- `scripts/smoke-batch52-community-legal-source.mjs`
- `scripts/verify-batch52-source.mjs`

Các script này giúp kiểm tra source/policy khi `npm install` hoặc Next runtime chưa chạy được. Chúng không thay thế `npm run build`, `npx prisma generate`, `npx prisma db push` hoặc HTTP smoke thật.

## Lệnh kiểm tra mới

```bash
node scripts/source-lint.mjs
node scripts/validate-runtime-readiness.mjs
node scripts/smoke-batch52-community-legal-source.mjs
node scripts/verify-batch52-source.mjs
```

Nếu `npm run` hoạt động trong máy local/CI:

```bash
npm run lint
npm run runtime:readiness-validate
npm run smoke:batch52
npm run verify:batch52
```

Sau khi dependency cài được, vẫn phải chạy lại:

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm run data:validate
npx prisma generate
npx prisma db push
```

## Giới hạn còn lại

- Chưa chứng minh `npm install` pass trong môi trường audit này.
- Chưa chứng minh `npm run build`/Next server thật pass.
- Chưa chứng minh Prisma generate/db push pass.
- Chưa có HTTP smoke thật qua Next server.
- Chưa có UI moderation/legal đầy đủ.
- Chưa có upload security: antivirus/MIME sniffing/hash/duplicate scan.
- Dữ liệu 1-12 vẫn seed/starter/scaffold, không phải verified corpus.

## Không được hiểu nhầm

Batch52 không biến repo thành production-ready. Đây là batch khôi phục khả năng kiểm chứng và đóng thêm một lỗ hở trong legal takedown propagation ở tầng source/JSON fallback.
