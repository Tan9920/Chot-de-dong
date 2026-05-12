# Batch114 — Runtime Dependency Closure Board & Build Blocker Evidence

## Scope

Batch114 improves the project in the area that matters most after the academic/legal guardrails: **runtime truth**. Earlier batches had strong source-level checks, but install/build/live HTTP/auth/hosted proof was still not closed. This batch adds a source-level board and report that make those blockers explicit instead of letting the project overclaim readiness.

## What this batch adds

- `data/runtime-dependency-closure-policy.json`
- `lib/runtime-dependency-closure.ts`
- `GET /api/runtime/dependency-closure`
- `GET /api/admin/dependency-closure-board`
- `scripts/runtime-dependency-closure-report.mjs`
- `scripts/validate-batch114-runtime-dependency-closure-source.mjs`
- `npm run runtime:dependency-closure-report`
- `npm run batch114:runtime-dependency-closure-validate`
- `npm run smoke:batch114`

## What it checks

- `package.json` / `package-lock.json` version coherence.
- Dependency root coherence.
- Node version declaration.
- Next lock record presence.
- Platform SWC lock record presence.
- Whether `node_modules/.bin/next` exists now.
- Whether the platform SWC package exists now.
- Whether a hosted URL is provided before hosted claims.
- Whether forbidden AI SDK dependencies were introduced.

## Important limitation

This batch **does not** make build pass by pretending dependencies exist. It records blockers honestly. Runtime closure still requires real successful commands:

```bash
npm run registry:diagnose
npm run install:clean
npm run next:swc-ready
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://<hosted-url> npm run hosted:url-smoke
```

## Claims allowed

- Source-level runtime dependency closure board exists.
- The repo can diagnose missing dependency/build/runtime evidence.
- Build/runtime/hosted status remains unclaimed unless commands pass.

## Claims forbidden

- Do not say build-ready if `next:swc-ready` or `build:clean` fails.
- Do not say hosted-ready if hosted URL smoke is skipped.
- Do not say auth/session/CSRF runtime is safe if auth runtime smoke fails or is not run.
- Do not say production-ready while npm ci/build/live smoke are unresolved.

## No forbidden product changes

Batch114 adds no AI SDK, no model/API key, no payment, no marketplace, no multi-level referral, no fake verified academic content, and no public community auto-publish.
