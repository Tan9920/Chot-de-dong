# Batch 9 notes

## Mục tiêu batch
- Làm dày mặt bằng lớp 6 theo hướng foundation pack, không chỉ dừng ở pack mở rộng.
- Mở rộng starter coverage 1–12 theo từng lớp và môn để hệ thống có roadmap phủ rõ ràng hơn.
- Thêm lớp roadmap để đo được độ phủ theo lớp/môn, thay vì chỉ đếm seed pack.

## Điểm kỹ thuật chính
- Thêm rollout stage mới: `grade6_full_foundation`.
- Mở rộng `data/seed/subject-pack-registry.json` lên mặt bằng 140 pack.
- Thêm `lib/curriculum-roadmap.ts` để tổng hợp:
  - required subjects
  - covered subjects
  - missing subjects
  - foundation/verified subjects
  - readiness percent theo lớp
- Metadata giờ trả thêm `summary.roadmap`.
- Thêm API `GET /api/roadmap`.
- Workspace hiển thị readiness, missing subjects và next priorities.
- Thêm script export roadmap report: `npm run seed:roadmap`.
- Script export manifest hỗ trợ lọc thêm theo `--subject`.

## Ý nghĩa của batch
Batch này vẫn chưa biến dữ liệu thành dữ liệu CTGDPT đã thẩm định. Nhưng nó biến repo từ mức “có pack seed” sang mức “có thể quản lí rollout, đo độ phủ và biết chính xác lớp nào còn thiếu môn nào”.
