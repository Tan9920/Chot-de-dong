# Batch 6 Notes — governance nội bộ trường/tổ + content lifecycle

## Trọng tâm nâng cấp
- Thêm ngữ cảnh tổ chức vào session user, lesson plan và school settings.
- Thêm scope giáo án: `private | department | school`.
- Thêm lifecycle cho kho nội dung: `draft | review | published | archived`.
- Thêm visibility cho kho nội dung: `system | school | department`.
- Siết lại dashboard, library, review/approve theo cùng trường/tổ.
- Thêm admin lifecycle route để chuyển trạng thái nội dung mà không sửa tay JSON.

## Phần chính đã sửa
- Prisma schema mở rộng cho org scope và content governance.
- `lib/governance.ts` thêm helper chuẩn hóa org, visibility và lifecycle.
- `lib/storage.ts` org-aware cho session, lesson, dashboard, search.
- `lib/content-management.ts` org-aware CRUD + lifecycle publish/archive.
- `lib/content-repository.ts` chỉ trả về nội dung `published` và đúng scope đối với user hiện hành.
- Workspace thêm login theo trường/tổ và settings mới cho review scope / default content scope.

## Verify đã chạy
- `npm run typecheck` pass.
- Script verify trực tiếp đã kiểm:
  - leader cùng tổ nhìn thấy lesson theo scope department
  - giáo viên khác tổ không nhìn thấy lesson đó
  - content resource được publish thành công và có governance meta đúng

## Giới hạn hiện tại
- Chưa làm multi-tenant hoàn chỉnh theo nhiều trường/department records độc lập trong settings DB.
- Chưa có user directory CRUD/backoffice hoàn chỉnh.
- Chưa verify `next build` end-to-end trên DB runtime thật.
