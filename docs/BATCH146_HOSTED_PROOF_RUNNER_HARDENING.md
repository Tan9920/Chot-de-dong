# Batch146 — Hosted Proof Runner Hardening & Evidence Summary

## Vì sao chọn batch này

Batch144 đã khóa local/source P0/P1 ở mức closed source candidate. Batch145 đã sửa workflow để upload JSON, Markdown và screenshot PNG. Blocker còn lại vẫn là hosted/public proof: phải chạy thật trên GitHub Actions Node24 với `APP_URL`/`GIAOAN_DEMO_URL`, có screenshot visual smoke thật, có hosted save/export smoke và có artifact rõ để audit.

Batch146 không thêm module mới cho giáo viên. Batch146 chỉ làm chặt đường đóng hosted proof để lần chạy thật tiếp theo có bằng chứng rõ hơn, không còn đoán từ log rời rạc.

## Thay đổi chính

- Thêm strict preflight: `npm run p0:hosted-proof-preflight`.
- Thêm dry-run preflight cho local/source: `npm run p0:hosted-proof-preflight:dry`.
- Thêm post-run summary: `npm run p0:hosted-proof-summary`.
- Workflow `.github/workflows/p0-hosted-final-proof.yml` chạy preflight trước visual capture và viết summary trước khi upload artifact.
- Runner `scripts/p0-hosted-ci-final-proof-runner.mjs` gọi preflight ở đầu để fail-fast khi thiếu Node24/GitHub Actions/APP_URL.
- Thêm validator Batch146 và đưa vào `source:validate`.

## Claim policy

Được claim:

- Batch146 nâng mức auditability của final hosted proof runner ở source-level.
- Workflow đã có preflight + summary + artifact inventory để lần chạy Node24 hosted URL sau dễ audit hơn.

Không được claim:

- Hosted proof closed nếu chưa có workflow run thật với Node24, APP_URL, screenshots và reports pass.
- Public rollout allowed nếu public rollout readiness còn false.
- Production-ready nếu chưa có production DB/security/legal review.
- Visual smoke pass nếu thiếu screenshot PNG thật.

## Lệnh cần chạy thật trên GitHub Actions/Vercel

```bash
npm run p0:hosted-proof-preflight
npm run visual:smoke:evidence-capture
npm run runtime:p0-hosted-ci-proof-runner
npm run verify:p0-hosted-ci-proof
npm run p0:hosted-evidence-capture-report
npm run p0:hosted-proof-execution-report
npm run p0:hosted-proof-summary
```

Sau đó tải artifact `p0-hosted-final-proof-artifacts` và kiểm:

- `artifacts/*.json`
- `artifacts/*.md`
- `artifacts/visual-smoke/**/*.png`

## Giới hạn thật

Batch146 không deploy Vercel trong local tool, không tự tạo APP_URL, không thay thế review production DB/security/legal. Production-ready vẫn là false.
