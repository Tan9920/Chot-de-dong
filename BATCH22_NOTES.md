# Batch 22 - official curriculum portfolio + pack citation kit

## Trọng tâm
- Biến source bundle registry thành hồ sơ nguồn công khai/canonical ở cấp pack.
- Sinh citation kit an toàn pháp lý để export/admin có thể đối chiếu nguồn chính thống.
- Không đồng nghĩa với verified release; chỉ là lớp hồ sơ nguồn/citation rõ ràng hơn.

## Những gì đã nâng
- `lib/official-curriculum-portfolio.ts`
  - build official curriculum portfolio theo pack/toàn hệ
  - đánh giá canonical/authority/legal-safe/public-usable
  - build pack citation kit
- API mới:
  - `GET /api/admin/content/packs/official-portfolio`
  - `GET /api/admin/content/packs/citation-kit?packId=...`
- Export DOCX/PDF sẽ được làm giàu source references từ citation kit nếu có `packId`
- Export append thêm phần nguồn tham chiếu / policy sử dụng nguồn
- Admin summary/report có thêm `officialPortfolioSummary`
- CLI mới:
  - `npm run content:official-portfolio`
  - `npm run content:pack-citation-kit -- <packId>`
