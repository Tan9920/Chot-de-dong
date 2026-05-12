# Batch 21 - official source bootstrap + legal-safe textbook intake

## Trọng tâm
- Bắt đầu ghép **nguồn chính thống thật** vào source bundle registry theo hướng an toàn pháp lý.
- Không đồng bộ nguyên văn SGK có bản quyền vào repo.
- Chỉ ghép **metadata, manifest, link nền tảng chính thức, văn bản công khai chính thức** để làm nền cho mapping / ledger / review.

## Những gì đã nâng
- Thêm `lib/source-legal.ts`
  - áp chính sách legal-safe mặc định cho từng loại nguồn
  - chặn reviewed/verified nếu SGK bị đánh dấu sai kiểu ingest/quyền
- Mở rộng `ContentSourceReference`
  - `accessModel`
  - `storagePolicy`
  - `rightsStatus`
  - `rightsHolder`
  - `officialPlatform`
  - `licenseNote`
- Thêm `lib/official-source-bootstrap.ts`
  - bootstrap bundle chính thống từ MOET + NXBGDVN/Học Liệu Số
  - phân theo official_core / guidance / textbook
  - phủ đa lớp, không chỉ lớp 6
- Thêm CLI:
  - `npm run content:official-source-preview`
  - `npm run content:official-source-apply`
  - `npm run content:official-source-coverage`
- Thêm tài liệu `docs/legal-source-ingestion.md`
- Đã áp bootstrap thực vào `data/source-bundles.json`
  - điền metadata/link chính thức cho toàn bộ bundle scaffold hiện có
  - giữ trạng thái seed để tránh nói quá mức verified

## Điều phải nói rõ
- Batch này **không** kéo toàn văn SGK về repo.
- Batch này **không** tuyên bố đã có verified academic corpus.
- Đây là bước mở đầu đúng pháp lý và đúng governance để sau đó map field evidence / ledger theo trang trích chính xác.
