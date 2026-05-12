# BATCH28 NOTES

## Chủ đề batch
Roadmap-driven 1–12 scope defaults + teaching-path policy hardening.

## Mục tiêu
- Giảm default bias THCS / lớp 6 / Ngữ văn ở workspace, metadata và admin scaffold.
- Đưa lựa chọn scope mặc định sang mô hình bám curriculum roadmap 1–12 thật trong code.
- Bổ sung policy ngưỡng cho luồng sinh giáo án dựa trên `sourceStatus` và `releaseTier`.
- Cho phép leader/admin bật internal preview bypass có kiểm soát, thay vì để nội dung chưa đạt ngưỡng đi thẳng như nội dung chính thức.
- Giữ JSON/dev fallback, nhưng phân biệt rõ hơn giữa scope mặc định, preview nội bộ và đường dùng dạy học chính thức.

## Điểm thay đổi chính
1. Thêm `preferredLevel`, `preferredGrade`, `preferredSubject`, `preferredBook` vào `SchoolSettings`.
2. Thêm teaching policy org-level:
   - `teachingMinSourceStatus`
   - `teachingMinReleaseTier`
   - `allowPrivilegedPreviewBypass`
3. Thêm helper `lib/curriculum-scope.ts` để resolve scope mặc định dựa trên curriculum catalog 1–12 thật.
4. Thêm helper `lib/teaching-policy.ts` để gate luồng sinh giáo án.
5. `GET /api/metadata` trả thêm:
   - `defaultScope`
   - `teachingPolicy`
6. `POST /api/generate` kiểm tra policy trước khi trả bundle.
7. Workspace và content admin không còn hardcode mặc định THCS / lớp 6 / Ngữ văn cho đường mở app thông thường.
8. Export fallback và nhiều pack-workbench fallback nội bộ được đổi sang scope trung tính hơn.
9. Vá thêm guard cho `inferPackIdFromEntityId()` để `npm run data:validate` không còn gãy khi gặp entity thiếu `id`.

## Ý nghĩa kiến trúc
Batch này không làm sâu thêm dữ liệu học thuật cho riêng lớp 6. Nó siết đường vận hành chung 1–12:
- Chọn scope mặc định bám curriculum thật.
- Áp ngưỡng phát hành/nội dung vào đường sinh giáo án.
- Giảm nguy cơ UI/API vô thức quay lại lớp 6 khi thiếu tham số.
- Chuẩn bị nền cho admin/reviewer vận hành release theo grade/subject trên toàn hệ 1–12.

## Giới hạn còn lại
- Dữ liệu học thuật verified vẫn chưa phủ thật cho 1–12; phần lớn vẫn là seed/demo.
- Một số module học thuật sâu vẫn còn thiên về lớp 6 ở dữ liệu và heuristic, dù default runtime đã được giảm bias rõ hơn.
- Build production trong container này chưa xác nhận xong end-to-end dù `tsc --noEmit` đã pass và `next build` đi qua bước compile thành công.
