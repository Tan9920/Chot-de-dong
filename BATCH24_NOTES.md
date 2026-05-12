# Batch 24 — compliance snapshot + persisted ledger scaffold

## Trọng tâm
- Thêm compliance report theo pack và toàn cục.
- Gắn compliance vào release snapshot/export guard.
- Thêm materialization cho evidence ledger scaffold để từ runtime-only chuyển thành persisted record phục vụ audit.

## Điểm chính
- `PackReleaseSnapshot` giờ có `complianceReport`.
- Export guard không còn chỉ nói chung chung; lý do guard lấy từ compliance snapshot.
- Có route/script để preview/apply materialize evidence ledger theo pack hoặc grade.
- Có thể dùng compliance summary để nhìn pack nào mới chỉ đạt nội bộ, pack nào còn blocker bản quyền/citation/evidence.

## Lưu ý
- Materialized ledger records mặc định vẫn ở trạng thái scaffold/pending nếu pack chưa reviewed/verified.
- Batch này không tự ý nâng trạng thái học thuật của dữ liệu.
