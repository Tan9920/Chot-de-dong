# Batch 30 - pack curation operations + execution sync

## Trọng tâm
Hoàn thiện phần workflow khó còn dang dở sau batch29: chuyển pack curation từ chế độ xem summary/registry sang chế độ thao tác thật ở cấp pack.

## Những gì đã thêm
- API mới `GET/POST /api/admin/content/packs/curation-actions`
  - reviewer decision ở cấp pack
  - leader approval / revoke
  - admin approval / revoke
  - release recommendation (`hold`, `school_release_candidate`, `verified_release`)
- `contentManagement.getAcademicPackCurationDetail()` để trả pack-level detail gồm:
  - curation record/consensus
  - release snapshot
  - release manifest
  - queue items của chính pack đó
- Mutation pack curation trong `lib/pack-curation.ts`
  - tự revoke approval nếu consensus mới làm pack không còn hợp lệ
  - chặn leader/admin approval khi chưa đủ điều kiện
- Đồng bộ `pack-execution-registry` sau mỗi thao tác curation
  - `review_consensus`
  - `leader_approval`
  - `admin_approval`
  - `release_snapshot`
  - `export_guard`
- UI admin mới trong `components/content-admin.tsx`
  - chọn pack
  - xem blockers/queue items/snapshots
  - ghi reviewer decision
  - đổi release recommendation
  - ký/gỡ leader approval
  - ký/gỡ admin approval

## Giá trị thực tế
Batch này nối thêm một đoạn vận hành thật giữa:
- evidence review field-level
- curation pack-level
- execution workflow
- release manifest / export guard

Tức là governance không còn chỉ là đọc dashboard, mà đã có thêm lớp thao tác để đẩy pack đi qua approval chain thật hơn.
