# Batch40 — Lesson Technical Drafting Quality Upgrade

## Mục tiêu

Batch40 sửa đúng vấn đề người dùng phản hồi: không phải chỉ sai tên môn hay chữ “Kĩ thuật”, mà là **câu chữ và cấu trúc trong giáo án chưa đúng kĩ thuật soạn kế hoạch bài dạy**.

Batch này không thêm AI, không thêm model, không thêm prompt generation, không thêm API AI và không nâng seed/demo/scaffold thành verified.

## Thay đổi chính

- Thêm `lib/lesson-technical-drafting.ts` để chuẩn hóa kĩ thuật soạn giáo án theo cấp/lớp.
- Mỗi lớp/cấp có profile kĩ thuật soạn riêng:
  - early primary: lớp 1–3
  - upper primary: lớp 4–5
  - lower secondary: lớp 6–9
  - upper secondary: lớp 10–12
- Generator chuyển tiến trình hoạt động sang cấu trúc kĩ thuật:
  - a) Mục tiêu
  - b) Nội dung
  - c) Sản phẩm
  - d) Tổ chức thực hiện
  - Chuyển giao nhiệm vụ
  - Thực hiện nhiệm vụ
  - Báo cáo, thảo luận
  - Kết luận, nhận định
- Mục `Yêu cầu cần đạt` được viết lại theo cấu trúc:
  - Kiến thức, kĩ năng
  - Năng lực
    - Năng lực chung
    - Năng lực đặc thù môn học
  - Phẩm chất
  - Minh chứng đánh giá yêu cầu cần đạt
- API `/api/pedagogy` trả thêm `technicalDrafting`.
- Workspace hiển thị thêm block “Kĩ thuật soạn giáo án theo lớp”.
- Thêm script `lesson:technical-drafting-validate`.

## Lưu ý phạm vi

- Đây là chuẩn hóa kĩ thuật biểu đạt và cấu trúc giáo án ở mức rule-based foundation.
- Chưa phải chuẩn verified bởi chuyên gia giáo dục.
- Dữ liệu nội dung vẫn giữ nhãn seed/demo/scaffold nếu chưa được review/verify.
- Phần chuẩn hóa tên môn Kĩ thuật/Công nghệ từ Batch39 vẫn được giữ như guard phụ, nhưng Batch40 không coi đó là vấn đề chính.

## Chưa verify đầy đủ

- `tsx`/`next` không có do chưa install dependencies đầy đủ.
- `tsc --noEmit` bị timeout trong môi trường hiện tại.
- Cần chạy lại ở môi trường cài đủ deps.
