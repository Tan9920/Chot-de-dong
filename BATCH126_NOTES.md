# Batch126 — P0 Local Runtime Closure Hardening

## Objective
Raise local P0 runtime/build confidence before moving into P1 source work. This batch does not add product features. It strengthens evidence freshness and the release gate so the repo cannot pass a release check from stale build/smoke artifacts.

## Changed
- Added `data/runtime-p0-local-closure-policy.json`.
- Added `scripts/runtime-p0-local-closure-report.mjs`.
- Added `scripts/validate-batch126-p0-local-closure-source.mjs`.
- Added scripts: `runtime:p0-local-closure-report`, `runtime:p0-local-closure-validate`, `smoke:batch126`, `verify:p0-local`, `verify:batch126`.
- Updated `verify:release` so it runs `verify:p0-local` before hosted URL smoke.
- Updated `verify:all` build priority to prefer the guarded build command first; `verify:p0-local` forces `GIAOAN_BUILD_GUARD_STRICT_RAW=1` so local closure requires a real raw Next build exit 0.
- Updated repo version to `0.126.0`.

## P1 rule
- `p1SourceWorkAllowed` may be true only when strict local evidence is clean.
- `publicP1RolloutAllowed` remains false until hosted URL strict smoke passes with `APP_URL` or `NEXT_PUBLIC_APP_URL`.

## Explicit non-goals
No AI/API/model call, no payment/marketplace/quỹ/referral cash flow, no fabricated verified academic data, no auto-public community behavior, and no production-ready claim without hosted smoke and real-device UX smoke.
