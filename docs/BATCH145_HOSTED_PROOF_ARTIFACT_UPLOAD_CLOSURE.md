# Batch145 — Hosted Proof Artifact Upload Closure

## Mục tiêu

Batch144 đã đưa Local/source P0/P1 lên mức closed source candidate. Blocker thật tiếp theo không phải thêm tính năng giáo viên mới, mà là đóng gói bằng chứng hosted/public cho đúng: GitHub Actions Node24 + APP_URL + hosted save/export + visual smoke screenshot thật + public rollout readiness.

## Thay đổi chính

- Workflow `.github/workflows/p0-hosted-final-proof.yml` vẫn chạy Node24, capture visual smoke bằng Chromium, chạy hosted CI final proof runner, strict final proof gate, capture report và hosted proof execution gate.
- Nâng artifact upload của workflow từ chỉ JSON sang JSON + Markdown checklist + screenshot PNG thật trong `artifacts/visual-smoke/**/*.png`.
- Thêm policy/validator Batch145 để chặn hồi quy: nếu workflow không upload screenshot thật thì không được coi visual smoke audit-ready.

## Phạm vi không đổi

- Không thêm AI.
- Không thêm payment.
- Không tạo verified giả.
- Không mở community auto-public.
- Không gọi hosted proof/public rollout/production-ready khi chưa có GitHub Actions run thật với URL hosted và artifacts pass.

## Claim được phép

Có thể nói: `Batch145 làm hosted proof artifact upload audit-ready ở mức source-level`.

Không được nói: `hosted proof closed`, `public rollout allowed`, `production-ready`, `100%`, hoặc `visual smoke pass` nếu chưa có screenshot PNG thật trong artifact workflow.

## Lệnh kiểm tra

```bash
npm run batch145:hosted-proof-artifact-upload-validate
npm run smoke:batch145
npm run verify:batch145
```

## Lệnh hosted thật cần chạy sau khi có Vercel URL

```bash
APP_URL=https://<vercel-url> npm run visual:smoke:evidence-capture
npm run visual:smoke:evidence-validate
APP_URL=https://<vercel-url> GIAOAN_DEMO_URL=https://<vercel-url> npm run verify:p0-hosted-ci-proof
npm run runtime:p0-hosted-ci-proof-report
npm run p0:hosted-proof-execution-report
npm run public-rollout:readiness-report
```
