# Batch96 Deep Auth/Membership Hardening

Batch96 tập trung sửa lỗi bảo mật/logic sau Batch95. Batch95 đã khóa save/export bằng tài khoản thật ở server route; Batch96 tiếp tục khóa phần role elevation và invite/membership.

## Chính sách quyền
- Đăng ký public mặc định là `teacher`.
- Login public không được tự chọn `admin` hoặc `leader` qua body role.
- Quyền `leader`/`admin` chỉ đến từ:
  - membership đã được admin tạo trong store; hoặc
  - invite thật đã được tạo trong `/api/admin/membership-invites`, còn active, chưa hết hạn, chưa redeem/revoke.
- Mã có dạng `trusted-*` không còn tự động cấp quyền.

## Demo JSON stores
- `data/memberships.json`
- `data/membership-invites.json`

Đây là demo store để test luồng. Không được hiểu là production auth/database.

## Những lỗi đã sửa
1. `createMembershipInvite()` trước đó trả object trực tiếp nhưng route đọc `result.invite.id`, có thể gây runtime lỗi.
2. `redeemMembershipInvite()` trước đó có thể suy role từ prefix mã, dẫn tới rủi ro tự nâng quyền.
3. `resolveMembershipForLogin()` trước đó có thể phụ thuộc `requestedRole` + `trusted-*`; Batch96 mặc định teacher nếu không có invite/membership thật.
4. `assertLessonPermission(user, 'content:manage')` trước đó dễ trả false nếu không truyền lesson object; Batch96 tách global permission namespace.
5. `registry:diagnose` trước đó có thể treo trong môi trường DNS lỗi; Batch96 tách probe sang child process có timeout.

## Cách kiểm tra source-level
```bash
npm run auth-membership-hardening:validate
npm run source:validate
npm run registry:diagnose
```

## Cần kiểm tra runtime trên host thật
```bash
npm run install:clean
npm run next:swc-ready
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
GIAOAN_DEMO_URL=https://your-domain.vercel.app npm run hosted:url-smoke
```

## Không overclaim
Batch96 không chứng minh production-ready. Nó chỉ nâng bảo mật source-level và giảm rủi ro role escalation trước khi chạy runtime/browser smoke.
