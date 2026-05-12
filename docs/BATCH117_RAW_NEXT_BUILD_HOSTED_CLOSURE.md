# Batch117 — Raw Next Build / Hosted Closure Triage

## Scope

This batch keeps the work on one blocker: raw Next build / hosted runtime closure. It does not add Lesson Authoring, Export, Community, Bot, AI, payment, or verified academic data.

## What changed

- Preserved `npm run build:raw = next build` as the source of truth.
- Added `npm run build:raw:diagnose` to run raw Next build with bounded timeout and write `artifacts/raw-next-build-diagnostic-last-run.json`.
- Added `runtime:raw-build-closure-report` and two JSON API boards:
  - `/api/runtime/raw-build-closure`
  - `/api/admin/raw-build-closure-board`
- Added `staticPageGenerationTimeout: 90` to make the build policy explicit instead of relying on implicit defaults.
- Added BMAD-inspired role gates: Analyst, PM, Architect, Dev, QA.

## Important boundary

A timeout, guarded build artifact, or source-level report is not raw build closure. Raw build closure requires `npm run build:raw` to exit 0.

Hosted closure requires a real hosted URL and strict smoke:

```bash
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://<hosted-url> npm run hosted:url-smoke
```

## Current evidence from this audit environment

The audit environment reached `Collecting page data` and did not exit within the bounded run. I also reproduced the same phase hang with a minimal Next app using the same installed Next 15.3.8 package, so this run cannot honestly prove whether the remaining blocker is purely repo code, environment, or both.

## No-overclaim rule

Do not say production-ready, hosted-ready, or raw-build-closed until the real commands pass.
