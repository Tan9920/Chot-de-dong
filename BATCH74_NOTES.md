# Batch74 — Subject Data Truth & Safe Curriculum Scope

## Goal
Focus on the unstable subject/curriculum data layer instead of adding new product features. The batch separates 1–12 coverage from true readiness and prevents the app from implying that seed/scaffold data is verified curriculum content.

## Files created
- `data/subject-data-registry.json`
- `lib/subject-data-truth.ts`
- `app/api/subject-data/truth/route.ts`
- `scripts/validate-subject-data-truth-source.mjs`
- `BATCH74_NOTES.md`

## Files changed
- `package.json`
- `data/product-foundation.json`
- `README.md`
- `docs/BASIC_PRODUCT_FOUNDATION.md`
- `lib/curriculum-data.ts`
- `lib/coverage-truth.ts`
- `lib/content-repository.ts`
- `lib/generator.ts`
- `lib/teaching-policy.ts`

## What is real
- There is now a broad grades 1–12 subject registry.
- The registry explicitly marks most subjects as `scaffold` and `starter`.
- Grade 6 Ngữ văn keeps only one seed demo record.
- `contentDepthAllowed` is false for every record, so the product must create safe frames only.
- The generator trace includes `subjectDataGate`.
- `/api/subject-data/truth` exposes both overall summary and scoped gate.
- Coverage truth now reports scaffold/seed/reviewed/verified/deep-content counts.

## What is not real yet
- No reviewed/verified curriculum content was added.
- No official SGK/SGV content was copied.
- No expert review workflow was completed.
- No Casio/máy tính cầm tay guidance was unlocked.
- No production database or live HTTP smoke was verified.

## Validation
Run:

```bash
npm run subject-data:truth-validate
npm run smoke:batch74
npm run typecheck
npm run build
```

Source-level validators can pass without proving runtime production readiness.
