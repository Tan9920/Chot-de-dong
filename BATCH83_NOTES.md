# BATCH83 — Actual Build/Production Smoke Readiness Harness

## Mục tiêu

Batch83 không thêm tính năng bề nổi. Mục tiêu là nâng chất lượng kiểm chứng thật sau Batch82:

- Chẩn đoán npm/public registry rõ hơn trước khi install.
- Kiểm route contract cho các route quan trọng: CSRF, template-builder, Lesson Design Studio, DOCX/PDF export.
- Kiểm artifact hygiene để tránh đóng gói `node_modules`, `.next`, `.env`, registry credential hoặc API key.
- Nâng `live-http-smoke` để ưu tiên production smoke bằng `next start` khi có `.next/BUILD_ID`, fallback dev smoke nếu chưa build.
- Thêm runtime preflight tổng hợp blocker/warning thay vì để người dùng tự đoán lỗi.

## Thay đổi chính

Tạo mới:

- `scripts/check-registry-network.mjs`
- `scripts/assert-artifact-hygiene.mjs`
- `scripts/validate-batch83-route-contract-source.mjs`
- `scripts/batch83-runtime-preflight.mjs`
- `scripts/validate-batch83-deploy-runtime-contract-source.mjs`
- `docs/BATCH83_RUNTIME_CI_CHECKLIST.md`
- `BATCH83_NOTES.md`

Sửa:

- `scripts/live-http-smoke.mjs`
- `scripts/run-source-validators.mjs`
- `package.json`
- `package-lock.json`
- `README.md`

## Điều rất quan trọng

Batch83 vẫn là source-level/runtime-harness upgrade trong môi trường không install được dependency. Nó không tự biến repo thành production-ready nếu `npm run install:clean`, `npm run build:clean` và `GIAOAN_SMOKE_MODE=production npm run live:smoke:clean` chưa pass thật.

## AI

Batch83 không thêm AI, không thêm OpenAI/Gemini/Anthropic SDK, không thêm model call, không thêm prompt-agent.

## Lệnh chính

```bash
npm run registry:diagnose
npm run artifact:hygiene
npm run route:contract-validate
npm run runtime:preflight
npm run deploy:runtime-contract-validate
npm run smoke:batch83
npm run verify:batch83
```

## Ghi chú về live smoke thật

Sau khi build thành công, nên chạy:

```bash
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
```

Nếu thiếu `.next/BUILD_ID`, production smoke sẽ fail có chủ ý để tránh fake runtime proof.
