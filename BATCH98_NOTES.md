# Batch98 — Dependency/Build Closure + Real Auth Runtime Smoke Hardening

## Mục tiêu

Batch98 không thêm AI, không thêm payment, không mở community public, không thêm dữ liệu học thuật verified giả. Batch này tập trung vào phần đang cản demo thật: dependency/build/runtime smoke và tính trung thực của các smoke sau auth gate.

## Thay đổi chính

- Nâng repo lên `0.98.0` trong `package.json` và `package-lock.json`.
- Sửa README sang Batch98, ghi rõ chính sách không claim build/deploy pass nếu chưa chạy đủ dependency/build/runtime smoke.
- `scripts/live-http-smoke.mjs` bây giờ:
  - từ chối chạy nếu thiếu Next dependency;
  - dùng temp `GIAOAN_DATA_DIR`;
  - lấy CSRF;
  - gọi template builder/studio;
  - đăng ký tài khoản giáo viên thật;
  - kiểm `/api/auth/me`;
  - lưu qua `/api/lessons`;
  - xuất DOCX/PDF bằng `lessonId`.
- `scripts/hosted-demo-url-smoke.mjs` bây giờ cũng dùng register/session thật trước khi save/export trên host.
- `scripts/auth-invite-runtime-smoke.mjs` kiểm HTTP runtime cho admin invite, redeem một lần, reuse/revoked/expired bị chặn và login không tự nâng role.
- `scripts/runtime-closure-report.mjs` tạo báo cáo `artifacts/runtime-closure-report-last-run.json` để phân loại rõ dependency missing/build missing/source pass/runtime not proved.
- `scripts/validate-batch98-dependency-runtime-closure-source.mjs` kiểm source-level cho Batch98.
- `scripts/run-source-validators.mjs` đăng ký Batch97/98 validators và markers.

## Verify đã hướng tới

Batch98 giúp lệnh verify rõ hơn, nhưng không tự biến source pass thành runtime pass. Muốn claim deploy thật phải chạy tiếp:

```bash
npm run registry:diagnose
npm run install:clean
npm run next:swc-ready
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke
```

## Không claim

- Không claim install pass nếu `npm ci` timeout/fail.
- Không claim build pass nếu `.next/BUILD_ID` chưa có.
- Không claim hosted demo pass nếu chưa chạy strict `hosted:url-smoke` với URL thật.
- Không claim dữ liệu học thuật verified; starter/scaffold vẫn chỉ là khung an toàn.

BATCH98 Dependency/Build Closure marker for source validator.
