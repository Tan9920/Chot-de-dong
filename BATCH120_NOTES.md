# Batch120 — Raw Build Diagnostic Lifecycle Hardening

## Why this batch was selected
The current blocker is still P0 Runtime/Build Closure. During audit, `verify:batch119` could be externally interrupted while `build:raw:diagnose` was running. A Next build could leave `.next` artifacts behind, but `artifacts/raw-next-build-diagnostic-last-run.json` could remain in a `diagnostic_running_not_finished_yet` state. That is unsafe evidence for runtime claims.

## What changed
- Hardened `scripts/raw-next-build-diagnostic.mjs`:
  - Uses a non-detached child process to reduce orphaned Next build risk.
  - Handles SIGINT/SIGTERM and writes an interrupted artifact before exit.
  - Writes `running:false` only on final exit paths.
  - Tracks later build phase markers such as `Collecting build traces`.
- Hardened `scripts/runtime-build-hard-gate-report.mjs`:
  - Blocks raw build closure when the raw diagnostic artifact is still running or interrupted.
  - Keeps hosted closure blocked until strict `GIAOAN_DEMO_URL` smoke passes.
- Added `data/raw-build-diagnostic-lifecycle-policy.json`.
- Added `scripts/validate-batch120-raw-build-diagnostic-lifecycle-source.mjs`.
- Added `smoke:batch120` and `verify:batch120`.

## What this does NOT claim
- Does not claim hosted demo closure.
- Does not prove Vercel production runtime.
- Does not add AI/payment/marketplace/quỹ.
- Does not promote seed/scaffold data into verified data.

## Required verification
```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run smoke:batch120
npm run data:validate
npm run typecheck
npm run next:swc-ready
npm run build:raw:diagnose
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
npm run runtime:build-hard-gate-report
npm run hosted:url-smoke:optional
```

Strict hosted proof still requires:
```bash
GIAOAN_DEMO_URL=https://<hosted-url> npm run hosted:url-smoke
```
