# Batch127 — P0 Final Runtime Closure Hardening

## Mục tiêu
Đẩy P0 local/runtime/build closure chắc hơn trước khi chuyển P1. Batch này không mở feature mới; chỉ thêm final gate để tách rõ:

1. P0 local closure.
2. Node 24 runtime proof.
3. Hosted/public rollout proof.

## Thay đổi chính

- Bump repo lên `0.127.0`.
- Thêm `vercel.json` để cố định Vercel build/install command:
  - `npm ci --ignore-scripts --no-audit --no-fund`
  - `npm run build`
- Thêm `data/runtime-p0-final-closure-policy.json`.
- Thêm `scripts/verify-p0-final.mjs`.
- Thêm `scripts/runtime-p0-final-closure-report.mjs`.
- Thêm `scripts/validate-batch127-p0-final-closure-source.mjs`.
- Cập nhật `verify:release` để chạy `verify:p0-final` trước hosted URL smoke.
- Thêm script CI Node 24 bắt buộc: `verify:p0-node24-ci`.

## Gate mới

- `npm run smoke:batch127`: source/data/policy gate.
- `npm run verify:p0-final`: source/data/type/SWC/strict raw build/live smoke/auth smoke/final report.
- `GIAOAN_REQUIRE_NODE24=1 npm run verify:p0-final`: dùng trong CI/Vercel Node 24 để chứng minh runtime Node 24 thật.
- `APP_URL=https://... npm run verify:release`: chỉ khi có URL Vercel thật; nếu không có URL thì public rollout vẫn bị chặn.

## Không thay đổi

- Không thêm AI/API/model call.
- Không thêm payment/marketplace/quỹ/referral tiền mặt.
- Không tạo verified học thuật giả.
- Không auto-public community.

## Trạng thái cần nhớ

Batch này làm P0 chắc hơn ở source/runtime gate. Vẫn không được nói production-ready nếu chưa có hosted URL smoke và Node 24 proof thật.
