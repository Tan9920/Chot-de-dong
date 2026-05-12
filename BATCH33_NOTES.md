# Batch33 - lesson provenance persistence + approval gating

## Trọng tâm
Nối governance/compliance từ pack/topic sang **đời sống thật của giáo án đã lưu**.

Trước batch này, repo đã có:
- governance/release/evidence khá dày ở tầng content pack
- export guard theo release snapshot
- support/readiness truth ở tầng scope 1–12

Nhưng vẫn còn khoảng trống lớn:
- khi lưu thành `SavedLessonPlan`, provenance/gating gần như rơi mất
- mở lại / nhân bản / phục hồi phiên bản không giữ snapshot nguồn
- duyệt giáo án có thể diễn ra mà không kiểm tra ngưỡng provenance/source/release/support hiện hành
- library/workspace chưa cho thấy rõ giáo án nào đang bị blocker compliance

## Những gì đã thêm
- `LessonGovernanceSnapshot`, `LessonGovernanceAssessment`, `LessonGovernanceIssue`
- helper mới `lib/lesson-governance.ts`
  - normalize snapshot
  - build digest cho version diff
  - đánh giá khả năng approval theo threshold thật của trường
- `SavedLessonPlan` và `SavedLessonVersion` giờ giữ `governanceSnapshot`
- Prisma schema thêm `provenanceSnapshot` cho `LessonPlan` và `LessonVersion`
- storage JSON/DB map + persist snapshot đầy đủ
- restore version khôi phục cả governance snapshot
- version diff tính cả thay đổi governance/provenance
- save/update/review approve route chặn duyệt nếu còn blocker:
  - thiếu source references
  - không đạt min sourceStatus / release tier / support level theo settings
- workspace:
  - khi generate sẽ materialize snapshot governance hiện hành
  - khi save/export dùng snapshot đó thay vì trace tạm thời dễ rơi mất
  - khi mở lại bản đã lưu sẽ nạp lại snapshot
  - UI hiện panel governance/readiness cho bản đang soạn và cho từng giáo án trong kho
- exporter nhận `governanceSnapshot` và in thêm support level / trace counts vào phần provenance

## Giá trị thực tế
Batch này làm repo gần hơn với web vận hành thật ở điểm quan trọng:
- giáo án đã lưu không còn tách rời khỏi provenance/release truth
- leader/admin không thể duyệt “mù” một giáo án lấy từ scope seed/starter mà không thấy blocker
- export sau khi mở lại giáo án cũ vẫn bám snapshot governance đã lưu, thay vì phụ thuộc hoàn toàn vào state tạm trong editor

## Verify
- `npx tsc --noEmit` ✅
- `npm run build` chưa verify trong container này vì `next` chưa có trên PATH runtime hiện tại
- `npm run lint` chưa verify trong container này vì `next` chưa có trên PATH runtime hiện tại
- `npm run data:validate` chưa verify trong container này vì `tsx` chưa có trên PATH runtime hiện tại
