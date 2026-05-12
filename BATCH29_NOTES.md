# BATCH29 NOTES

## Chủ đề batch
Operational evidence review workflow completion.

## Mục tiêu
- Hoàn thiện phần evidence review còn khó: từ chỗ chỉ có summary/workbench sang chỗ có thể thao tác reviewer decision và leader approval thật.
- Siết logic consensus để không thể đạt ngưỡng chỉ bằng cách một reviewer bấm approved nhiều lần.
- Giữ audit trail của từng decision event, nhưng tính readiness dựa trên **quyết định mới nhất của từng reviewer**.

## Điểm thay đổi chính
1. Thêm API thao tác field evidence review:
   - `GET /api/admin/content/packs/evidence-review-actions`
   - `POST /api/admin/content/packs/evidence-review-actions`
2. Thêm mutation backend cho:
   - ghi reviewer decision
   - ký leader approval
   - gỡ leader approval
3. Khi có reviewer decision mới làm field không còn clean consensus, leader approval cũ sẽ tự bị gỡ.
4. Consensus hiện tính theo **snapshot quyết định mới nhất của mỗi reviewer**, tránh việc cùng một người tạo nhiều lượt approved để qua ngưỡng 2 approvals.
5. Content admin panel có thêm màn thao tác trực tiếp cho từng field trong workbench.

## Ý nghĩa kiến trúc
Batch này hoàn thiện một mắt xích khó nhưng quan trọng:
- Evidence ledger trả lời: field nào đang map nguồn nào.
- Evidence review trả lời: con người đã review/đồng thuận field đó đến đâu.
- Leader approval trả lời: field đó đã qua lớp ký duyệt nội bộ hay chưa.

Nhờ vậy, verified/release gating bớt bị treo ở trạng thái “có dashboard nhưng chưa có workflow thao tác thật”.

## Verify đã làm
- `tsc --noEmit` pass.

## Chưa verify được trong container này
- `npm run data:validate` vì môi trường không có `tsx` cài sẵn.
- `npm run build` end-to-end vì chưa cài dependency runtime đầy đủ trong container hiện tại.
