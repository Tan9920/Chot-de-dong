# Batch125 - P0 Runtime Closure & P1 Transition Gate

## Purpose
Close the biggest remaining P0 blocker before starting P1: local clean install, strict production build, production live HTTP smoke, auth runtime smoke, and an explicit gate separating local P0 closure from hosted/public rollout.

## What changed
- Bumped repo version to `0.125.0`.
- Kept Node target at `24.x`.
- Tightened `next.config.ts` so production build no longer silently skips TypeScript/ESLint checks.
- Added `data/runtime-p0-p1-transition-policy.json`.
- Added `scripts/runtime-p0-p1-transition-report.mjs`.
- Added `scripts/validate-batch125-p0-p1-transition-source.mjs`.
- Added scripts: `runtime:p0-p1-transition-validate`, `runtime:p0-p1-transition-report`, `smoke:batch125`, `verify:batch125`.

## Gate meaning
- `localP0Closed=true`: source/data/type/build/local production smoke/auth runtime proof are clean in the current environment.
- `p1SourceWorkAllowed=true`: P1 source work can start after local closure.
- `publicP1RolloutAllowed=false` until hosted URL smoke passes with `APP_URL` or `NEXT_PUBLIC_APP_URL`.

## Still not allowed
- Do not claim production-ready.
- Do not claim hosted/public demo closure without strict URL smoke.
- Do not add AI, payment, marketplace, cash fund/referral payout, fake verified academic status, or auto-public community.
