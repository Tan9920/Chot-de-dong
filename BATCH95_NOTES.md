# BATCH95_NOTES — Auth Runtime Gate + Server-Side Save/Export Guard

## Lý do chọn batch

Batch94 đã đưa khối **Tài khoản giáo viên** ra đầu workspace và chặn lưu/xuất ở mức UI. Khi audit code thật sau Batch94, rủi ro còn lại là các route server vẫn chỉ yêu cầu một phiên hoạt động. Do `/api/auth/csrf` có thể bootstrap phiên xem thử để giáo viên tạo khung bài, một người dùng kỹ thuật có thể gọi trực tiếp route lưu/xuất bằng phiên demo nếu server không kiểm `authAccountId`.

Batch95 không thêm AI, không thêm tính năng học thuật mới và không mở thanh toán/cộng đồng public. Batch này chuyển ràng buộc quan trọng từ **UI-only gate** sang **server-side real account gate** cho những thao tác có dữ liệu/quota: lưu bản nháp và xuất DOCX/PDF.

## Thay đổi chính

- Thêm `requireRealAccountSession()` trong `lib/runtime-security.ts`.
- Hàm mới phân biệt: chưa có phiên trả `401`; phiên xem thử/demo không có `authAccountId` trả `403`, `requiresRealAccount: true`; tài khoản email/mật khẩu thật có `authAccountId` được đi tiếp.
- `POST /api/lessons` dùng `requireRealAccountSession('lưu bản nháp lên demo', request)` trước khi quota/save.
- `POST /api/export/docx` dùng `requireRealAccountSession('xuất DOCX', request)` trước khi export/quota.
- `POST /api/export/pdf` dùng `requireRealAccountSession('xuất PDF', request)` trước khi export/quota.
- Giữ nguyên khả năng xem thử/tạo khung bài qua `/api/template-builder`; đây là preview an toàn, không phải lưu/xuất.
- Thêm validator `scripts/validate-batch95-auth-runtime-gate-source.mjs`.
- Cập nhật `package.json`/`package-lock.json` version `0.95.0` và script `auth-runtime-gate:validate`, `smoke:batch95`, `verify:batch95`.

## Điều không làm

- Không thêm AI/API AI/model SDK/API key.
- Không thêm thanh toán thật.
- Không thêm marketplace/quỹ/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không biến JSON fallback auth/session thành production auth hoàn chỉnh.
- Không public cộng đồng rộng.
- Không thay browser/runtime smoke thật bằng validator source-level.

## Verify source-level cần chạy

```bash
node --check scripts/validate-batch95-auth-runtime-gate-source.mjs
node scripts/validate-batch95-auth-runtime-gate-source.mjs
node scripts/validate-json-data.mjs
node scripts/validate-internal-imports.mjs
node scripts/run-source-validators.mjs
npm run auth-runtime-gate:validate
```

## Runtime/build vẫn cần chứng minh

Batch95 mới gia cố source-level/server-route contract. Vẫn chưa được claim production-ready nếu chưa chạy được:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run next:swc-ready
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
npm run verify:batch95
```

## Browser smoke nên test thật

1. Mở trang chủ.
2. Bấm thiết kế bài dạy khi chưa đăng nhập: vẫn được tạo khung an toàn.
3. Chưa đăng nhập mà bấm lưu/xuất: UI yêu cầu tài khoản.
4. Gọi trực tiếp `/api/auth/csrf`, rồi gọi `POST /api/lessons`: server phải trả `403 requiresRealAccount` nếu chỉ là phiên demo.
5. Gọi trực tiếp `POST /api/export/docx` và `POST /api/export/pdf`: server phải trả `403 requiresRealAccount` nếu chỉ là phiên demo.
6. Đăng ký tài khoản giáo viên thật.
7. Lưu bản nháp sau đăng nhập.
8. Xuất DOCX/PDF sau đăng nhập.
9. Đăng xuất rồi thử lại lưu/xuất: bị chặn.
10. Kiểm file export thật: font, bố cục, nhãn dữ liệu, compliance packet.

## Rủi ro còn lại

- Dependency install/build/typecheck/live smoke chưa chứng minh trong môi trường này nếu registry npm không truy cập được.
- JSON fallback auth/session vẫn không phù hợp production nếu thiếu DB, email verification, reset password, lockout, audit log, backup và chính sách dữ liệu cá nhân.
- Ghi `data/auth-accounts.json`, `data/auth-sessions.json`, `data/saved-lessons.json` có thể không bền trên serverless.
- Cần test browser thật để bảo đảm cookie/CSRF/session hoạt động như kỳ vọng.
- Cần test hosted domain thật trước khi mời giáo viên dùng thử.
- Dữ liệu học thuật vẫn starter/developing; không được claim verified/chuẩn Bộ/đúng 100%.
