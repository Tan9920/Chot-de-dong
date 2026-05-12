# Batch101 — No-AI Operating Runtime Foundation

Batch101 tiếp tục từ Batch100. Mục tiêu là thay stub quota `9999` bằng nền operating runtime có cấu hình gói, quota theo tháng, usage ledger và point ledger ở mức JSON demo/runtime foundation.

## Vì sao chọn batch này

Sau Batch100, UI/governance đã tốt hơn nhưng `lib/operating-runtime.ts` vẫn mở quota demo rất rộng. Điều này không phù hợp chiến lược Free dùng được thật, Pro/Team/School có quyền lợi rõ, export/lưu trữ có ledger, điểm cống hiến không quy đổi tiền mặt và không bật payment sớm.

## Thay đổi chính

- Thêm `data/operating-plan-config.json` với 4 plan source-level: Free Cộng Đồng, Giáo viên Pro demo, Tổ chuyên môn demo, Trường học demo.
- Thêm `data/usage-ledger.json` và `data/point-ledger.json`, khởi tạo `[]` để không đóng gói dữ liệu runtime nhạy cảm.
- Viết lại `lib/operating-runtime.ts`:
  - `resolveOperatingPlan()` chọn plan theo role/override.
  - `assertOperatingUsageAllowed()` kiểm quota tháng theo action.
  - `assertSavedLessonQuota()` dùng quota `save_lesson`.
  - `recordOperatingUsage()` ghi ledger JSON với memory fallback nếu host không cho ghi file.
  - `buildOperatingEntitlementSnapshot()` trả quyền lợi/usage hiện tại cho `/api/operating/usage`.
  - `applyOperatingExportPolicy()` gắn snapshot policy export vào payload, không thay compliance packet.
- Nâng `lib/product-operating.ts` để dựng board từ config thật thay vì plan demo 9999.
- Thêm validator `scripts/validate-batch101-operating-runtime-source.mjs`.
- Thêm scripts `batch101:operating-runtime-validate`, `operating:runtime-validate`, `smoke:batch101`, `verify:batch101`.
- Nâng version package/lock lên `0.101.0` và mở validators Batch89–100 cho Batch101 compatibility.

## Không làm trong Batch101

- Không thêm AI/model/API key/SDK.
- Không thêm payment thật.
- Không thêm marketplace tiền mặt.
- Không thêm quỹ tiền mặt.
- Không thêm referral nhiều tầng.
- Không quy đổi điểm thành tiền mặt.
- Không tạo dữ liệu verified/reviewed/approved_for_release giả.
- Không claim production-ready nếu chưa có install/build/runtime/hosted/browser smoke thật.

## Lệnh source-level

```bash
npm run batch101:operating-runtime-validate
npm run smoke:batch101
```

## Runtime/build vẫn phải verify riêng

```bash
npm run install:clean
npm run next:swc-ready
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://your-demo-domain npm run hosted:url-smoke
```

Batch101 **không claim production-ready** nếu các lệnh trên chưa pass thật.

## Rủi ro còn lại

- Ledger JSON chỉ là demo/runtime foundation; production cần database, migration, locking, backup, audit log và xử lý tranh chấp quota.
- Quota theo role là tạm; bản thật cần plan assignment/subscription riêng, không cho user tự nâng role để tăng quota.
- Điểm cống hiến chỉ có policy/config và ledger rỗng; chưa có workflow đổi điểm runtime.
- Export policy snapshot chưa thay thế compliance packet, release dossier hoặc kiểm nguồn học thuật.
- Serverless có thể không ghi được `data/*.json`; code có fallback memory nhưng không bền qua cold start.
