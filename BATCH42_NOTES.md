# Batch42 — DOCX/PDF Export Structure & Compliance Packet

## Mục tiêu

Nâng cấp lớp xuất DOCX/PDF sau Batch41 để file xuất không chỉ là văn bản giáo án thô. Export phải có cấu trúc review nội bộ rõ hơn, gắn watermark/cảnh báo khi dữ liệu chưa verified, kèm phụ lục nguồn, checklist chất lượng và compliance/release packet.

## Phạm vi đã làm

- Thêm `lib/export-document-model.ts` để dựng model export độc lập với thư viện `docx`/`pdfkit`.
- Thêm `lib/export-guard.ts` để gom logic guard chung giữa `/api/export/docx` và `/api/export/pdf`.
- Sửa `lib/exporter.ts` để render theo block có cấu trúc: document control, governance, nội dung giáo án, phụ lục nguồn, phụ lục checklist, phụ lục compliance.
- Sửa `normalizeExportPayload` để không làm rơi `qualityChecklist` khi chuyển payload qua export pipeline.
- Sửa route DOCX/PDF để dùng guard chung, giảm trùng logic và giảm rủi ro lệch policy.
- Thêm `scripts/validate-export-compliance-packet.ts` và script `npm run export:compliance-validate`.

## Điều không làm

- Không thêm AI, API AI, model hay prompt generation.
- Không thêm thanh toán thật.
- Không biến seed/demo/scaffold thành reviewed/verified.
- Không copy nội dung SGK dài hoặc dữ liệu có rủi ro bản quyền.

## Trạng thái thật

Batch42 cải thiện cấu trúc export và compliance packet ở tầng code/type/model. Việc xuất file DOCX/PDF runtime thật vẫn cần cài dependency và chạy route/export buffer trong môi trường có `docx`, `pdfkit`, `next`.
