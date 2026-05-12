# Batch98 Dependency/Build Closure + Real Auth Runtime Smoke Hardening

## Vấn đề Batch98 xử lý

Sau Batch95/96, save/export đã yêu cầu tài khoản thật. Vì vậy smoke cũ nếu gọi export trực tiếp bằng session ẩn danh là không còn đúng. Batch98 chỉnh smoke để phản ánh đúng đường đi thật của giáo viên:

1. Mở app hoặc API.
2. Lấy CSRF.
3. Đăng ký tài khoản giáo viên thật.
4. Xác nhận `/api/auth/me` có user và `authAccountId`.
5. Lưu giáo án.
6. Xuất DOCX/PDF bằng saved `lessonId`.

## Runtime closure report

`npm run runtime:closure-report` tạo báo cáo ở:

```text
artifacts/runtime-closure-report-last-run.json
```

Báo cáo này phân biệt:

- source validation pass;
- registry có reachable hay không;
- dependency đã có Next binary và SWC hay chưa;
- `.next/BUILD_ID` đã có hay chưa;
- có được phép claim runtime/build/deploy pass hay không.

## Auth invite runtime smoke

`npm run auth-invite:runtime-smoke` dùng temp JSON store để tránh làm bẩn data thật. Nó kiểm:

- admin seeded membership tạo được admin session qua account thật;
- admin tạo leader invite;
- leader redeem invite đúng 1 lần;
- invite đã redeemed không dùng lại được để nâng quyền;
- invite revoked/expired không nâng quyền;
- login gửi `role=admin` không tự nâng role.

## Giới hạn

Batch98 vẫn chưa phải production hardening hoàn chỉnh. JSON store vẫn là demo/fallback. Production cần database, email verification, reset password, lockout, audit log đầy đủ, backup, privacy/terms và browser/mobile QA thật.
