# Batch100 — UX/Governance Polish

Batch100 tiếp tục từ nhánh `b_XWG` và baseline Batch98, tập trung nâng cấp UI/UX an toàn cho giáo viên mà không thêm feature rủi ro.

## Mục tiêu

- Giữ giao diện app-like đẹp hơn của `b_XWG`.
- Khôi phục/giữ auth guard: **Tài khoản giáo viên**, **Đăng nhập để lưu và xuất an toàn**, **Mã mời tổ/trường nếu có**, **Không cho tự chọn admin/tổ trưởng khi đăng ký**, **Phiên này chỉ để xem thử**.
- Sửa mobile menu/sidebar có nút đóng, backdrop bấm ra ngoài, phím Escape và khóa scroll nền khi mở menu.
- Thêm `teacher-safe-flow-banner` để giáo viên thấy trạng thái dữ liệu bằng ngôn ngữ dễ hiểu.
- Thêm `guided-progress-card` / “Đi bước tiếp theo” để giảm lạc luồng trên mobile/desktop.
- Đưa chọn chế độ **Dễ dùng / Tiêu chuẩn / Nâng cao** lên header và mobile drawer.
- Thêm `disableExportUntilContent` để không hiển thị affordance xuất file rỗng như một thao tác hợp lệ.
- Reset runtime-sensitive demo data trước khi đóng gói.

## Không làm trong Batch100

- Không thêm AI/model/API key/SDK.
- Không thêm payment thật, marketplace tiền mặt, quỹ tiền mặt hoặc referral nhiều tầng.
- Không tạo dữ liệu reviewed/verified/approved_for_release giả.
- Không mở cộng đồng public tự do.
- Không claim production-ready nếu chưa có install/build/runtime/hosted/browser smoke thật.

## Source-level validator

```bash
npm run batch100:ux-governance-polish-validate
npm run smoke:batch100
```

## Runtime/build chưa được chứng minh chỉ bằng Batch100

Cần chạy tiếp trên môi trường sạch/host thật:

```bash
npm run install:clean
npm run next:swc-ready
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
```

Batch100 **không claim production-ready** nếu các lệnh trên chưa pass thật.
