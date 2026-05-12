# BATCH85 — Runtime Deploy Hardening + Real Vercel Warning Fix

Date: 2026-04-30
Package version: 0.85.0

## Why this batch was chosen

The Vercel deployment logs showed warnings that are directly related to hosted-demo trust:

- `engines.node` was `>=20.0.0`, which can automatically move to a newer Node major on Vercel.
- project `.npmrc` contained `always-auth=false`, which npm reports as an unknown project config.
- `next@15.3.3` was deprecated because of the React Server Components security advisory line.
- Batch84 still had runtime proof blockers: install/build/live smoke had to run on the real host or CI.

So Batch85 is not a feature batch. It is a deploy hardening batch focused on reducing real warning noise and making the runtime verification path stricter.

## What changed

### Dependency and Vercel warning hardening

- `package.json` version bumped from `0.84.0` to `0.85.0`.
- `engines.node` changed from `>=20.0.0` to `22.x` so Vercel does not auto-upgrade across future Node major versions. This is the Node 22.x deployment pin.
- `next` changed from `15.3.3` to exact `15.3.8` (Next.js 15.3.8).
- `react` changed from `19.0.0` to exact `19.0.4` (React 19.0.4).
- `react-dom` changed from `19.0.0` to exact `19.0.4`.
- `package-lock.json` regenerated/updated and normalized back to public npm registry URLs.
- `.npmrc` removed the project-level `always-auth=false` line to stop the npm warning seen on Vercel.

### Runtime verification hardening

- `scripts/check-registry-network.mjs` now uses a hard `Promise.race` timeout so DNS lookup cannot hang forever. This fixes the earlier audit weakness where registry diagnose could timeout at the container level.
- `scripts/batch83-runtime-preflight.mjs` no longer hardcodes `0.83.0`; it accepts Batch83+ package versions and reports credentialed registry environment as a warning when clean scripts are present.
- Added `scripts/validate-batch85-runtime-deploy-hardening-source.mjs`.
- Added npm scripts:
  - `runtime:deploy-hardening-validate`
  - `smoke:batch85`
  - `verify:batch85`
- Updated GitHub Actions workflow to use Node 22 and Batch85 commands.
- Updated hosted-demo checklist to require `verify:batch85` and the Batch85 deploy-hardening validator before link sharing.
- Updated source validator registry to include Batch85.

## What this does not prove

This batch does not prove production-ready status; nói cách khác, batch này không chứng minh production-ready.

It fixes source-level deploy warnings and strengthens runtime verification, but a hosted demo link should still only be shared after these pass on Vercel/GitHub Actions or a host with real dependency install:

```bash
npm run registry:diagnose
npm run install:clean
npm run next:swc-ready
npm run data:validate
npm run source:validate
npm run hosted-demo:launch-gate-validate
npm run runtime:deploy-hardening-validate
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run runtime:preflight
npm run verify:batch85
```

## Governance/product boundaries kept

- No AI SDK added.
- No model/API call added.
- No real payment, marketplace cash, referral multi-level, or cash fund added.
- No fake verified subject data added.
- The app remains positioned as a non-AI-first lesson planning, export, learning-resource, community, and team/school workspace platform.
- Seed/scaffold/community content still must not be treated as verified academic content.

## Remaining risk

- The repo still needs a real host/CI install + build + live HTTP smoke.
- Browser/mobile QA still has to be done manually.
- JSON fallback is still not a production multi-user database architecture.
- Academic 1–12 verified content coverage remains low; safe frame generation rules must stay in place.
- Community/activity/game resources still need moderation, source/license, approval, and takedown before broad public use.
