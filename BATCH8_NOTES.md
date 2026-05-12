# Batch 8 Notes

## Mục tiêu
- Mở rộng mặt bằng dữ liệu lớp 6 ra nhiều môn hơn, không dừng ở 4 môn cốt lõi.
- Đặt nền kỹ thuật để phủ 1–12 bằng pack dữ liệu theo lớp/môn, thay cho seed rời rạc.

## Điểm kỹ thuật chính
- `subject-pack-registry.json` là registry dữ liệu đầu vào cho các pack rollout.
- `seed-pack-builder.ts` sinh đồng bộ topic / program / resource / question / rubric từ registry.
- Có 3 giai đoạn rollout:
  - `legacy_core`
  - `grade6_extended`
  - `starter_1_12`
- Summary/metadata của workspace giờ có:
  - `levels`
  - `gradeLevelMap`
  - `packs`
- Workspace đã đổi từ tư duy “chỉ THCS lớp 6” sang “lớp 6 mở rộng + khởi động phủ 1–12”.

## Dữ liệu
- Dữ liệu mới vẫn là seed/demo có cấu trúc.
- Chưa khẳng định là dữ liệu chuẩn CTGDPT chính thức.
- Mục đích của batch này là mở rộng mặt bằng dữ liệu + pipeline, không tuyên bố hoàn tất nội dung học thuật.
