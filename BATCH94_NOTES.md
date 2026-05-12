# BATCH94_NOTES — Visible Account Gate + Teacher-Friendly Auth UX

## Lý do chọn batch

Phản hồi demo mới chỉ ra lỗi sản phẩm thật: giáo viên vào web/test demo không thấy rõ phần đăng ký/đăng nhập. Trong repo đã có API auth, session, CSRF, register/login/logout, nhưng UI workspace không đưa phần này ra vị trí dễ thấy. Điều này làm yếu khả năng kiểm soát quota, lưu nháp, export, phân quyền giáo viên/tổ trưởng/admin và bảo vệ dữ liệu người dùng.

Batch94 không thêm feature học thuật mới. Batch này đưa auth gate ra UI giáo viên và khóa hành vi quan trọng ở mức UI: có thể xem thử khung bài, nhưng lưu bản nháp/xuất file cần tài khoản giáo viên thật.

## Thay đổi chính

- Hiển thị khối **Tài khoản giáo viên** ngay đầu workspace.
- Thêm form đăng nhập/đăng ký trong `components/workspace.tsx`.
- Dùng sẵn API:
  - `GET /api/auth/me`.
  - `POST /api/auth/register`.
  - `POST /api/auth/login`.
  - `POST /api/auth/logout`.
- Đăng ký mặc định là teacher; không cho tự chọn admin/tổ trưởng.
- Mã mời tổ/trường được giữ như đường hợp lệ để cấp quyền cao hơn nếu backend membership/invite cho phép.
- UI phân biệt:
  - Chưa đăng nhập.
  - Phiên xem thử/demo.
  - Tài khoản thật có `authAccountId`.
- UI yêu cầu tài khoản thật trước khi:
  - lưu bản nháp lên demo;
  - xuất DOCX/PDF.
- Vẫn cho xem thử/tạo khung bài để giáo viên hiểu sản phẩm trước khi đăng ký.
- Cập nhật README/package version lên 0.94.0.
- Thêm validator `scripts/validate-batch94-auth-gate-source.mjs`.

## Điều không làm

- Không thêm AI/API AI/model SDK.
- Không thêm thanh toán thật.
- Không thêm marketplace/quỹ/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không biến JSON fallback auth thành production auth hoàn chỉnh.
- Không public cộng đồng rộng.

## Verify source-level đã chạy

Các lệnh cần chạy và ghi nhận ở post-batch audit:

```bash
node --check scripts/validate-batch94-auth-gate-source.mjs
node scripts/validate-batch94-auth-gate-source.mjs
node scripts/run-source-validators.mjs
node scripts/hosted-demo-preflight.mjs
node scripts/assert-artifact-hygiene.mjs
```

## Chưa chứng minh runtime thật

Batch94 vẫn cần chạy trên môi trường có dependencies đầy đủ:

- `npm ci --ignore-scripts --no-audit --no-fund`.
- `npm run typecheck`.
- `npm run build` hoặc `npm run build:clean`.
- Browser test đăng ký, đăng nhập, đăng xuất.
- Lưu bản nháp sau đăng nhập.
- Xuất DOCX/PDF sau đăng nhập.
- Hosted URL smoke.

## Rủi ro còn lại

- JSON fallback auth/session không phù hợp production thật nếu chưa có DB, backup, email verification, reset password, lockout, audit mạnh.
- Trên Vercel/serverless, ghi `data/auth-accounts.json` hoặc `data/auth-sessions.json` có thể fallback memory/không bền.
- UI auth source-level chưa thay thế test mobile thật.
- API auth cần runtime smoke thật với cookie/CSRF/same-origin.
- Quyền admin/tổ trưởng vẫn phải được test bằng invite/membership thật trước khi mở team/school.

Ghi chú source-level: save/export đã có UI gate yêu cầu tài khoản thật.
