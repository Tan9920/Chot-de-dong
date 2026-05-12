# Batch 3 Notes

## Mục tiêu
Đưa dữ liệu nội dung lớp 6 tiến gần hơn tới mô hình repository production-friendly, đồng thời tăng giá trị review bằng version diff ngay trong workspace.

## Những gì đã làm
- Thêm `lib/content-repository.ts` làm lớp truy cập thống nhất cho topic / PPCT / question bank / rubric bank / resource library.
- Đổi các route `metadata`, `topic`, `program`, `banks`, `resources`, `curriculum/search` sang dùng repository này.
- Thêm API compare version: `GET /api/lessons/:id/versions/compare?versionId=...&compareVersionId=...`.
- Thêm panel diff ở tab Kho nội bộ để xem khác biệt metadata và nội dung giữa 2 phiên bản gần nhau.
- Thêm card tổng quan kho dữ liệu trong workspace để nhìn nhanh mức phủ hiện tại.

## Verify
- `npm install --ignore-scripts`: pass
- `npm run typecheck`: pass
- `npm run data:validate`: pass
- `npm run build`: compile + type validation pass, sandbox rơi ở bước `Collecting page data`, nên chưa thể gọi là full production build verified 100%.
