# Batch 20 - source authority policy + citation gate

## Trọng tâm
- Siết chuẩn nguồn học thuật theo authority registry: dữ liệu dùng cho thầy cô/học sinh chỉ được đi qua reviewed/verified khi reference match sách hoặc website chính thống.
- Không chỉ đếm refs/pages, mà kiểm thêm cơ quan có thẩm quyền, domain chính thức và loại nguồn được phép.
- Giữ áp dụng chung cho đa lớp 1-12, không hard-code riêng lớp 6.

## Những gì đã nâng
- `lib/source-authority.ts`
  - authority registry với built-in authorities cho Bộ GDĐT, cổng Chính phủ, domain `.gov.vn`, NXBGDVN
  - summary / preview import / import registry
  - evaluation authority policy ở cấp sourceMeta.references
- `prisma/schema.prisma`
  - thêm model `AcademicSourceAuthorityRecord`
- `lib/content-management.ts`
  - workflow reviewed/verified giờ chặn nếu nguồn không match authority policy
  - quality gate có issue `authority_policy_gap`
  - verification queue/readiness giờ tính thêm authority policy
  - expose summary/import API cho source authorities
- API mới
  - `GET/POST /api/admin/content/source-authorities`
- CLI mới
  - `npm run content:authority-summary`
  - `npm run content:authority-import -- <file.json> [--apply]`
- Data mới
  - `data/source-authorities.json`
  - `data/imports/source-authorities.sample.json`
- Admin UI/report
  - thêm section Source authority registry
  - academic quality có số lượng authority gaps

## Điều vẫn phải nói rõ
- Batch này chưa đồng nghĩa toàn bộ dữ liệu hiện tại đã chuẩn sách/chính thống.
- Nó là lớp governance và ingestion guard để chặn dữ liệu yếu nguồn từ bây giờ trở đi.
- Muốn verified thật vẫn phải nạp refs thật, pages thật, ledger thật và review thật.
