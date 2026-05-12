# Batch97 — Version Consistency Fix + Real Runtime Auth/Invite Smoke Wiring

## Mục tiêu

Batch97 sửa lỗi consistency từ Batch96 và chỉnh lại smoke để không test sai sau khi save/export đã bị server route khóa bằng real account session.

## Thay đổi chính

- Đồng bộ version repo từ Batch96 lên `0.97.0` trong package/lock ở bước trung gian.
- Thêm `scripts/validate-batch97-version-runtime-smoke-source.mjs`.
- Thêm `scripts/auth-invite-runtime-smoke.mjs` để chuẩn bị runtime proof cho invite/membership.
- Sửa `scripts/live-http-smoke.mjs` và `scripts/hosted-demo-url-smoke.mjs` theo hướng đăng ký tài khoản giáo viên thật trước khi lưu/xuất.
- Thêm shim `useRef` trong `types/source-compat.d.ts` để source typecheck không fail ở workspace import React.

## Không claim

Batch97 không tự chứng minh npm install, Next build, production runtime hoặc hosted URL smoke pass. Các phần đó phải chạy bằng lệnh runtime thật.
