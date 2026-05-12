# Batch 26 — pack curation truth flow + citation locator normalization

## Trọng tâm
- Không để release tier phụ thuộc quá nhiều vào scaffold execution/ledger nữa.
- Thêm **pack curation registry** để ghi nhận review consensus, leader approval, admin approval và release recommendation theo pack.
- Chuẩn hoá **citation/page anchor locator** ở source bundle, execution document và evidence ledger để giảm tình trạng pages tự do/khó audit.

## Những gì đã thêm
- `lib/pack-curation.ts`
  - lưu/đọc `pack-curation-records.json`
  - tổng hợp consensus thực tế theo pack
  - preview/import registry như các registry khác
- `lib/citation-locator.ts`
  - normalize locator về dạng như `tr. 12-13 · Mục 2`
- API mới:
  - `GET|POST /api/admin/content/packs/curation-registry`
- CLI mới:
  - `npm run content:curation-summary`
- `content-management`, `pack-compliance`, `academic-release` và `content-admin` đã nối thêm curation summary vào release/compliance center.

## Kết quả mong muốn
- school release candidate / verified release phản ánh gần hơn trạng thái review + approval thật.
- export/compliance manifest bớt dựa vào scaffold step placeholder.
- page anchor/citation locator thống nhất hơn để phục vụ review/evidence về sau.

## Giới hạn hiện tại
- Chưa có curation record thật nên hệ thống sẽ nói thẳng là chưa đạt.
- Không tự tạo dữ liệu reviewer/approval giả.
- Chưa xác minh end-to-end với database migration thật trong môi trường PostgreSQL chạy ngoài.
