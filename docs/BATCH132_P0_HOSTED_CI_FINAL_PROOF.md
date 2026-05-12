# Batch132 — P0 Hosted CI Final Proof Runner

## Mục tiêu

Batch132 không thêm tính năng giáo viên mới. Mục tiêu là tạo runner lặp lại được để chạy proof thật trên Node24/GitHub Actions/Vercel:

- Node24 deepest runtime proof.
- APP_URL hosted strict smoke.
- Hosted real account save/export smoke.
- Visual smoke evidence mobile/tablet/desktop.
- Final `verify:p0-100-release` chain.

## Điều chưa được claim

Batch132 là source-level CI proof runner. Nó **không đóng hosted proof thật** nếu chưa có artifact thật từ Node24, APP_URL và visual smoke. Vì vậy vẫn **không production-ready**, không public rollout, không 100%.

## Cách chạy local để xem trạng thái

```bash
npm run runtime:p0-hosted-ci-proof-validate
npm run runtime:p0-hosted-ci-proof-report
npm run runtime:p0-hosted-ci-proof-runner
```

Local Node22 có thể pass source/build nhưng Node24 proof sẽ bị ghi là blocked/skip. Đây là đúng kỳ vọng.

## Cách chạy proof thật

Trên GitHub Actions, mở workflow `P0 Hosted Final Proof` và truyền URL Vercel thật qua input `app_url` hoặc secret `GIAOAN_DEMO_URL`.

Secrets nên có:

- `GIAOAN_DEMO_URL`: URL Vercel thật.
- `VERCEL_AUTOMATION_BYPASS_SECRET`: nếu Vercel Deployment Protection bật.

Lệnh strict tương đương:

```bash
APP_URL=https://<vercel-url-that> npm run verify:release:strict
GIAOAN_DEMO_URL=https://<vercel-url-that> npm run hosted:url-smoke
npm run visual:smoke:evidence-validate
APP_URL=https://<vercel-url-that> npm run verify:p0-100-release
npm run verify:p0-hosted-ci-proof
```

## Guardrail

Không thêm AI, không payment, không marketplace, không quỹ tiền mặt, không tạo verified giả, không auto-public community. Public rollout vẫn bị chặn cho đến khi toàn bộ evidence thật pass.
