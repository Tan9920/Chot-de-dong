# Batch 18 - academic evidence ledger + field-level audit wiring

## Trọng tâm
- Thêm **academic evidence ledger** ở cấp `pack -> entity -> field` để không chỉ biết entity có fieldEvidence hay không, mà còn biết từng field đang map nguồn nào, có pages/phạm vi trích chưa, đang pending/mapped/reviewed/approved.
- Nối ledger vào **academic quality gate**, **pack workbench** và **release snapshot** để pack chưa có ledger hoặc ledger còn hở sẽ không được coi là gần verified release.
- Thêm scaffold/API/CLI để đẩy nhanh pilot verified pack lớp 6 mà vẫn giữ khung tái dùng cho 1–12.

## Những gì đã nâng
- `lib/evidence-ledger.ts`
  - JSON/Prisma storage cho `AcademicEvidenceLedgerRecord`
  - normalize/list/summary/import preview/import apply
  - readiness evaluator ở cấp field
  - scaffold generator từ trace hiện có của pack
- `prisma/schema.prisma`
  - thêm model `AcademicEvidenceLedgerRecord`
- `lib/content-management.ts`
  - academic quality gate kiểm thêm:
    - missing evidence ledger
    - ledger field pending
    - ledger page missing
    - ledger review/approval gap
  - pack workbench hiển thị ledger readiness + ledger coverage
  - release snapshot trả thêm evidence ledger summary/readiness
  - thêm hàm:
    - `getAcademicEvidenceLedgerRegistrySummary()`
    - `previewAcademicEvidenceLedgerRegistryImport()`
    - `importAcademicEvidenceLedgerRecords()`
    - `getPackAcademicEvidenceLedgerScaffold()`
- API mới:
  - `GET/POST /api/admin/content/evidence-ledger`
  - `GET /api/admin/content/evidence-ledger/scaffold?packId=...`
- CLI mới:
  - `npm run content:ledger-summary`
  - `npm run content:ledger-scaffold -- <packId>`
  - `npm run content:ledger-import -- <file.json> [--apply] [--packId <id>]`
- Admin/report/UI:
  - summary/report trả thêm `evidenceLedgerSummary`
  - admin panel có thêm section `Academic evidence ledger`
  - workbench hiển thị thêm trạng thái ledger
- Sample scaffold/import:
  - `data/evidence-ledger.json`
  - `data/imports/evidence-ledger.sample.json`

## Điều vẫn phải nói rõ
- Batch này **không tự biến dữ liệu seed thành verified corpus thật**.
- Ledger chỉ là lớp vận hành/audit ở cấp field. Muốn verified thật vẫn cần:
  - nguồn CTGDPT/SGK/hướng dẫn thật,
  - pages/phạm vi trích thật,
  - map field đúng,
  - review consensus + approval đúng gate,
  - release snapshot sạch blocker.
