# BATCH96 — Deep Auth/Membership Hardening + Fail-Fast Registry Diagnostics

## Mục tiêu
Batch96 không thêm AI, không thêm thanh toán, không mở marketplace/quỹ/cộng đồng public. Mục tiêu là sửa các lỗi sâu còn lại sau Batch95:

1. Không để người dùng tự nâng quyền admin/tổ trưởng bằng role client-side hoặc mã `trusted-*` tự đặt.
2. Sửa contract runtime của admin membership invite route: `createMembershipInvite()` trả `{ ok, invite }` và route phải dùng đúng shape này.
3. Tạo demo JSON store cho `memberships` và `membership-invites`, có trạng thái active/redeemed/revoked/expired.
4. Sửa permission namespace để các route content/admin không bị lỗi logic khi không có lesson object.
5. Sửa `registry:diagnose` theo hướng process-isolated fail-fast để tránh treo ở DNS/registry.

## Thay đổi chính
- `lib/membership.ts`: thêm JSON-backed demo membership store, role resolver không còn tin `requestedRole`; tài khoản public mặc định teacher.
- `lib/membership-invites.ts`: thêm JSON-backed invite store, chỉ redeem mã mời đã được admin tạo, active, chưa hết hạn/chưa redeem/chưa revoke; không còn role escalation bằng prefix `trusted-*`.
- `app/api/auth/login/route.ts`: login chỉ dùng teacher nếu không redeem invite thật; trả notice khi client cố tự chọn admin/leader.
- `app/api/admin/membership-invites/route.ts`: sửa route contract, truyền request vào permission guard, lọc danh sách invite và log audit đúng `result.invite`.
- `app/api/admin/memberships/route.ts`: truyền request vào permission guard để session/cookie đọc nhất quán.
- `lib/access.ts`: thêm global permission namespace cho content/review flows khi không có lesson object, nhưng vẫn giữ membership/admin-only hẹp.
- `scripts/check-registry-network.mjs`: tách DNS/fetch probe sang child process, có hard timeout và không claim install/build nếu registry fail.
- `scripts/validate-batch96-deep-auth-membership-hardening-source.mjs`: validator Batch96.
- `data/memberships.json`, `data/membership-invites.json`: seed rỗng cho demo store.

## Source-level đã chứng minh
- Không còn `trusted-admin-*`/`trusted-leader-*` auto-elevate trong `lib/membership-invites.ts` hoặc `app/api/auth/login/route.ts`.
- Login không dùng `requestedRole` để tự cấp quyền.
- Invite route dùng đúng `result.invite.id`.
- Permission namespace content không còn phụ thuộc bắt buộc vào lesson object.
- Registry diagnose fail nhanh khi DNS/registry lỗi thay vì treo lâu.

## Chưa chứng minh runtime
- Chưa có `npm ci` pass trong môi trường container này vì registry npm lỗi DNS `EAI_AGAIN`.
- Chưa có `typecheck` pass.
- Chưa có `build` pass.
- Chưa có browser smoke đăng ký/login/redeem invite/lưu/xuất.
- Chưa có hosted URL smoke domain thật.

## Rủi ro còn lại
- JSON store membership/invite chỉ là demo foundation, chưa thay thế database production.
- Mã mời production cần email verification, expiry policy, audit đầy đủ, chống brute-force, rate-limit sâu hơn và backup.
- Nếu deploy serverless, ghi JSON có thể không bền; cần DB trước khi mở test rộng.
