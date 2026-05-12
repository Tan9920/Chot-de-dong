# Batch43 — 1–12 Coverage Truth Audit & Bias Reduction

## Mục tiêu

Batch43 không thêm AI, không thêm thanh toán thật và không tạo dữ liệu verified giả. Mục tiêu là tách rõ:

- coverage bề mặt: subject slot có seed/scaffold hay chưa;
- readiness thật: có nguồn reviewed/verified, release tier, support level, asset set và khả năng vận hành hay chưa;
- bias lớp 6/THCS: dữ liệu lớp 6 dày hơn và saved lesson seed đang nghiêng Lớp 6.

## Thay đổi chính

- Thêm `lib/coverage-truth.ts` để chấm điểm truth readiness theo từng scope/lớp/toàn hệ.
- Thêm API `/api/coverage-truth` trả về coverage truth report.
- Metadata `/api/metadata` trả thêm `summary.coverageTruth`.
- Roadmap giờ có `surfaceCoveragePercent` và `truthReadinessPercent`; `readinessPercent` được giữ backward-compatible nhưng trỏ về truth readiness thay vì coverage bề mặt.
- Operating board dùng truth readiness để cảnh báo khoảng cách giữa coverage 100% bề mặt và readiness thật.
- UI workspace hiển thị coverage truth, priority actions và cảnh báo bias lớp 6.
- Thêm validation script `coverage:truth-validate`.

## Kết quả audit hiện tại

- Surface coverage: 100% subject slot theo roadmap starter có seed/scaffold.
- Truth readiness: khoảng 29% vì toàn bộ subject slot vẫn là seed/demo.
- Verified subject slots: 0.
- Operational subject slots: 0.
- Saved lessons seed nghiêng Lớp 6: 100%.

## Nguyên tắc giữ an toàn

- Không tự nâng seed thành reviewed/verified.
- Không quảng cáo coverage bề mặt như readiness dạy học.
- Không lấy lớp 6 làm đại diện cho toàn hệ 1–12.
- Không thêm nội dung SGK dài hoặc nguồn bản quyền.
