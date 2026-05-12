# Batch108 — Teacher Topic Picker & Data Label Safety Upgrade

## Mục tiêu

Batch108 sửa lỗi người dùng phát hiện ở Batch107: demo offline vẫn bắt giáo viên tự gõ chủ đề, cho phép tổ hợp sai như `Tiếng Việt + Phân số`, và để người dùng tự chọn nhãn `verified`.

## Thay đổi chính

- Thêm catalog chọn lớp/môn/chủ đề: `data/teacher-pilot-topic-picker-catalog.json`.
- Lớp 5 có chủ đề theo môn:
  - `Tiếng Việt`: đọc hiểu, luyện từ và câu, viết đoạn/bài, nói-nghe.
  - `Toán`: phân số, so sánh phân số, phép tính với phân số, đo lường/vấn đề gần gũi.
- `Phân số` chỉ hiện khi chọn môn `Toán`, không hiện khi chọn `Tiếng Việt`.
- UI không còn select `sourceStatus`; nhãn dữ liệu là tự động.
- Chủ đề tự nhập chỉ là `custom_teacher_input`, không phải verified.
- Vẫn chỉ dựng khung giáo án an toàn, không sinh kiến thức sâu, không tạo đáp án, không dùng AI.

## Không làm trong batch này

- Không thêm AI/API/model call.
- Không tạo verified giả.
- Không mở `contentDepthAllowed`.
- Không thêm payment/marketplace/quỹ/referral nhiều tầng.
- Không claim hosted/runtime pass.
- Không sửa sâu verified academic data.

## Verify cần chạy

```bash
npm run batch108:teacher-topic-picker-validate
npm run teacher-pilot:topic-picker-report
npm run source:validate
npm run smoke:batch108
npm run data:validate
npm run imports:validate
npm run typecheck
npm run artifact:hygiene
```

Runtime/hosted vẫn cần chạy lại khi có môi trường install/build thật:

```bash
npm run registry:diagnose
npm run install:clean
npm run next:swc-ready
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke
```
