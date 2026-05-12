# Batch135 — Plan Bridge UI Guardrails

## Mục tiêu
Batch135 kiểm tra và làm cứng phần UI/tính năng vừa port từ file kế hoạch ở Batch134. Phạm vi là **source-level UI hardening**, không phải backend production.

## Vì sao chọn batch này
Batch134 đã thêm Lịch tuần, Học liệu, Cộng đồng, Kiểm duyệt, Legal Gate và Release Gate. Rủi ro còn lại là một số nút nhìn giống đã có backend thật: lưu học liệu, chèn học liệu, duyệt cộng đồng, takedown, lưu ghi chú tuần. Batch135 biến các nút đó thành hành động có guardrail/notice rõ ràng hoặc prefill an toàn, tránh overclaim.

## Đã làm
- Lịch tuần: click bài mẫu sẽ prefill form soạn bài và ghi rõ dữ liệu là UI sample.
- Học liệu: thêm `sourceName`, `license`, `reviewState`, `canInsert`; mẫu thiếu license bị chặn chèn.
- Kiểm duyệt: thêm `licenseStatus`, `studentDataRisk`, `auditRequired`; duyệt high-risk bị chặn ở UI.
- Release Gate: đọc `/api/runtime/public-rollout-readiness` nếu có, không chỉ dùng danh sách tĩnh.
- Thêm `data/plan-bridge-ui-guardrails.json` và validator Batch135.

## Không làm
- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không public/takedown tài nguyên thật.
- Không cấp role moderator/admin từ UI.

## Cần làm sau
Backend thật cho weekly schedule, resource save/report, moderation audit log, role-based moderator console và hosted/public proof.
