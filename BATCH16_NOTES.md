# Batch 16 - source bundle registry + pack workbench

## Trọng tâm
- Thêm source bundle registry theo pack để quản nguồn CTGDPT / SGK / hướng dẫn chính thức ở cấp pack, không phải gắn nguồn rời rạc từng entity.
- Thêm pack workbench gộp dossier + cockpit + release board + bundle coverage để biết pack nào thực sự gần internal snapshot / verified release.
- Thêm release snapshot theo pack để nhìn rõ pack hiện chỉ là preview nội bộ hay đã gần release candidate / verified release.

## Những gì đã nâng
- `lib/source-bundles.ts`
  - load/save source bundle registry ở JSON hoặc Prisma DB
  - preview/import bundle registry
  - summary và coverage theo pack
- `prisma/schema.prisma`
  - thêm model `AcademicSourceBundleRecord`
- `lib/academic-dossier.ts`
  - dossier template giờ trả thêm `bundleTemplates` scaffold theo pack
- `lib/content-management.ts`
  - quality issues kiểm thêm missing bundle / bundle pack mismatch / bundle pages gap / bundle scope gap
  - thêm:
    - `getAcademicSourceBundleSummary()`
    - `previewAcademicSourceBundleRegistryImport()`
    - `importAcademicSourceBundles()`
    - `getPackAcademicWorkbench()`
    - `getPackReleaseSnapshot()`
- API mới:
  - `GET/POST /api/admin/content/reference-bundles`
  - `GET /api/admin/content/packs/workbench`
  - `GET /api/admin/content/packs/release-snapshot?packId=...`
- Admin summary/report trả thêm `bundleSummary`, `packWorkbench`
- Admin UI có thêm section `Academic source bundle registry` và `Pack workbench`
- CLI mới:
  - `npm run content:bundle-summary`
  - `npm run content:bundle-import -- <file.json> [--apply]`
  - `npm run content:pack-workbench`
  - `npm run content:release-snapshot -- <packId>`
- Thêm sample scaffold:
  - `data/imports/source-bundles.sample.json`

## Điều vẫn phải nói rõ
- Batch này chưa tạo verified corpus thật.
- Bundle registry chỉ là hạ tầng để quản nguồn thật theo pack.
- Muốn nói verified thật vẫn phải nạp nguồn CTGDPT / SGK / official guidance thật, có pages, có field evidence, có review consensus và approval đúng gate.
