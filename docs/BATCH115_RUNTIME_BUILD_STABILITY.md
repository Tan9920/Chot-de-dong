# Batch115 — Runtime Build Stability Closure

## Scope

Batch115 follows Batch114. Batch114 made dependency/build/runtime blockers visible, but during this audit `npm run build` reached `Collecting page data` and did not exit 0 inside the verification window. This batch does **one** thing: reduce build-timeout risk and make the remaining build/runtime/hosted claim boundary explicit.

## What this batch changes

- Adds `data/runtime-build-stability-policy.json`.
- Adds `lib/runtime-build-stability.ts`.
- Adds `GET /api/runtime/build-stability`.
- Adds `GET /api/admin/build-stability-board`.
- Adds `scripts/runtime-build-stability-report.mjs`.
- Adds `scripts/validate-batch115-runtime-build-stability-source.mjs`.
- Updates `next.config.ts` to constrain Next build worker pressure:
  - `experimental.cpus = 1`
  - `experimental.workerThreads = false`
  - `experimental.staticGenerationRetryCount = 0`
  - `experimental.staticGenerationMaxConcurrency = 1`
  - `experimental.staticGenerationMinPagesPerWorker = 1`
  - `typescript.ignoreBuildErrors = true`, with `npm run typecheck` required before `npm run build:clean`
- Updates `app/page.tsx` to make the demo shell dynamic/no-store until live smoke proof exists.
- Keeps `tsconfig.json` aligned with Next's generated type include/plugin so build does not mutate it during verification.
- Adds Batch115 package scripts.

## What this batch does not claim

- It does not claim production readiness.
- It does not claim hosted readiness.
- It does not claim auth/session/CSRF runtime safety.
- It does not create verified academic data.
- It does not add AI, payment, marketplace, cash fund, multi-level referral, or public community auto-publish.

## Required commands before stronger runtime claims

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run source:validate
npm run typecheck
npm run next:swc-ready
npm run runtime:build-stability-report
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://<hosted-url> npm run hosted:url-smoke
```

## Allowed claim

- Source-level build stability guardrails exist.
- The repo now has a lower-concurrency Next build configuration and a build stability report.
- Build/runtime/hosted status remains unclaimed unless the real commands pass.

## Forbidden claim

- Do not say build-ready if `npm run build` or `npm run build:clean` times out.
- Do not say hosted-ready if hosted URL smoke is skipped.
- Do not say auth/session/CSRF runtime is safe if auth runtime smoke is missing or failed.
- Do not say production-ready while runtime/live/auth/hosted proof is incomplete.
