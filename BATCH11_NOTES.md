# Batch 11 Notes — rollout operations + verification backlog + membership hardening

## Cụm nâng cấp đã chọn
Không vá lẻ. Batch này kéo theo cụm vận hành:
1. **Pack rollout import runtime** để nạp coverage kỹ thuật theo registry thay vì dán manifest tay.
2. **Verification backlog** để nhìn đúng nợ dữ liệu học thuật thật.
3. **Membership hardening** để dùng nội bộ trường/tổ đỡ loạn hơn.
4. **Admin report/export** để lấy snapshot vận hành hiện tại.

## Audit ngắn
- Kiến trúc và workflow vẫn là điểm mạnh của repo.
- Nút thắt lớn nhất vẫn là **corpus verified thật**.
- Trước batch này, admin đã có manifest import nhưng vẫn thiếu:
  - import theo pack registry
  - backlog verification xuyên entity
  - report quản trị có thể tải ra
  - guard membership tránh trùng directory

## Những gì đã thêm
### 1) Pack rollout import
- Từ `subject-pack-registry` có thể preview/import theo:
  - `packIds`
  - hoặc `level / grade / subject / rolloutStage`
- Có route mới:
  - `POST /api/admin/content/packs`
- Có thể dry-run preview trước khi import thật.

### 2) Verification backlog
- Tính backlog thật trên các entity học thuật:
  - topics
  - programs
  - questions
  - rubrics
  - resources
- Gắn các loại issue chính:
  - còn `seed/demo`
  - reviewed/verified thiếu references
  - lifecycle `review/published` nhưng source vẫn `seed`
  - item đã đủ metadata để lên `reviewed` nhưng chưa đẩy workflow
- Trả ra tổng hợp theo entity và theo grade/subject.

### 3) Membership hardening
- Chặn tạo membership trùng:
  - cùng email
  - hoặc cùng tên trong đúng trường/tổ
- Khi đánh dấu `isPrimary`, tự hạ primary cũ trên các bản ghi cùng danh tính.
- Summary membership mở thêm `invited` và `inactive`.

### 4) Admin report/export
- Route mới:
  - `GET /api/admin/content/report`
- Trả snapshot JSON gồm:
  - overview
  - curriculum summary
  - verification queue
  - audit logs
  - import logs

## Verify đã làm
- `tsc --noEmit` pass sau khi sửa.
- Route và UI mới đã được nối type + compile.

## Chưa verify được trong artifact này
- `npm run dev`
- `next build`
- runtime DB/Prisma thật
- browser E2E thao tác admin panel

## Ghi chú trung thực
Batch 11 **không biến dữ liệu học thuật thành verified corpus**. Nó làm phần platform/admin/runtime rõ ràng hơn để đẩy những đợt nhập verified thật sau này mà không phải vá lại kiến trúc.
