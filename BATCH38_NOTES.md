# Batch38 — Grade-Band Pedagogy & 1–12 Lesson Template Differentiation

## Mục tiêu

Batch38 xử lý điểm yếu sư phạm của các batch trước: giáo án không nên dùng một khung giống nhau cho mọi lớp. Lớp 1 cần trực quan, thao tác, câu lệnh ngắn và đánh giá bằng quan sát; lớp 5 cần tăng tự học, giải thích, phân vai nhóm và chuẩn bị chuyển tiếp THCS; THCS/THPT cần nhiệm vụ, minh chứng, rubric và vận dụng khác nhau.

Batch này không thêm AI, không thêm API AI, không thêm model, không thêm prompt generation và không tự nâng dữ liệu seed/demo thành verified.

## Thay đổi chính

- Thêm `lib/lesson-pedagogy.ts` với hồ sơ sư phạm theo băng lớp:
  - Lớp 1–2
  - Lớp 3–4
  - Lớp 5 chuyển tiếp THCS
  - Lớp 6–9
  - Lớp 10–12
- Generator giáo án dùng hồ sơ sư phạm để viết lại phần tiến trình dạy học theo độ tuổi.
- Thêm cảnh báo khi lựa chọn phương pháp/kĩ thuật không hợp độ tuổi.
- Mở rộng catalog phương pháp/kĩ thuật để khớp với seed builder và tránh fallback rỗng.
- Seed builder tạo `lessonFlow` có ngôn ngữ phân tầng theo lớp/khối thay vì câu chung cho mọi lớp.
- Thêm mẫu giáo án theo độ tuổi/lớp:
  - Mẫu lớp 1–2 trực quan - thao tác
  - Mẫu lớp 5 chuyển tiếp THCS
  - Mẫu THCS khám phá - luyện tập phân tầng
  - Mẫu THPT tự học - phản biện - vận dụng
- Thêm API `GET /api/pedagogy` để UI xem hồ sơ sư phạm theo lớp.
- Workspace hiển thị “Hồ sơ sư phạm theo lớp/khối” khi soạn giáo án.
- Thêm script `npm run lesson:pedagogy-validate`.

## Không làm trong batch này

- Không thêm verified content 1–12.
- Không thêm AI.
- Không thêm thanh toán thật.
- Không thêm marketplace/quỹ tiền mặt/referral nhiều tầng.
- Không tự coi các profile sư phạm là chuẩn chuyên gia đã duyệt; đây là rule-based foundation cần reviewer chuyên môn rà soát.

## Verify cần chạy

```bash
npm run lesson:pedagogy-validate
npm run lesson:pedagogy-validate -- --strict
npm run data:validate
npm run lesson:governance-validate
npm run operating:runtime-validate
npm run typecheck
npm run lint
npm run build
```
