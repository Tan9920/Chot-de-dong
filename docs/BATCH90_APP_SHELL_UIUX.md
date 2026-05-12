# BATCH90 APP SHELL UIUX

## Vấn đề từ feedback

Workspace trước đó đã có mobile bottom tabs nhưng vẫn giống danh sách dài hơn là app thật. Một số lựa chọn phụ như chế độ giao diện, sĩ số, thiết bị, không gian dạy học nằm ngay trong form soạn bài, làm màn chính dày và khó dùng với giáo viên mới.

## Quyết định thiết kế

### 1. mobile bottom tabs

Mobile dùng bottom tabs rõ ràng: Soạn, Sửa, Nháp, Xuất, Góp ý, Cài đặt. Mỗi tab có trạng thái active và chỉ hiện panel chính tương ứng trên mobile.

### 2. settings tab

Các lựa chọn phụ được gom vào settings tab:

- Chế độ giao diện: Dễ dùng / Tiêu chuẩn / Nâng cao.
- Sĩ số lớp.
- Thiết bị lớp học.
- Không gian dạy học.
- Ghi chú an toàn cho giáo viên.

### 3. export tab

Xuất DOCX/PDF được tách thành export tab để giáo viên trên điện thoại không phải tìm nút trong editor. Panel này vẫn nhắc kiểm tra nội dung, nguồn và nhãn dữ liệu trước khi dùng chính thức.

### 4. teacher compose flow

Màn Soạn bài chỉ giữ các trường cần chọn nhanh: lớp, môn, bộ sách/nguồn, bài/chủ đề, mẫu, thời lượng, mục tiêu, mức học sinh, kiểu bài dạy. Nếu catalog thiếu thì vẫn cho tự nhập nhưng không sinh kiến thức sâu khi dữ liệu chưa verified.

### 5. desktop vẫn đủ kiểm soát

Desktop có navigation rail bên trái. Các panel chuyên sâu vẫn xuất hiện trên desktop/chế độ nâng cao, nhưng không làm rối luồng mobile.

## Giới hạn

Đây là source-level UIUX improvement. Chưa thay thế kiểm thử mobile thật, build thật, hosted URL smoke hoặc feedback giáo viên thật.
