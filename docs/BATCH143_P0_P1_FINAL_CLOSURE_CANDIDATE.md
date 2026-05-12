# Batch143 — P0/P1 Final Closure Candidate

## Mục tiêu

Đẩy P0/P1 lên mức cao nhất có thể trong phạm vi repo mà không overclaim. Batch này không thêm AI, payment, marketplace, verified giả hoặc auto-public community.

## Blocker thật sau Batch142

Batch142 đã chặn local Node24 bị đọc nhầm thành GitHub Actions/Vercel proof. Tuy nhiên còn một blocker hợp đồng evidence: visual smoke template dùng viewport id dạng `mobile_360x740`, trong khi P0 hosted CI/public rollout/P0-P1 stability gate đọc dạng canonical `mobile-360`. Điều này khiến visual smoke có thể không bao giờ đóng thống nhất dù có capture thật.

## Thay đổi chính

1. Chuẩn hóa viewport id visual smoke sang dạng canonical:
   - `mobile-360`
   - `mobile-390`
   - `mobile-430`
   - `tablet-768`
   - `desktop-1366`
   - `desktop-1440`
2. Thêm script `visual:smoke:evidence-capture` dùng Chromium headless để chụp screenshot thật từ `APP_URL`/`GIAOAN_DEMO_URL`.
3. Visual validator giờ kiểm tra cả file screenshot tồn tại và đủ kích thước tối thiểu, không chỉ đọc JSON.
4. Workflow `.github/workflows/p0-hosted-final-proof.yml` chuyển từ tạo template sang capture thật.
5. Thêm final closure board/report:
   - `/api/runtime/p0-p1-final-closure`
   - `/api/admin/p0-p1-final-closure-board`
   - `npm run p0-p1:final-closure-report`

## Claim policy

Được nói:

- Local/source P0/P1 closure candidate đã có gate tập trung.
- P1 foundation source-ready nếu local evidence và stability report pass.
- Hosted/public proof vẫn bị chặn nếu chưa có Node24 GitHub Actions, APP_URL smoke, save/export smoke, visual screenshots và P0-100 release artifact thật.

Không được nói:

- Production-ready.
- 100%.
- Public rollout ready.
- Hosted demo closed.
- Visual smoke pass nếu chưa có screenshot thật.

## Lệnh chính

```bash
npm run batch143:p0-p1-final-closure-validate
npm run visual:smoke:evidence-capture
npm run visual:smoke:evidence-validate
npm run p0-p1:final-closure-report
npm run smoke:batch143
npm run verify:batch143
```

## Lệnh hosted thật cần chạy ngoài môi trường này

```bash
APP_URL=https://<vercel-url> npm run visual:smoke:evidence-capture
npm run visual:smoke:evidence-validate
APP_URL=https://<vercel-url> npm run verify:p0-100-release
npm run runtime:p0-hosted-ci-proof-report
npm run p0-p1:final-closure-report
```


## Build guard progress artifact hardening

Batch143 also makes `scripts/next-build-runtime-guard.mjs` write `running_build_guard_progress` artifacts during build progress. If the external environment kills a hanging Next build before the JS hard timeout writes a final artifact, downstream reports see a current non-pass artifact instead of reusing stale evidence.
