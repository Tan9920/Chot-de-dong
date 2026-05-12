# Batch65 — Community Prestige Hub & Creator Trust Foundation

## Mục tiêu
Nâng nền tảng từ “kho hoạt động/trò chơi có kiểm duyệt” sang một lớp cộng đồng có vị thế hơn: Community/Creator Hub, trust level, hồ sơ creator, bảng xếp hạng theo chất lượng và policy chống spam/tiền mặt sớm.

## Nguyên tắc giữ nguyên
- Không thêm AI/API AI/model call.
- Không bật cash marketplace, quỹ tiền mặt, referral nhiều tầng.
- Không public creator/resource/activity nếu thiếu kiểm duyệt, nguồn, license, hoặc trust/safety.
- Không quảng cáo seed/demo creator như cộng đồng thật.
- Leaderboard xếp theo tín hiệu chất lượng, không theo số lượng spam.

## File tạo mới
- `data/creator-profiles.json`
- `lib/community-prestige-hub.ts`
- `app/api/community/hub/route.ts`
- `app/api/admin/community/hub/route.ts`
- `scripts/validate-community-prestige-hub.mjs`
- `scripts/smoke-batch65-community-hub-source.mjs`
- `scripts/verify-batch65-source.mjs`

## File sửa
- `lib/types.ts`
- `lib/product-operating.ts`
- `data/operating-config.json`
- `components/workspace.tsx`
- `package.json`

## Có thật ở source-level
- Community Hub public API chỉ trả board an toàn, không admin-only profiles.
- Admin Community Hub route yêu cầu `content:review` và ghi audit event.
- Creator profile có trust level: `new_member`, `active_contributor`, `trusted_creator`, `mentor_candidate`, `restricted_review`.
- Score không tính theo số lượng thô; có tín hiệu chất lượng và penalty report/takedown.
- `cashRewardAllowed` hard-disabled.
- Operating board có `communityHub` summary và workspace hiển thị Community/Creator Hub.

## Còn là seed/scaffold
- `data/creator-profiles.json` hiện là seed demo, có cảnh báo `not_real_user`/`seed_demo_profile` và không public profile.
- Leaderboard public có thể trống nếu chưa có creator đủ điều kiện. Đây là đúng an toàn.

## Verify đã chạy
- `node scripts/source-lint.mjs` — pass, `ok=true`, `aiFindings=[]`.
- `node scripts/validate-runtime-closure.mjs` — pass source-level, `runtimeReady=false`, `environmentBlocked=true`.
- `node scripts/run-runtime-verification-suite.mjs` — pass source-level, `localToolchainPresent=false`, không chạy runtime thật.
- `node scripts/validate-community-prestige-hub.mjs` — pass.
- `node scripts/smoke-batch65-community-hub-source.mjs` — pass.
- `node scripts/verify-batch65-source.mjs` — pass sau khi tạo `BATCH65_NOTES.md`.

## Chưa verify được
- `npm ci`
- `npm run typecheck`
- `npm run build`
- `npm run prisma:generate`
- live Next server HTTP smoke với session/cookie/CSRF thật

## Rủi ro còn lại
- Community Hub vẫn là JSON/source-level foundation, chưa có DB transaction.
- Chưa có UI quản trị creator profile đầy đủ.
- Chưa có Q&A/forum thread model thật.
- Chưa có anti-vote-ring runtime thật.
- Seed demo không được dùng làm marketing claim về cộng đồng thật.
