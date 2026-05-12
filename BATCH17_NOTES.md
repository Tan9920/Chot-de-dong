# Batch 17 - verified pack execution + evidence matrix + export hardening

## Trọng tâm
- Không chỉ dừng ở source bundle scaffold.
- Thêm execution registry để điều phối từng pack qua verified corpus workflow thật: required documents, workflow steps, target tier, trạng thái release-ready.
- Thêm evidence matrix theo pack để nhìn rõ mức phủ field evidence, bundle links, conflict và invalid reference ở cấp pack.
- Siết export guard cả server-side lẫn client-side để chặn file nhìn như “bản chính thức” khi pack chưa đạt verified release.

## Những gì đã nâng
- `lib/pack-execution.ts`
  - JSON/Prisma registry cho execution record theo pack.
  - preview/import execution registry.
  - readiness evaluator cho required documents + workflow steps.
- `lib/pack-evidence.ts`
  - build evidence matrix theo pack.
  - tổng hợp coverage field evidence / bundle links / conflict / invalid ref.
- `lib/content-management.ts`
  - thêm:
    - `getAcademicPackExecutionRegistrySummary()`
    - `previewAcademicPackExecutionRegistryImport()`
    - `importAcademicPackExecutions()`
    - `getPackAcademicEvidenceMatrix()`
  - pack workbench giờ tính thêm execution readiness.
  - pack release snapshot giờ trả thêm execution record, evidence matrix và export policy.
- `prisma/schema.prisma`
  - thêm model `AcademicPackExecutionRecord`.
- API mới:
  - `GET/POST /api/admin/content/packs/execution-registry`
  - `GET /api/admin/content/packs/evidence-matrix?packId=...`
- Admin UI
  - thêm section `Pack execution registry`.
  - pack workbench hiển thị thêm execution plan.
- Export
  - route export tự kiểm tra release snapshot theo `packId`.
  - nếu không đạt verified release thì tự ép chế độ internal preview, watermark và filename prefix nội bộ.
  - client không còn tự đặt tên file “đẹp” ghi đè policy từ server.
- CLI mới:
  - `npm run content:execution-summary`
  - `npm run content:execution-import -- <file.json> [--apply] [--packId <id>]`
  - `npm run content:evidence-matrix -- <packId>`
- Sample scaffold mới:
  - `data/imports/pack-execution.sample.json`
  - pilot scaffold cho `grade6-nguvan-extended` và `grade6-toan-extended`

## Điều vẫn phải nói rõ
- Batch này chưa tự biến dữ liệu hiện tại thành verified corpus thật.
- Hai pack pilot mới chỉ là execution scaffold để kéo pack vào workflow verified thật.
- Muốn nói verified release thật vẫn phải có:
  - nguồn CTGDPT / SGK / hướng dẫn chính thức thật,
  - actual pages / phạm vi trích dẫn thật,
  - field evidence map đúng,
  - review consensus + approval đúng gate,
  - release snapshot sạch blocker.
