# Batch39 — Grade-Specific Lesson Structure & Subject Name Normalization

## Mục tiêu

Batch39 tập trung vào lỗi sản phẩm/sư phạm đang thấy rõ sau Batch38:

- Không dùng cùng một khung soạn cho mọi lớp.
- Cụ thể hóa blueprint riêng cho từng lớp 1–12, không chỉ theo band lớp.
- Sửa cấu trúc "Yêu cầu cần đạt" để năng lực và phẩm chất nằm trong chính mục này.
- Chuẩn hóa tên môn "Kĩ thuật/Kỹ thuật" thành "Công nghệ" khi là môn học, đồng thời vẫn giữ thuật ngữ "kĩ thuật dạy học" ở phần phương pháp.
- Không thêm AI, không thêm model, không gọi API AI.
- Không nâng seed/demo/scaffold thành verified.

## Thay đổi chính

### 1. Blueprint riêng cho từng lớp

Thêm `lib/grade-lesson-structure.ts` với blueprint cho Lớp 1 đến Lớp 12:

- đặc điểm thiết kế riêng;
- trọng tâm nhận thức/kĩ năng;
- ngôn ngữ/lệnh giáo viên nên dùng;
- cấu trúc giáo án cần ưu tiên;
- hướng dẫn viết yêu cầu cần đạt;
- điều chỉnh từng pha: khởi động, hình thành, luyện tập, vận dụng;
- checklist đánh giá và phân hóa.

### 2. Sửa cấu trúc Yêu cầu cần đạt

Generator không còn tách riêng:

- `PHẨM CHẤT CHỦ YẾU`
- `NĂNG LỰC`

thành các mục ngang hàng kiểu cũ. Thay vào đó, mục `YÊU CẦU CẦN ĐẠT` chứa:

- kiến thức/kĩ năng/hoạt động học cần đạt;
- năng lực chung;
- năng lực đặc thù môn học;
- phẩm chất chủ yếu biểu hiện trong bài học;
- kiểm tra nhanh tính phù hợp theo lớp.

### 3. Chuẩn hóa tên môn Kĩ thuật/Kỹ thuật

Thêm `lib/subject-naming.ts`:

- input `Kĩ thuật` hoặc `Kỹ thuật` được canonical thành `Công nghệ` khi là tên môn;
- generator hiển thị `Môn: Công nghệ`;
- nếu input legacy alias thì trả cảnh báo để UI/export biết;
- phần phương pháp vẫn dùng thuật ngữ `Kĩ thuật dạy học` để không nhầm với tên môn.

### 4. API/UI

- `/api/pedagogy` trả thêm grade blueprint và subject naming warning.
- Workspace hiển thị "Khung giáo án riêng cho Lớp X".
- Topic panel đổi cách gọi thành `Yêu cầu cần đạt - năng lực/phẩm chất` thay vì tách như mục độc lập.

### 5. Validation

Thêm script:

```bash
npm run lesson:grade-structure-validate
npm run lesson:grade-structure-validate -- --strict
npm run lesson:grade-structure-validate -- --json
```

Script kiểm:

- có đủ blueprint 1–12;
- Lớp 1 và Lớp 5 không dùng cùng blueprint;
- `Kĩ thuật` chuẩn hóa thành `Công nghệ`;
- generator không còn `Môn: Kĩ thuật`;
- năng lực/phẩm chất nằm trong mục `Yêu cầu cần đạt`;
- phần techniques dùng tên `Kĩ thuật dạy học`.

## Phạm vi chưa làm

- Chưa thêm verified content 1–12.
- Chưa có chuyên gia duyệt blueprint.
- Chưa chỉnh sâu theo từng môn/bộ sách ở mức bài học verified.
- Chưa thêm AI.
- Chưa thêm thanh toán/marketplace/quỹ/referral nhiều tầng.
