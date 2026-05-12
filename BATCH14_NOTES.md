# Batch 14 - academic dossier rollout + export safety

## Trọng tâm
- Không tiếp tục đổ thêm seed rời rạc cho riêng lớp 6.
- Dựng lớp hạ tầng để lớp 6 trở thành pack chuẩn đầu tiên, đồng thời kéo được lớp 1–5 và các lớp sau đi cùng một khuôn verified workflow.

## Những gì đã nâng
- `lib/academic-dossier.ts`: sinh **academic dossier board** cho toàn bộ pack 1–12 từ pack registry, phân nhóm ưu tiên khối 1–5 / lớp 6 / 7–9 / 10–12, và sinh **dossier template JSON** cho từng pack.
- API mới:
  - `GET /api/admin/content/dossiers`
  - `GET /api/admin/content/dossiers/template?packId=...`
- CLI mới:
  - `npm run content:dossier-board`
  - `npm run content:dossier-template -- <packId>`
- `lib/content-management.ts`: academic quality gate giờ kiểm thêm:
  - thiếu `fieldEvidence`
  - `fieldEvidence` trỏ tới `referenceId` không tồn tại
  - conflict giữa mô tả CTGDPT và SGK
- `lib/generator.ts`: trả `trace` thật từ dữ liệu bài/chủ đề, không còn mismatch giữa type và runtime.
- `lib/exporter.ts` + workspace export:
  - export DOCX/PDF có khối provenance/govenance
  - tự watermark rõ **seed/demo** hoặc **reviewed chưa verified**
  - đổi filename sang prefix `noi-bo-` khi chưa đủ điều kiện official use
- Admin UI nối thêm **Academic dossier board** để nhìn ưu tiên rollout chứ không chỉ nhìn release board/runtime.

## Điều vẫn phải nói rõ
- Batch này **không tự biến dữ liệu lớp 6 hay lớp 1–5 thành verified corpus thật**.
- Nó dựng khuôn dossier/trace/export để đội nội dung có thể đẩy từng pack thật vào mà không làm lệch chuẩn giữa các khối lớp.
- Các dossier template sinh ra là **template để điền evidence thật**, không phải manifest verified sẵn.
