# Batch110 Curriculum Matrix

Batch110 triển khai lát cắt source-level cho vấn đề chiến lược: ma trận lớp–môn–bộ sách–bài/chủ đề và các lỗi chọn sai đầu vào.

## Tầng dữ liệu mới
`data/curriculum-compatibility-matrix.json` phân biệt:

- `official_lesson` — bài học cụ thể trong registry nhưng chưa sinh sâu nếu chưa verified/release.
- `topic_strand` — mạch/chủ đề rộng, chưa chắc là tên bài thật trong sách.
- `review_lesson` — bài đã review nội bộ nhưng chưa đủ release chính thức.
- `supplementary_activity` — trò chơi/hoạt động/phiếu bổ trợ.
- `teacher_input` — giáo viên tự nhập, chỉ safe-frame.
- `legacy_reference` — Cánh Diều/Chân trời hoặc nguồn không phải trục chính, ẩn khỏi teacher flow.
- `unmapped` — tổ hợp chưa map hoặc bị chặn.

## Kết nối tri thức là trục chính
Luồng giáo viên thường chỉ hiện `ket_noi_tri_thuc`. Cánh Diều và Chân trời sáng tạo chưa bị xóa khỏi chiến lược, nhưng ở giai đoạn pilot bị ẩn để tránh phát sinh nhầm.

## Content-depth policy
`contentDepthAllowed` chỉ được true khi có đủ:

- `dataStatus` là `verified` hoặc `approved_for_release`;
- `recordType` là `official_lesson` hoặc `review_lesson`;
- có nguồn;
- có reviewer;
- release gate mở.

Trong Batch110 tất cả bản ghi vẫn safe-frame-only. Đây là lựa chọn cố ý để không tạo verified giả.

## Curriculum Gap Board
Admin route `/api/admin/curriculum-gap-board` cho biết bản ghi nào thiếu nguồn, thiếu reviewer, bị legacy/reference-only hoặc unmapped. Board này là source-level, không thay thế review chuyên môn thật.

## Không overclaim
Batch110 không chứng minh build/runtime/hosted. Cần chạy riêng install/build/live smoke/auth smoke/hosted smoke trước khi nói demo web đã pass.

## Cấm mặc định
Không thêm AI. Không tạo verified giả. Không claim hosted/runtime pass. Không mở marketplace tiền mặt/quỹ/referral nhiều tầng.
