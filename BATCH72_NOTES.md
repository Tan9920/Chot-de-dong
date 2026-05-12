# Batch72 — Export Quality & Compliance Packet Runtime Smoke

## Mục tiêu
Không chỉ xuất từ payload tạm trong textarea. Route export DOCX/PDF có thể nhận `lessonId`/`savedLessonId`, đọc lại `SavedLesson` đã lưu trong JSON persistence, rồi gắn nhãn dữ liệu/governance/compliance packet vào file.

## Đã làm ở mức source
- Thêm `lib/export-saved-lesson.ts` để resolve export payload từ saved lesson.
- Nâng `lib/exporter.ts` để DOCX/PDF có trạng thái giáo án, sourceStatus, supportLevel, reviewStatus, releaseTier, watermark và compliance packet.
- Sửa `app/api/export/docx/route.ts` và `app/api/export/pdf/route.ts` để dùng resolver trước khi generate file.
- Sửa `components/workspace.tsx` để khi đã lưu server JSON thì export kèm `lessonId/savedLessonId`.
- Cập nhật `data/product-foundation.json`, basic-flow board và validator `scripts/validate-export-compliance-source.mjs`.

## Không claim
- Chưa production-ready.
- Chưa thay DB thật.
- Chưa có auth/session/CSRF/rate-limit thật.
- Chưa verify mở file bằng Word/Google Docs/LibreOffice.
- Không tạo verified giả, không AI, không thanh toán thật.

## Lệnh kiểm tra
```bash
npm run smoke:batch72
npm run typecheck
npm run build
```
