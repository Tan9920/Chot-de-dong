# Batch80 — Deep Hidden-Risk Audit & Strategy-Aligned Safety Hardening

## Mục tiêu
Batch80 không thêm AI, không thêm thanh toán thật và không tạo dữ liệu verified giả. Trọng tâm là bóc các vấn đề ẩn sau Batch79:

- Source validators có thể treo nếu một validator bị kẹt.
- `npm ci` sạch có thể treo do DNS/registry nếu không có timeout rõ.
- Một số module cộng đồng/game/forum còn giống stub hoặc in-memory, trong khi route runtime đã kỳ vọng object sâu hơn.
- Cần một API audit rủi ro chiến lược để không chỉ nhìn UI mà bỏ qua blocker runtime/data/legal/community.

## Thay đổi chính

1. Verification tooling fail-closed
- `scripts/run-source-validators.mjs` có per-validator timeout bằng `GIAOAN_SOURCE_VALIDATOR_TIMEOUT_MS`.
- `scripts/clean-npm-ci.mjs` có timeout `GIAOAN_NPM_CI_TIMEOUT_MS`, fetch timeout/retry thấp và thông báo timeout là fail.
- `scripts/clean-npm-command.mjs` có timeout `GIAOAN_NPM_COMMAND_TIMEOUT_MS`.

2. Strategy risk audit
- Thêm `lib/strategy-risk-audit.ts`.
- Thêm `GET /api/product/strategy-risk-audit`.
- Thêm `npm run strategy:risk-audit`.
- Audit này nêu blocker như thiếu `node_modules/.bin/next`, registry env protected, source validator không timeout, module cộng đồng stub, `types.ts` quá nhiều `any`, release signoff còn foundation.

3. Community/forum/activity hardening
- `lib/activity-game-library.ts` đọc `data/activity-game-library.json` và `data/activity-game-contributions.json`, không còn trả 1 item demo hardcoded.
- `lib/activity-game-moderation.ts` lưu contribution vào JSON fallback, đánh giá nguồn/license/student product/assessment/copyright, chặn public nếu thiếu điều kiện.
- `lib/forum-thread-safety.ts` chuyển từ in-memory stub sang JSON fallback `data/forum-threads.json`, trả đúng shape route kỳ vọng `{ thread, readiness }`, giữ thread bị report/private khi có rủi ro.
- `lib/community-moderation.ts` chuyển từ in-memory stub sang JSON fallback `data/community-resources.json`, có source/license/takedown/publication readiness.

## Giới hạn trung thực
- Batch80 vẫn chưa chứng minh build Next pass thật vì môi trường có thể không tải được dependency từ npm public.
- Release signoff workflow vẫn là foundation và cần batch riêng.
- `lib/types.ts` còn nhiều alias `any`; Batch80 chỉ phát hiện/surface, chưa thay toàn bộ type system.
- JSON fallback không phải database production.

## Lệnh kiểm tra

```bash
npm run source:validate
npm run deep:hidden-risk-validate
npm run strategy:risk-audit
npm run install:clean
npm run typecheck
npm run build:clean
npm run live:smoke:clean
```

Không được gọi production-ready nếu install/build/live smoke chưa pass thật.
