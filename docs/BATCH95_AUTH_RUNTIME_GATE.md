# Batch95 — Auth Runtime Gate + Server-Side Save/Export Guard

## Mục tiêu

Batch95 biến yêu cầu “lưu bản nháp và xuất DOCX/PDF phải có tài khoản giáo viên thật” thành kiểm soát ở server route, không chỉ ở UI. Điều này quan trọng vì người dùng kỹ thuật có thể bỏ qua UI và gọi API trực tiếp.

## Phạm vi

Được phép với phiên xem thử:

- xem workspace;
- lấy CSRF để chạy preview;
- tạo khung bài dạy an toàn bằng template/rule-based flow;
- gửi feedback demo nếu route cho phép.

Bắt buộc có tài khoản thật có `authAccountId`:

- `POST /api/lessons` để lưu bản nháp;
- `POST /api/export/docx` để xuất DOCX;
- `POST /api/export/pdf` để xuất PDF.

## Quy tắc server-side mới

`requireRealAccountSession(actionLabel, request)` trả:

- `401` nếu chưa có phiên;
- `403` kèm `requiresRealAccount: true` nếu chỉ là phiên demo/xem thử không có `authAccountId`;
- `ok: true` nếu phiên gắn với tài khoản email/mật khẩu thật.

## Vì sao không chặn tạo khung bài?

Giai đoạn demo vẫn cần cho giáo viên xem thử giá trị sản phẩm trước khi đăng ký. Tạo khung bài là preview an toàn, không ghi dữ liệu dài hạn và không nên sinh kiến thức sâu khi dữ liệu chỉ là seed/scaffold/starter. Lưu và xuất mới là thao tác cần tài khoản/quota/audit.

## Điều không thay thế

Validator Batch95 không thay thế install/build/typecheck/live HTTP/browser smoke. Nó chỉ kiểm tra source markers và route contract ở mức code. Vẫn phải chạy test thật trên môi trường có dependencies và host thật trước khi mở demo rộng.

## Lệnh kiểm tra

```bash
node --check scripts/validate-batch95-auth-runtime-gate-source.mjs
node scripts/validate-batch95-auth-runtime-gate-source.mjs
npm run auth-runtime-gate:validate
npm run smoke:batch95
npm run verify:batch95
```

## Rủi ro còn lại

- JSON fallback auth/session không phải production auth.
- Serverless persistence có thể không bền.
- Chưa có email verification/reset password/lockout đầy đủ.
- Chưa có browser smoke thật cho đăng ký, đăng nhập, lưu, xuất, đăng xuất.
- Chưa có hosted URL smoke trên domain thật.
