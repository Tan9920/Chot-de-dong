# BATCH87 CONTROLLED TEACHER TEST GUIDE

Mục tiêu Batch87 là biến việc chia link demo thành một vòng kiểm thử có kiểm soát: có điều kiện trước khi chia, có nhiệm vụ test rõ ràng, có câu hỏi feedback và có mức ưu tiên lỗi. Đây vẫn chưa phải production-ready.

## Trước khi gửi link cho giáo viên

Chỉ gửi link cho nhóm nhỏ 3–10 giáo viên tin cậy khi đã có tối thiểu:

1. Vercel build/deploy pass.
2. `GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke` pass hoặc có log fail rõ để sửa.
3. `/api/demo/launch-gate` không còn source blocker.
4. Tin nhắn mời test nói rõ: demo kiểm thử, giáo viên phải kiểm tra nội dung, dữ liệu seed/scaffold chưa phải verified.
5. Có kênh thu feedback: form, chat nhóm, Google Sheet hoặc tin nhắn theo mẫu.

## Tin nhắn mời test gợi ý

Đây là bản demo kiểm thử có kiểm soát, chưa phải sản phẩm hoàn thiện. Nhờ thầy/cô thử mở web, tạo một khung giáo án, lưu nháp, xuất Word/PDF và báo lỗi giao diện/file tải/cảnh báo dữ liệu. Nội dung tạo ra chỉ là bản nháp tham khảo, giáo viên vẫn phải kiểm tra kiến thức, nguồn và chỉnh trước khi dùng thật.

## Nhiệm vụ test tối thiểu

- Mở link bằng điện thoại Android/iPhone.
- Tạo khung lớp 1 để kiểm phong cách tiểu học.
- Tạo khung lớp 5 để kiểm giai đoạn chuyển tiếp.
- Tạo khung lớp 10 để kiểm THPT.
- Chạy checklist chất lượng.
- Xuất DOCX và PDF, mở file thật.
- Lưu nháp, reload trang, mở lại bản lưu.

## Câu hỏi feedback ngắn

1. Mở demo lần đầu có hiểu đây là web soạn giáo án/xuất file, không phải AI tạo chuẩn, không?
2. Form tạo giáo án có dễ hiểu với giáo viên phổ thông không?
3. DOCX/PDF tải về có đủ đẹp để góp ý tiếp không?
4. Cảnh báo dữ liệu seed/scaffold/cần giáo viên kiểm tra có đủ rõ không?
5. Lỗi nào khiến thầy/cô không thể test tiếp?
6. Tính năng nào hữu ích nhất?
7. Phần nào quá kỹ thuật hoặc khó hiểu?
8. Muốn dùng thử thật thì còn thiếu gì nhất?

## Phân loại lỗi

- P0: Không mở được web, build/deploy chết, màn hình trắng, không tạo/xuất/lưu được ở mọi máy. Dừng chia link và sửa ngay.
- P1: Một luồng chính lỗi: tạo khung, lưu, DOCX/PDF, CSRF/session, mobile layout. Sửa trước khi mời thêm tester.
- P2: Giao diện khó hiểu, file chưa đẹp, cảnh báo chưa rõ, thiếu hướng dẫn. Gom phản hồi và sửa trong batch UX/export.
- P3: Góp ý tính năng mới hoặc nội dung học thuật cần review. Đưa vào roadmap, không làm vội nếu chưa qua governance.

## Không được nói khi mời test

- Không nói AI tạo giáo án chuẩn.
- Không nói chuẩn Bộ 100%.
- Không nói dùng ngay không cần sửa.
- Không nói không vi phạm bản quyền.
- Không nói cộng đồng public tự do.
- Không nói đăng tài liệu là có tiền.

## API và script liên quan

- `GET /api/demo/tester-pack`
- `npm run demo:tester-pack-validate`
- `npm run smoke:batch87`
- `npm run verify:batch87`

## Cần lưu bằng chứng

- Ảnh deployment success trên Vercel.
- Log hosted URL smoke pass/fail.
- Ảnh mobile màn hình đầu.
- Một file DOCX và một file PDF tải về.
- Danh sách lỗi theo P0/P1/P2/P3.
- 3–10 phản hồi giáo viên đầu tiên.
