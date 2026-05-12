# Batch64 — Activity/Game Contribution Moderation Workflow & Safety Gate

## Mục tiêu

Batch64 nâng Activity/Game Library từ nền đọc/source-level sang workflow đóng góp và kiểm duyệt an toàn hơn, vẫn theo nguyên tắc không-AI và không public tự do.

Mục tiêu chính:

- Cho phép giáo viên/creator gửi activity/game vào hàng duyệt, mặc định private hoặc moderation queue.
- Reviewer/admin có route duyệt/yêu cầu sửa/từ chối/verify/approve release/takedown.
- Không public hoặc export official nếu thiếu review, source/license/attribution, copyright readiness hoặc operational support.
- JSON fallback cho Activity/Game Library có write lock và atomic temp-file rename.
- Public API không trả item trong moderation_queue/rejected/taken_down.
- Mọi thao tác đóng góp/duyệt được audit bằng security audit log.

## File tạo mới

- `BATCH64_NOTES.md`
- `lib/activity-game-moderation.ts`
- `app/api/activity-games/contributions/route.ts`
- `app/api/admin/activity-games/[id]/review/route.ts`
- `scripts/validate-activity-game-moderation.mjs`
- `scripts/smoke-batch64-activity-game-moderation-source.mjs`
- `scripts/verify-batch64-source.mjs`

## File sửa

- `lib/types.ts`
- `lib/activity-game-library.ts`
- `app/api/admin/activity-games/route.ts`
- `package.json`

## Cái đã làm thật trong code

- Thêm type `ActivityGameModerationStatus` và `ActivityGameModerationDecision`.
- `ActivityGameLibraryItem` có thêm moderation fields: `moderationStatus`, `authorId`, `legalAssetIds`, `reviewNotes`, `submittedAt`, `reviewDecisionAt`, `reviewDecisionBy`, `publicApprovedAt`, `publicApprovedBy`, `takedownRequestedAt`, `takedownReason`.
- `lib/activity-game-library.ts` có `withActivityGameLibraryWriteLock()` và `writeActivityGameLibrary()` dùng temp file + `fs.rename()`.
- Readiness gate chặn item đang queue/rejected/taken_down/takedown.
- Public search chỉ trả `public` hoặc `limited`, không trả `moderation_queue/private/rejected/taken_down`.
- `createActivityGameContribution()` tạo contribution mặc định `community_submitted`, `private` hoặc `moderation_queue`, chưa public.
- `reviewActivityGameContribution()` xử lý các quyết định: `request_revision`, `reject`, `approve_community`, `verify`, `approve_release`, `request_takedown`, `restore_to_queue`.
- `holdIfReadinessBlocked()` tự đưa item về `needs_revision`/`moderation_queue` nếu reviewer cố public/export khi thiếu điều kiện.
- `GET /api/admin/activity-games` dùng `listActivityGameModerationBoard()` để hiển thị queue/publicReady/exportReady/held.
- `POST /api/activity-games/contributions` yêu cầu active session, rate limit, CSRF/write protection, audit log.
- `POST /api/admin/activity-games/[id]/review` yêu cầu `content:review`, rate limit, CSRF/write protection, audit log.
- Thêm scripts: `activity-game:moderation-validate`, `smoke:batch64`, `verify:batch64`.

## Cái chỉ là source-level / chưa runtime thật

- Chưa chạy Next server thật.
- Chưa verify session/cookie/CSRF bằng live HTTP.
- Chưa chạy typecheck/build thật vì dependency/toolchain vẫn chưa sẵn trong sandbox.
- Chưa có DB-backed table cho Activity/Game Library.
- Chưa có UI form đầy đủ cho contributor/reviewer; hiện có API/source foundation.
- Chưa nối Activity/Game vào export DOCX/PDF/release dossier official.

## Không thay đổi

- Không thêm AI/API AI/OpenAI/Gemini/Anthropic SDK/API key.
- Không thêm agent/model call/prompt-agent.
- Không thêm billing/thanh toán thật.
- Không thêm marketplace tiền mặt/quỹ tiền mặt/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không public tự do tài nguyên cộng đồng.

## Lệnh nên chạy

```bash
npm run activity-game:validate
npm run activity-game:moderation-validate
npm run smoke:batch64
npm run verify:batch64
npm run lint
npm run runtime:closure-validate
npm run runtime:verification-suite
```

Nếu môi trường có dependency thật:

```bash
npm ci
npm run prisma:generate
npm run typecheck
npm run build
```

## Vẫn chưa được claim

Không được claim production-ready/hoàn thiện/100% vì chưa có install + typecheck + build + Prisma + live HTTP smoke pass thật.

## Hướng batch tiếp theo đề xuất

Batch65 nên ưu tiên một trong hai hướng:

1. Runtime Closure thật: xử lý npm/install/typecheck/build/Prisma/live HTTP nếu môi trường cho phép.
2. Activity/Game UI + Export/Release Integration: thêm reviewer UI và chỉ cho activity/game reviewed/verified đi vào export/release dossier.
