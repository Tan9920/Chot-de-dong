# BATCH135 NOTES — Plan Bridge UI Guardrails

Batch135 sửa các thiếu sót/rủi ro từ phần vừa thêm ở Batch134:

- Các nút source-level không còn im lặng hoặc gây hiểu nhầm là đã ghi backend thật.
- Lịch tuần chỉ prefill composer từ dữ liệu mẫu và hiện notice.
- Học liệu có metadata nguồn/license/reviewState/canInsert; mẫu chưa đủ quyền bị chặn chèn.
- Kiểm duyệt high-risk/license unknown/student-data-risk không được duyệt ở UI; mọi action chỉ là notice cho tới khi có backend audit.
- Release Gate đọc API readiness thay vì chỉ hiển thị danh sách tĩnh.

Giới hạn:
- Không thêm AI/API AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không auto-public community.
- Không gọi production-ready.

Verify chính:
- `npm run batch135:plan-bridge-hardening-validate`
- `npm run smoke:batch135`
- `npm run verify:batch135`
