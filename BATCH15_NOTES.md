# Batch 15 - academic trace persistence + dossier import workflow

## Trọng tâm
- Sửa lỗi nền batch 14: `fieldEvidence` và một phần `sourceMeta` học thuật chưa được persist đúng qua normalize / JSON store / Prisma DB.
- Biến dossier template thành workflow vận hành thật: preview -> validate -> import.
- Thêm pack academic cockpit để ưu tiên pack nào nên được đẩy reviewed / verified trước.

## Những gì đã nâng
- `prisma/schema.prisma`
  - thêm `sourceRolloutStage`, `sourcePackId`, `sourceReferenceBundleIds`, `fieldEvidence` cho content tables học thuật.
- `lib/content-management.ts`
  - normalize/map/save giữ đúng `fieldEvidence`
  - release board dùng full quality issues thay vì danh sách đã bị truncate
  - thêm:
    - `previewAcademicDossierImport()`
    - `importAcademicDossierTemplate()`
    - `getPackAcademicCockpit()`
- API mới:
  - `POST /api/admin/content/dossiers/import`
  - `GET /api/admin/content/packs/cockpit`
- Admin summary/report trả thêm `packCockpit`.
- Admin UI có thêm khu vực `Pack academic cockpit`.
- CLI mới:
  - `npm run content:pack-cockpit`
  - `npm run content:dossier-import -- <file.json>`

## Điều vẫn phải nói rõ
- Batch này chưa tự tạo verified corpus thật cho lớp 6 hay lớp 1-12.
- Nó sửa đường ống để evidence/trace được lưu thật và dossier pack có thể import/preview đúng.
- Muốn nói verified thật vẫn phải nạp nguồn CTGDPT / SGK / official guidance thật, có pages, có review consensus, có leader/admin approval.
