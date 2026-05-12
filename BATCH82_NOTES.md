# Batch82 — Real Build/Runtime Closure Harness + Lesson Design Studio Live Smoke Coverage

## Mục tiêu
Batch82 không mở thêm tính năng sản phẩm lớn. Batch này tập trung đóng phần còn thiếu sau Batch81: build/runtime proof phải thật, không fake runtime proof bằng validator source-level.

## Vì sao chọn batch này
Post-batch Batch81 đã ghi rõ blocker chính là dependency/Next binary chưa cài đủ, build chưa pass và live smoke chưa chạy được. Nếu tiếp tục thêm cộng đồng/game/export/visual kit trước khi build/runtime đóng, rủi ro là repo ngày càng nhiều tính năng source-level nhưng không chứng minh được chạy thật.

## Thay đổi chính
- Nâng `scripts/live-http-smoke.mjs` từ GET smoke hẹp thành smoke đúng trọng tâm Batch82:
  - GET `/api/health`, `/api/metadata`, `/api/demo/readiness`, `/api/demo/basic-flow`, `/api/product/foundation`, `/api/operating/foundation`, `/api/operating/usage`, `/api/lesson-design/studio`, `/api/subject-data/review-board`, `/api/lesson-drafting/profiles`.
  - GET `/api/auth/csrf` để nhận CSRF token và session demo.
  - CSRF-protected POST `/api/template-builder`.
  - CSRF-protected POST `/api/lesson-design/studio`.
  - CSRF-protected POST `/api/export/docx` và `/api/export/pdf`, có kiểm content-type/bytes tối thiểu.
- Thêm `scripts/validate-batch82-runtime-closure-source.mjs` để kiểm source wiring cho runtime closure harness.
- Cập nhật `package.json` version/script Batch82.
- Đưa Batch82 validator vào `scripts/run-source-validators.mjs`.
- Cập nhật README để routes/lệnh kiểm tra đúng với Batch81/82 hơn.

## Giới hạn trung thực
- Batch82 cải thiện harness kiểm runtime, nhưng không tự làm build pass nếu môi trường không cài được dependency.
- Nếu `npm run install:clean` fail/timeout do DNS/registry hoặc thiếu internet, `npm run build:clean` vẫn fail vì không có `node_modules/.bin/next`.
- `npm run live:smoke:clean` cố ý dừng với `dependencies_missing` nếu chưa có Next binary; đây là hành vi đúng, không production-ready.
- Không thêm AI/model/API.
- Không thêm thanh toán thật, marketplace, quỹ tiền mặt, referral nhiều tầng.
- Browser/mobile QA vẫn phải chạy riêng sau khi build/live smoke pass.
