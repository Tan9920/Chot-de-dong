# Batch113 — First Source Pack Pilot Dossier & Legal Release Dry-run

Batch113 tạo release dry-run cho 3 scope pilot: `g5-toan`, `g9-ngu-van`, `g12-toan`.

## Nguyên tắc
- Không tạo verified giả.
- Không mutate `data/subject-data-registry.json`.
- Không bật `contentDepthAllowed`.
- Nếu thiếu source/legal/reviewer/export/takedown/current-law gate thì quyết định là `blocked_safe_frame_only` và chỉ dựng khung giáo án an toàn.
- Không mở câu hỏi, đáp án, Casio/máy tính cầm tay hoặc nội dung sâu trong dry-run.

## File mới
- `data/academic-release-dry-run-dossier.json`
- `lib/academic-release-dry-run.ts`
- `app/api/academic/release-dry-run/route.ts`
- `app/api/admin/academic-release-dry-run-board/route.ts`
- `scripts/academic-release-dry-run-report.mjs`
- `scripts/validate-batch113-release-dry-run-source.mjs`

## Lệnh
```bash
npm run batch113:release-dry-run-validate
npm run academic:release-dry-run-report
npm run smoke:batch113
npm run verify:batch113
```

`verify:batch113` vẫn cần dependency/build/runtime thật; source-level pass không đồng nghĩa production-ready.
