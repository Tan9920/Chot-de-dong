# BATCH94 VISIBLE ACCOUNT GATE

Batch94 đưa đăng nhập/đăng ký ra mặt trước của workspace để giáo viên test demo hiểu rõ: tài khoản không chỉ để “cho có”, mà là lớp kiểm soát bản nháp, quota export, vai trò, quyền tổ/trường và bảo vệ dữ liệu.

## Source-level behavior

- `components/workspace.tsx` hiển thị khối **Tài khoản giáo viên** ngay hero/top section.
- `GET /api/auth/me` được gọi khi boot để biết trạng thái phiên hiện tại.
- `POST /api/auth/register` tạo real teacher account bằng email/password.
- `POST /api/auth/login` đăng nhập real teacher account.
- `POST /api/auth/logout` đăng xuất có CSRF protection.
- `saveDraft()` và `exportLesson()` gọi `requireRealAccountForAction()` trước khi lưu/xuất.
- Nếu người dùng chỉ có anonymous/demo session, UI vẫn cho xem thử khung bài nhưng yêu cầu đăng nhập/đăng ký trước khi save/export.

## Role policy

- Người dùng không tự chọn admin/tổ trưởng khi đăng ký.
- Đăng ký thường cấp quyền teacher.
- Quyền cao hơn chỉ được cấp qua invite/membership hợp lệ hoặc quy trình admin/reviewer.
- Đây là hướng an toàn hơn cho team/school vì tránh người dùng tự nâng quyền khi đăng ký.

## Why this matters

Visible auth gate giúp:

- kiểm soát quota xuất DOCX/PDF;
- gắn bản nháp với người dùng thật;
- chuẩn bị cho point ledger/badge/creator profile;
- bảo vệ dữ liệu giáo viên;
- hạn chế abuse khi cộng đồng/học liệu mở rộng;
- tránh demo trông như app public không cần tài khoản.

## Limitations

This is source-level only. It does not prove:

- npm install success;
- Next build success;
- browser runtime login/register success;
- server write persistence on hosted demo;
- production CSRF/cookie behavior;
- hosted URL smoke;
- mobile QA.

Production auth still needs database persistence, account verification, password reset, lockout policy, backup, privacy terms, and stronger audit logging.
