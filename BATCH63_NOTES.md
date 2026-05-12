# Batch63 — Non-AI Activity/Game Library Safety Foundation

## Mục tiêu

Batch63 đưa ý chiến lược “kho trò chơi/hoạt động thú vị theo bài học” vào repo theo hướng không-AI, không public tự do và không tạo dữ liệu verified giả.

Mục tiêu chính:

- Tạo Activity/Game Library có metadata lớp/môn/bài, thời lượng, sĩ số, không gian, thiết bị, mức độ ồn, sản phẩm học sinh và minh chứng đánh giá.
- Gắn readiness gate để seed/scaffold chỉ được coi là safe skeleton, không phải tài nguyên reviewed/verified.
- Public/official export bị chặn nếu thiếu review, source/license/attribution hoặc copyright chưa rõ.
- Bổ sung API đọc kho hoạt động/trò chơi và admin board source-level.
- Bổ sung UI trong tab Thư viện để giáo viên thấy hoạt động/trò chơi nhưng kèm cảnh báo safe skeleton.
- Bổ sung validate/smoke/verify source-level cho batch.

## File tạo mới

- `BATCH63_NOTES.md`
- `data/activity-game-library.json`
- `lib/activity-game-library.ts`
- `app/api/activity-games/route.ts`
- `app/api/admin/activity-games/route.ts`
- `scripts/validate-activity-game-library.mjs`
- `scripts/smoke-batch63-activity-game-source.mjs`
- `scripts/verify-batch63-source.mjs`

## File sửa

- `lib/types.ts`
- `lib/product-operating.ts`
- `data/operating-config.json`
- `components/workspace.tsx`
- `package.json`

## Cái đã làm thật trong code

- Có data file `data/activity-game-library.json` với 3 seed/scaffold activity/game records.
- Có type `ActivityGameLibraryItem`, readiness/summary types trong `lib/types.ts`.
- Có `normalizeActivityGameItem()`, `assessActivityGameReadiness()`, `summarizeActivityGameLibrary()`, `searchActivityGameLibrary()` trong `lib/activity-game-library.ts`.
- Có route `GET /api/activity-games` để trả hoạt động/trò chơi theo grade/subject/topic/q/kind với policy note.
- Có route `GET /api/admin/activity-games` yêu cầu `content:review` để xem readiness board.
- `operating-config.json` bật feature flag `activityGameLibrary` và thêm nguyên tắc public cần review/license/source.
- `buildOperatingFoundationBoard()` đưa activity/game summary vào operating board.
- Workspace tab “Thư viện dùng chung” hiển thị “Kho trò chơi / hoạt động thú vị” cùng cảnh báo safe skeleton.
- Package scripts mới: `activity-game:validate`, `smoke:batch63`, `verify:batch63`.

## Cái chỉ là seed/demo/scaffold

- 3 hoạt động trong `data/activity-game-library.json` đều là seed/scaffold, chưa verified.
- Chưa có quy trình POST/PATCH upload trò chơi thật từ người dùng.
- Chưa có bảng DB thật cho Activity/Game Library.
- Chưa có moderation workflow riêng đầy đủ cho activity/game contribution; hiện mới có admin read board và readiness gate.
- Chưa có export chính thức gắn activity/game vào DOCX/PDF.

## Không thay đổi

- Không thêm AI/API AI/model SDK/API key.
- Không thêm billing/thanh toán thật.
- Không thêm marketplace tiền mặt/quỹ tiền mặt/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không copy SGK/tài liệu bản quyền.

## Verify đã chạy

- `node scripts/validate-activity-game-library.mjs`
- `node scripts/smoke-batch63-activity-game-source.mjs`
- `node scripts/verify-batch63-source.mjs`
- `node scripts/source-lint.mjs`
- `node scripts/validate-runtime-closure.mjs`

## Vẫn chưa được claim

Không được claim production-ready vì vẫn chưa có:

- `npm install`/`npm ci` pass ổn định.
- `npm run typecheck` pass thật.
- `npm run build` pass thật.
- `npm run prisma:generate` và `npm run db:push` pass thật.
- Live HTTP smoke trên Next server thật với session/cookie/CSRF.

## Hướng batch tiếp theo đề xuất

Batch64 nên chọn một trong hai hướng lớn:

1. Activity/Game Contribution Moderation Workflow: POST/PATCH upload, review, takedown, trust-level, anti-spam, point ledger nhưng không tiền mặt.
2. DB-backed Activity/Game Library + Release Dossier Integration: schema Prisma, migration prep, export/public enforcement sâu hơn.

Nếu môi trường cho phép cài dependency thật, ưu tiên chốt runtime closure trước khi mở thêm tính năng lớn.
