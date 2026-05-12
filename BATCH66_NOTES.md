# Batch66 — Forum/Q&A Thread Safety Foundation

## Mục tiêu

Nâng Community/Creator Hub từ Batch65 sang nền tảng Forum/Q&A an toàn ở mức source-level:

- Có model thread/question/discussion/feedback/resource request dạng JSON.
- Có trạng thái an toàn: `draft`, `submitted`, `visible_limited`, `approved`, `needs_revision`, `rejected`, `taken_down`.
- Có visibility gate: `private`, `moderation_queue`, `limited`, `public`.
- Thành viên mới bị auto-hold, không public tự do.
- Report/takedown làm thread bị giữ khỏi public rộng.
- Helpful answer chỉ là tín hiệu chất lượng khi reviewer xác nhận, không tính spam vote thô.
- Không AI auto-answer, không tiền mặt, không marketplace, không referral nhiều tầng.

## File tạo mới

- `BATCH66_NOTES.md`
- `data/forum-threads.json`
- `lib/forum-thread-safety.ts`
- `app/api/community/threads/route.ts`
- `app/api/community/threads/[id]/report/route.ts`
- `app/api/admin/community/threads/route.ts`
- `scripts/validate-forum-thread-safety.mjs`
- `scripts/smoke-batch66-forum-thread-safety-source.mjs`
- `scripts/verify-batch66-source.mjs`

## File sửa

- `lib/types.ts`
- `lib/product-operating.ts`
- `lib/community-prestige-hub.ts`
- `components/workspace.tsx`
- `data/operating-config.json`
- `package.json`

## Trạng thái thật

Batch66 là source-level foundation. Code có route/API/model/validator/source smoke cho Forum/Q&A, nhưng chưa phải forum production runtime:

- Chưa có database transaction cho thread/report/answer.
- Chưa có UI đầy đủ để người dùng tạo thread/trả lời/report ngay trên browser.
- Chưa có live HTTP smoke với session/cookie/CSRF thật.
- Chưa có anti-vote-ring runtime thật.
- Chưa có job tự động triage report 24/7; hiện mới là policy/source guard.

## Chính sách an toàn đã khóa trong code

- `publicThreadRequiresReview=true`
- `newMemberAutoHold=true`
- `reportAutoHoldEnabled=true`
- `helpfulAnswerRequiresReview=true`
- `noCashRewardForAnswers=true`
- `noAiAutoAnswer=true`
- `publicAutoPublishEnabled=false`
- `cashRewardAllowed=false`

## Verify khuyến nghị

```bash
npm run forum:thread-safety-validate
npm run smoke:batch66
npm run verify:batch66
npm run community:prestige-validate
npm run smoke:batch65
npm run verify:batch65
npm run lint
npm run typecheck
npm run build
```

Nếu môi trường có server/session thật, smoke thêm:

- `GET /api/community/threads`
- `POST /api/community/threads` với cookie/session/CSRF thật
- `POST /api/community/threads/[id]/report` với cookie/session/CSRF thật
- `GET /api/admin/community/threads` với reviewer/admin thật
- `PATCH /api/admin/community/threads` với reviewer/admin + CSRF thật

## Không được overclaim

Không gọi Batch66 là hoàn thiện forum/cộng đồng production. Đây là nền móng safety/source-level để các batch sau nối UI, DB transaction, anti-abuse runtime và live smoke.
