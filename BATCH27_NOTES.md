# Batch 27 — field evidence review workflow

## Mục tiêu
Đẩy thêm một cụm lớn theo hướng “verified hơn”, không thêm seed đẹp mắt:
- thêm **field evidence review workflow** bám theo evidence ledger
- đưa reviewer consensus thật xuống cấp entity-field
- siết release/compliance/workbench để pack không lên tier cao nếu field review còn trống hoặc chưa có leader approval

## Thành phần mới
- `lib/evidence-review.ts`
  - registry + normalize + preview/import cho field evidence review
  - evaluate consensus từng field
  - dựng workbench từ evidence ledger + review registry
- `data/evidence-review-records.json`
  - store JSON local cho field review record
- `data/imports/evidence-review.sample.json`
  - mẫu import minh hoạ cấu trúc registry (không phải dữ liệu thật)
- API mới:
  - `GET|POST /api/admin/content/packs/evidence-review-registry`
- CLI mới:
  - `npm run content:evidence-review-summary`
  - `npm run content:evidence-review-worklist`
- Prisma schema:
  - model `AcademicEvidenceFieldReviewRecord`

## Hệ thống nào đã nối lại
- `content-management`
- `pack-compliance`
- `academic-release`
- `content-admin`
- release snapshot / workbench / report admin

## Guard mới
- pack không nên coi là ready nếu evidence ledger sạch nhưng field review chưa có reviewer consensus
- verified release không nên coi là sạch nếu leader approval ở cấp field chưa phủ đủ
- pack curation cấp pack vẫn cần; field review không thay thế pack approval, mà bổ sung lớp bằng chứng chi tiết hơn

## Giới hạn còn lại
- registry mới đang trống vì tôi không tự bơm review/approval giả
- chưa verify full UI runtime hay Next production build trong môi trường ngoài
- chưa có batch nhập review record thật từ đội học thuật
