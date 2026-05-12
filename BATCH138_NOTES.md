# BATCH138 NOTES — P0 Hosted Proof Execution Gate

## Mục tiêu

Tiếp tục ổn định P0/P1, không thêm tính năng giáo viên mới. Batch138 thêm một gate đọc bằng chứng hosted/public thật để tránh lẫn giữa source-level report và hosted proof đã đóng.

## Thay đổi chính

- Version repo lên `0.138.0`.
- Thêm policy `data/p0-hosted-proof-execution-gate-policy.json`.
- Thêm runtime board `/api/runtime/p0-hosted-proof-execution-gate`.
- Thêm admin board `/api/admin/p0-hosted-proof-execution-gate-board` yêu cầu `security:read`.
- Thêm report `npm run p0:hosted-proof-execution-report`.
- Thêm validator `npm run batch138:p0-hosted-proof-execution-validate`.
- Thêm Batch138 vào `source:validate`.
- Cập nhật workflow P0 hosted final proof để tạo Batch138 hosted proof execution gate report.

## Claim policy

Batch138 không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public community. Batch này không làm production-ready. Nếu thiếu Node24, APP_URL, visual smoke hoặc public rollout readiness thì `hostedProofClosed=false` là trạng thái đúng.

## Lệnh đề xuất

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run batch138:p0-hosted-proof-execution-validate
npm run p0:hosted-proof-execution-report
npm run smoke:batch138
npm run verify:batch138
```

## Lệnh hosted thật

```bash
npm run verify:p0-deepest-node24-ci
APP_URL=https://<url-vercel-that> npm run verify:release:strict
GIAOAN_DEMO_URL=https://<url-vercel-that> npm run hosted:url-smoke
npm run visual:smoke:evidence-validate
npm run p0:hosted-evidence-capture-report
npm run p0:hosted-proof-execution-report
npm run public-rollout:readiness-report
```
