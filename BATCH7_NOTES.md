# Batch 7 — membership directory + content moderation workflow

## Cụm nâng cấp
- Membership directory cho trường / tổ
- Login bám membership active thay vì chỉ chọn vai trò tay
- Content moderation history riêng cho topic/program/question/rubric/resource/template
- Publish nội dung cần review approved hợp lệ sau lần submit gần nhất
- API admin mới cho membership và content review

## Điểm chính
- Thêm `OrgMembership` và `ContentReviewRecord` trong Prisma schema
- Thêm local fallback: `data/memberships.json`, `data/content-reviews.json`
- Thêm service:
  - `lib/membership.ts`
  - `lib/content-reviews.ts`
- Thêm API:
  - `GET|POST|DELETE /api/admin/memberships`
  - `GET|POST /api/admin/content/:entity/reviews`
- Workspace quản trị nội dung nay có thêm:
  - moderation panel
  - membership directory panel

## Verify đã chạy
- `npm run typecheck` pass
- verify runtime logic bằng compiled JS tạm:
  - login role leader không có membership => auto-provision teacher
  - sau khi nâng membership thành leader => login resolve đúng leader
  - publish content trước review => bị chặn
  - review approved xong => publish thành công
