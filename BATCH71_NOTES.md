# Batch71 — Persistence & Real Saved Lesson Foundation

## Mục tiêu

Batch70 đã khóa Product Foundation nhưng điểm yếu lớn nhất vẫn là lưu nháp localStorage/RAM. Batch71 chuyển luồng lưu/mở giáo án sang nền JSON persistence cho `SavedLesson` và `SavedLessonVersion`, để demo ổn định hơn và có đường sang database thật sau này.

## Nguyên tắc đã giữ

- Không thêm AI/API/model/agent.
- Không thêm thanh toán thật, marketplace tiền mặt, quỹ tiền mặt hoặc referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không public cộng đồng tự do.
- Không claim JSON file là database production.
- Draft seed/scaffold được phép lưu để giáo viên chỉnh sửa, nhưng không được gửi duyệt/duyệt như nội dung đã verified.

## File tạo mới

- `data/saved-lessons.json`
- `data/saved-lesson-versions.json`
- `scripts/validate-saved-lesson-persistence-source.mjs`
- `BATCH71_NOTES.md`

## File sửa

- `lib/storage.ts`
- `lib/lesson-trust-gates.ts`
- `components/workspace.tsx`
- `app/api/health/route.ts`
- `lib/product-foundation.ts`
- `lib/demo-basic-flow.ts`
- `scripts/validate-basic-flow-source.mjs`
- `data/product-foundation.json`
- `package.json`
- `README.md`
- `DEPLOYMENT_DEMO_GUIDE.md`
- `docs/BASIC_PRODUCT_FOUNDATION.md`

## Thay đổi chính trong code

1. `lib/storage.ts`
   - Thêm JSON file persistence qua `data/saved-lessons.json` và `data/saved-lesson-versions.json`.
   - `readLessons`, `getLessonById`, `saveLesson`, `deleteLesson`, `getLessonVersions`, `getLessonVersionDiff`, `restoreLessonVersion` đọc/ghi JSON thay vì chỉ giữ trong RAM.
   - Mỗi lần lưu tạo version record mới.
   - Có `getStoragePaths()` để route health/API hiển thị rõ storage mode.

2. `components/workspace.tsx`
   - Boot workspace đọc `/api/lessons` để mở lại bản nháp server JSON.
   - Nút “Lưu bản nháp” ưu tiên POST `/api/lessons`.
   - Nếu server save lỗi thì mới fallback localStorage.
   - UI nói rõ JSON persistence chưa phải database production.

3. `lib/lesson-trust-gates.ts`
   - Sửa lỗi gate cũ có thể chặn cả lưu draft vì thiếu `sourceStatus`.
   - Draft seed/scaffold/community được phép lưu với warning.
   - Review/approval vẫn bị chặn nếu chưa đạt ít nhất `reviewed`.

4. `data/product-foundation.json`
   - Version nâng lên Batch71.
   - Thêm `persistenceFoundation`.
   - Core flow `edit_save_reopen` chuyển từ `needs_database_closure` sang `json_persistence_foundation`.
   - Next recommendation chuyển sang Batch72 export quality/compliance runtime smoke.

5. Scripts
   - `npm run saved-lessons:persistence-validate`
   - `npm run smoke:batch71`
   - `npm run verify:batch71`
   - `verify:deploy` trỏ sang smoke Batch71 + typecheck + build.

## Còn giới hạn thật

- JSON persistence không phải database production.
- Chưa có locking đa instance, backup/restore, migration DB thật, phân trang hoặc search index.
- Auth/session hiện vẫn demo-level; `getSessionUser()` chưa đọc session cookie thật.
- CSRF/rate-limit trong `runtime-security.ts` vẫn no-op demo.
- Chưa live HTTP smoke qua server thật trong batch này nếu install/build không hoàn tất.
- Chưa browser/mobile QA.

## Lệnh cần chạy

```bash
npm run imports:validate
npm run data:validate
npm run demo:readiness-validate
npm run basic-flow:validate
npm run product:foundation-validate
npm run saved-lessons:persistence-validate
npm run smoke:batch71
npm run typecheck
npm run build
```

Nếu chạy được server, smoke tối thiểu:

```bash
GET /api/health
GET /api/demo/basic-flow
GET /api/product/foundation
GET /api/lessons
POST /api/lessons
GET /api/lessons/:id/versions
```

## Không claim

Không claim production-ready, database-ready, auth-secure, deploy-ready hoặc “100%” nếu chưa pass install/typecheck/build/live smoke/browser QA.
