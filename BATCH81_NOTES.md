# Batch81 — Lesson Design Studio Core Upgrade

## Mục tiêu
Nâng cấp lõi tạo giáo án từ “tạo văn bản giáo án” thành **Lesson Design Studio 1–12**: quy trình thiết kế bài dạy không-AI có bối cảnh lớp học, mục tiêu bài, phân hóa, hoạt động/game, minh chứng đánh giá, worksheet/slide outline, export readiness và nhãn dữ liệu an toàn.

## Vì sao chọn batch này
Nếu chỉ tạo giáo án, sản phẩm dễ bị thay thế bởi web/app khác. Khác biệt cần nằm ở workflow giáo viên Việt Nam: CTGDPT/SGK theo nguồn hợp pháp, tổ chuyên môn, DOCX/PDF, dữ liệu seed/scaffold/reviewed/verified, phân hóa lớp yếu/chuẩn/nâng cao, hoạt động dạy học và kiểm duyệt tài nguyên.

## Thay đổi chính
- Thêm `lib/lesson-design-studio.ts`.
- Thêm `data/lesson-design-studio-blueprints.json`.
- Thêm API `GET/POST /api/lesson-design/studio`.
- Generator nay trả thêm `bundle.designStudio` và gắn phụ lục thiết kế bài dạy vào plan.
- Workspace thêm các input: kiểu thiết kế bài dạy, chế độ Dễ dùng/Tiêu chuẩn/Nâng cao, sĩ số, thiết bị, không gian.
- Workspace hiển thị panel Lesson Design Studio và panel Phân hóa & minh chứng.
- Thêm validator `scripts/validate-batch81-lesson-design-studio-source.mjs`.

## Giới hạn trung thực
- Đây là source-level/product-core upgrade, chưa chứng minh build/live smoke pass.
- Không thêm AI/model/API.
- Activity/game thiếu source/license/review vẫn chỉ là gợi ý/khung an toàn.
- Không claim dữ liệu 1–12 verified đầy đủ.
