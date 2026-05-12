# Batch121 — Full Verify Chain Stability & Cache Hygiene

## Priority
P0 Runtime/Build Closure.

## Why this batch was selected
No specific product feature bug was provided. The real blocker after Batch120 was still the one-command runtime verify chain: `verify:batch120` could be interrupted while `build:raw:diagnose` entered the optimized production build phase in constrained environments. The project must not move to feature expansion while full runtime evidence is unstable.

## What changed
- Upgraded repo version to `0.121.0`.
- Added Batch121 source validator and policy.
- Disabled webpack filesystem cache in `next.config.ts` for production build diagnostics.
- `scripts/raw-next-build-diagnostic.mjs` now removes `.next/cache` before spawning `next build` and records `cacheCleanup` in the raw-build artifact.
- Added `smoke:batch121` and `verify:batch121`.

## What did not change
- No AI/API/model call was added.
- No payment, marketplace, referral cash, or fund feature was added.
- No seed/scaffold data was promoted to verified.
- No community auto-publish was added.
- Hosted closure still requires `GIAOAN_DEMO_URL` strict smoke.

## Evidence rule
A raw build is closed only when `artifacts/raw-next-build-diagnostic-last-run.json` is finalized with `rawNextBuildExitCode: 0` and `running: false`. Hosted closure is not claimed without strict hosted smoke.
