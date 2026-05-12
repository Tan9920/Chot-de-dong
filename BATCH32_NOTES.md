# Batch 32 - support readiness truth model for 1–12

## Trọng tâm
Batch này **không đào sâu cục bộ lớp 6**. Mục tiêu là làm rõ **mức sẵn sàng thật** của từng scope 1–12 để repo không còn dễ gây hiểu nhầm rằng cứ có pack/có scaffold là đã đủ tin cậy để dùng như nội dung vận hành.

## Vấn đề trước batch này
Repo đã có:
- scope 1–12 ở mức catalog/pack registry
- teaching policy theo sourceStatus và release tier
- governance/review/release khá dày

Nhưng vẫn còn một lỗ hổng quan trọng:
- starter pack 1–12 có thể trông "đủ dữ liệu" vì đã có scaffold chương trình / học liệu / câu hỏi / rubric
- runtime/workspace chưa nói rõ mức sẵn sàng thật của scope đang chọn
- policy sinh giáo án chưa có ngưỡng riêng cho support/readiness
- admin/workspace dễ bị hiểu là coverage = readiness

## Những gì đã thêm
- Thêm khái niệm `CurriculumSupportLevel`:
  - `starter`
  - `developing`
  - `foundation`
  - `operational`
- Thêm `supportFlags`, `supportNotes`, `supportSummary` vào summary/coverage/pack summary
- Thêm module `lib/curriculum-support.ts`
  - chuẩn hóa support level
  - so sánh/gating theo support level
  - đánh giá support thực tế từ rollout stage + sourceStatus + release tier + asset coverage
- Siết rule đánh giá:
  - `starter_1_12` vẫn là `starter` dù đã có scaffold đủ mặt bằng
  - `grade6_extended` / `legacy_core` mới lên `developing` nếu đủ asset set
  - `grade6_full_foundation` mới lên `foundation`
  - chỉ `verified + verified_release` mới lên `operational`
- Teaching policy có thêm `minSupportLevel`
- Settings có thêm `teachingMinSupportLevel`
- Route generate dùng thêm support level khi gating
- Bundle trace ghi lại support level thực tế đã dùng khi sinh
- Workspace hiển thị rõ:
  - support summary toàn hệ
  - support level của scope đang chọn
  - ngưỡng support level của policy sinh giáo án
  - support level của bundle đã sinh
  - trạng thái thật của scope đang chọn (support/source/release/note)

## Giá trị thực tế
Batch này không biến repo thành production learning content.
Nó làm một việc thực tế hơn:
- giảm rủi ro hiểu nhầm giữa scaffold và dữ liệu đủ độ tin cậy
- giúp rollout 1–12 trung thực hơn
- tạo nền để batch sau có thể nạp/verify nội dung thật theo từng wave mà không làm sai nghĩa readiness

## Verify
- `tsc --noEmit` ✅
- `npm run build` ❌ trong container này vì `next` chưa có trên PATH runtime hiện tại
- `npm run lint` ❌ trong container này vì `next` chưa có trên PATH runtime hiện tại
- `npm run data:validate` ❌ trong container này vì `tsx` chưa có trên PATH runtime hiện tại
