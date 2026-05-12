# Batch 5 notes

## Trọng tâm
- DB hóa tiếp lớp **quản trị kho nội dung** theo hướng production-first
- CRUD admin/leader cho topic / program / question bank / rubric bank / resource / template
- Tách template khỏi catalog cứng, đưa về repository quản trị được
- Import pipeline mới theo **manifest** để nạp dữ liệu lớp 6 thật hoặc seed chuẩn hóa theo lô
- Siết workflow khi sửa giáo án đã duyệt

## File mới
- `app/api/admin/content/route.ts`
- `app/api/admin/content/[entity]/route.ts`
- `app/api/admin/content/import/route.ts`
- `components/content-admin.tsx`
- `data/content-admin-store.json`
- `data/imports/grade6-core-manifest.sample.json`
- `lib/content-management.ts`
- `lib/template-library.ts`
- `lib/workflow.ts`
- `types/runtime-shims.d.ts`
- `BATCH5_NOTES.md`

## File sửa lớn
- `app/api/content/import/route.ts`
- `app/api/lessons/[id]/route.ts`
- `app/api/metadata/route.ts`
- `app/api/templates/route.ts`
- `components/workspace.tsx`
- `lib/access.ts`
- `lib/catalogs.ts`
- `lib/exporter.ts`
- `lib/generator.ts`
- `lib/types.ts`
- `prisma/schema.prisma`
- `scripts/import-content.ts`
- `README.md`
- `docs/architecture.md`

## Ghi chú thực tế
- Batch này **chưa nạp dữ liệu chuẩn chính thức lớp 6**. Nó xây lớp schema + CRUD + import manifest để sẵn sàng nạp dữ liệu thật.
- JSON fallback vẫn được giữ để dev/demo nhanh.
- Khi có PostgreSQL + Prisma client, cùng luồng quản trị này sẽ chạy theo DB-first.
- `types/runtime-shims.d.ts` là lớp shim phục vụ verify TypeScript trong môi trường artifact thiếu dependency cài sẵn; không phải phần lõi nghiệp vụ production.
