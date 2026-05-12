# BATCH101 OPERATING RUNTIME FOUNDATION

Batch101 bổ sung nền vận hành không-AI cho giai đoạn đầu: cấu hình gói, quota tháng, usage ledger, point ledger và entitlement snapshot.

## Mục tiêu sản phẩm

Sản phẩm không bán AI trong giai đoạn đầu. Giá trị trả phí đến từ lưu trữ, export DOCX/PDF, phiếu/slide từ mẫu, versioning, workflow tổ/trường và cộng đồng có kiểm duyệt. Vì vậy hệ thống cần quota/ledger rõ ràng ngay cả khi chưa bật thanh toán thật.

## Những gì đã có trong source

- `data/operating-plan-config.json` lưu plan Free/Pro/Team/School demo, action quota và guardrail.
- `data/usage-ledger.json` lưu usage event, khởi tạo rỗng khi đóng gói.
- `data/point-ledger.json` khởi tạo rỗng cho Điểm Cống hiến, không quy đổi tiền mặt.
- `lib/operating-runtime.ts` có runtime helpers:
  - `assertOperatingUsageAllowed`
  - `recordOperatingUsage`
  - `assertSavedLessonQuota`
  - `buildOperatingEntitlementSnapshot`
  - `applyOperatingExportPolicy`
- `/api/operating/usage` đọc entitlement snapshot.
- `/api/operating/foundation` đọc operating board.
- Save lesson và export DOCX/PDF đã gọi quota/usage helpers từ các batch trước; Batch101 làm helper thật hơn thay vì trả quota `9999`.

## Guardrails

- Không bật payment thật.
- Không bật marketplace tiền mặt.
- Không bật quỹ tiền mặt.
- Không bật referral nhiều tầng.
- Không dùng điểm để trả tiền mặt.
- Không bán token/lượt AI.
- Không làm cho dữ liệu seed/scaffold thành verified.
- Export vẫn phải giữ nhãn dữ liệu và cảnh báo giáo viên kiểm tra.

## Giới hạn thật

Đây **không phải billing production**. JSON ledger không đủ cho triển khai trường/trả phí thật vì thiếu database transaction, locking, audit log production, backup, dispute handling và chống abuse đầy đủ.

## Kiểm tra

```bash
npm run batch101:operating-runtime-validate
npm run smoke:batch101
```

Các lệnh này chỉ chứng minh source-level. Muốn kết luận runtime cần chạy install/build/live smoke/hosted smoke/browser QA.
