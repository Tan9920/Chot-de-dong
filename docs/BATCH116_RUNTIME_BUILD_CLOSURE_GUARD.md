# Batch116 — Runtime Build Closure Guard

## Scope
Batch116 is a runtime/build blocker batch. It does not add lesson-authoring features, academic verified data, AI, payment, marketplace, creator cash rewards, or public community automation.

The goal is to reduce the real Batch115 blocker: `next build` did not finish cleanly in this environment. Batch116 preserves raw build evidence while adding a guarded build path that can produce startable artifacts for local runtime smoke testing.

## What changed

- Preserved `npm run build:raw` as the unwrapped Next.js build command.
- Changed `npm run build` and `npm run build:guarded` to use `scripts/next-build-runtime-guard.mjs`.
- Added build guard evidence output at `artifacts/next-build-runtime-guard-last-run.json`.
- Added runtime build closure guard policy, board API, admin board API, report script, and source validator.
- Added dynamic/no-store runtime guards to API route handlers so build analysis does not treat API endpoints as static content.
- Added low-concurrency Next config flags: `webpackBuildWorker: false`, `parallelServerCompiles: false`, `parallelServerBuildTraces: false`, and `serverMinification: false`.
- Updated the process timeout wrapper to kill Unix process groups, reducing orphaned Next worker risk after timeout.

## Important truth boundary

Batch116 does **not** mean raw `next build` is fully fixed.

A guarded build pass means:

- the guarded script reached enough build artifacts to try `next start` smoke testing;
- a controlled trace-timeout recovery may have occurred;
- a report artifact was written;
- the repo can be tested more safely than Batch115.

A guarded build pass does **not** mean:

- raw `next build` exited 0;
- Vercel build will pass;
- hosted runtime is ready;
- auth/session/CSRF runtime is proven;
- the project is production-ready.

The policy requires a separate raw build pass before claiming raw build closure.

## Commands

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run source:validate
npm run runtime:build-closure-guard-report
npm run batch116:runtime-build-closure-guard-validate
npm run build:raw
npm run build:guarded
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://<hosted-url> npm run hosted:url-smoke
```

## No forbidden additions

Batch116 does not add AI SDK/API calls, payment, marketplace cash, multi-level referral, fake verified labels, deep academic content enablement, or public community auto-publish.


## Static marker policy keys

- `rawNextBuildExitZeroRequiredBeforeClaim`: true — raw Next build must exit 0 before raw build closure can be claimed.
- `noProductionReadyClaimWithoutLiveAuthHostedSmoke`: true — production readiness cannot be claimed without live, auth/session, and hosted smoke proof.
