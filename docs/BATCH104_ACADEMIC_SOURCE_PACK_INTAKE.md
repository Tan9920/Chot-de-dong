# Batch104 Academic Source Pack Intake & Review Gate Foundation

Batch104 đi theo hướng đúng sau Batch103: không làm đẹp số liệu verified bằng cách sửa nhãn, mà tạo quy trình nhập-duyệt nguồn trước.

## Mục tiêu

- Tạo policy source pack intake cho dữ liệu học thuật 1–12.
- Bắt buộc metadata nguồn, license, attribution, permission basis, short excerpt policy, takedown contact, reviewer signoff, approved references, legal check và export compliance label.
- Tạo API public/admin để xem intake board và đánh giá dry-run một source pack.
- Giữ nguyên registry Batch103: không bật `contentDepthAllowed`, không nâng seed/developing thành reviewed/verified giả.

## File chính

- `data/academic-source-intake-policy.json`
- `data/academic-source-pack-submissions.json`
- `lib/academic-source-intake.ts`
- `/api/academic/source-intake`
- `/api/admin/academic-source-intake-board`
- `scripts/validate-batch104-academic-source-intake-source.mjs`

## Điều không được claim

- Không nói Batch104 đã có dữ liệu verified 1–12.
- Không nói source pack draft là nguồn hợp pháp thật.
- Không nói có thể sinh kiến thức sâu, câu hỏi/đáp án/Casio nếu chưa có review thật.
- Không nói production-ready nếu install/build/runtime/hosted smoke chưa pass.

## Hướng sau Batch104

Khi có bằng chứng thật từ giáo viên/reviewer/legal source, Batch105 mới nên là `First Reviewed Scope Release Dossier`: chọn rất ít scope, cập nhật registry có audit log/rollback, và vẫn không nhảy thẳng lên verified nếu mới chỉ reviewed/foundation.
