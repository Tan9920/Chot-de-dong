# Batch 31 - evidence review stage completion

## Trọng tâm
Hoàn thiện một giai đoạn còn dở: **field evidence review stage** ở cấp pack.

Trước batch này, repo đã có:
- worklist field evidence review
- thao tác reviewer / leader approval từng field

Nhưng vẫn còn nửa đường ở vận hành:
- reviewer phải bấm từng field một
- leader phải ký từng field một
- chưa có pack-level detail riêng cho phase evidence review
- pack execution/release step chưa được đồng bộ ngay sau batch action ở phase này

## Những gì đã thêm
- API mới `GET/POST /api/admin/content/packs/evidence-review-pack-actions`
  - tải detail phase evidence review theo pack
  - reviewer batch action cho các field hợp lệ chưa có quyết định hiện hành của chính reviewer
  - leader batch approval cho các field đã ready
  - leader batch revoke cho các field đang có approval
- `contentManagement.getAcademicEvidenceReviewPackDetail()`
- `contentManagement.addAcademicEvidenceReviewerDecisionBatchRecord()`
- `contentManagement.setAcademicEvidenceLeaderApprovalBatchRecord()`
- đồng bộ lại execution/release-related steps ngay sau batch action evidence review
- UI `components/content-admin.tsx` có pack selector riêng cho phase này

## Giá trị thực tế
Batch này làm phase evidence review bớt phụ thuộc thao tác lẻ từng field, giúp:
- reviewer đi qua pack nhanh hơn
- leader xử lý hàng loạt các field đã sạch blocker
- pack-level progress rõ hơn trước khi sang pack curation / release gating

## Verify
- `npm run typecheck` ✅
- `npm run data:validate` ❌ trong container này vì `tsx` chưa có trên PATH runtime hiện tại
- `npm run build` ❌ trong container này vì `next` chưa có trên PATH runtime hiện tại
