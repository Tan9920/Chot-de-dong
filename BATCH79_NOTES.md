# BATCH79 — npm auth/install closure + build/live smoke command hygiene

Mục tiêu: tiếp tục đúng hướng Batch78, không thêm tính năng mới. Batch79 tập trung đóng phần npm auth/install closure ở mức source/tooling: lockfile không còn trỏ registry nội bộ, có script chẩn đoán npm auth/registry, có install/build/live-smoke command chạy với npm env sạch để tránh lỗi `E401` hoặc lỗi Next không đọc được registry khi cần SWC.

## Làm thật
- Nâng version repo lên `0.79.0`.
- package-lock public registry: chuẩn hóa `package-lock.json` sang public npm registry (`https://registry.npmjs.org/`).
- Thêm script chẩn đoán npm env, normalize lockfile, clean npm install, clean build command, check Next/SWC readiness và validate source Batch79.
- Sửa `scripts/live-http-smoke.mjs` để chạy dev server bằng npm registry env sạch và vẫn fail rõ `dependencies_missing` khi chưa cài dependency.
- Thêm package scripts: `npm:diagnose`, `lockfile:public-registry`, `install:clean`, `next:swc-ready`, `build:clean`, `live:smoke`, `live:smoke:clean`, `build:closure-validate`, `smoke:batch79`, `verify:batch79`.

## Cách chạy khuyến nghị
```bash
npm run npm:diagnose
npm run lockfile:public-registry
npm run install:clean
npm run next:swc-ready
npm run source:validate
npm run typecheck
npm run build:clean
npm run live:smoke:clean
```

## Chưa được claim
- Không production-ready.
- Không claim build pass nếu môi trường không cho `npm ci`/Next build chạy đủ thời gian.
- Không claim live HTTP smoke pass nếu chưa chạy server thật.
- Không thay thế test bảo mật runtime/session/CSRF/rate-limit bằng source validator.
- Không thêm AI, không thêm payment thật, không marketplace tiền mặt, không quỹ tiền mặt, không referral nhiều tầng, không tạo dữ liệu verified giả.
