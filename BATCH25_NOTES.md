# Batch 25 — academic release center + full-pack ledger persistence

## Trọng tâm
- Dựng lớp **release center** ở cấp pack thay vì chỉ có snapshot/compliance rời rạc.
- Biến blocker compliance thành **curation queue** theo stage/owner/priority.
- Tạo **release manifest** để pack có hồ sơ phát hành an toàn trước khi export nội bộ/trường.
- Mở rộng `evidence-ledger.json` từ một phần nhỏ lên **toàn bộ 140 pack** dưới dạng scaffold persisted.

## Điểm chính
- Thêm `lib/academic-release.ts`.
- Có `AcademicCurationQueueSummary` và `PackReleaseManifest`.
- Admin summary/report giờ kéo thêm `curationQueue`.
- Có route mới:
  - `GET /api/admin/content/curation-queue`
  - `GET /api/admin/content/packs/release-manifest?packId=...`
- Có CLI mới:
  - `npm run content:curation-queue`
  - `npm run content:release-manifest -- <packId>`
- `components/content-admin.tsx` có thêm:
  - compliance & curation center
  - release manifest viewer theo pack
- `data/evidence-ledger.json` được materialize scaffold cho **140/140 pack**, tổng **1810 records**.

## Lưu ý
- Ledger persisted mới này vẫn là scaffold/pending, không phải corpus verified.
- Release manifest không thay thế review/approval thật; nó chỉ làm trạng thái phát hành minh bạch hơn.
