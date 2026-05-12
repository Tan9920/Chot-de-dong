# BATCH84 — Hosted Demo Launch Gate + CI Runtime Verification Path

## Why this batch

After Batch83, the largest blocker was still not a missing feature. The risk was that the project could be pushed to a public test URL without a clear launch gate, CI workflow, or hosted-demo checklist. Batch84 creates a safer path for real hosted demo testing without claiming production readiness.

## What changed

Created:

- `data/hosted-demo-release-checklist.json`
- `lib/hosted-demo-launch-gate.ts`
- `app/api/demo/launch-gate/route.ts`
- `scripts/validate-batch84-hosted-demo-launch-source.mjs`
- `scripts/hosted-demo-preflight.mjs`
- `.github/workflows/demo-runtime-verify.yml`
- `vercel.json`
- `docs/BATCH84_HOSTED_DEMO_LAUNCH_CHECKLIST.md`
- `BATCH84_NOTES.md`

Updated:

- `package.json` / `package-lock.json` version to `0.84.0`
- `.env.example` hosted demo flags
- `scripts/run-source-validators.mjs`
- `scripts/live-http-smoke.mjs` GET route list includes `/api/demo/launch-gate`
- `components/workspace.tsx` surfaces launch gate summary
- `README.md` describes Batch84 commands and limits
- `data/product-foundation.json` stage metadata

## What this proves

Source-level proof:

- Hosted demo launch gate exists.
- CI workflow exists for actual install/build/production smoke.
- Vercel demo config exists.
- Public-test checklist exists.
- Forbidden AI SDK dependencies remain absent.
- Public-facing claim guard exists.

## What it does not prove

It does not prove npm install/build/live smoke pass in this environment. Those still require a real machine/CI with public npm registry access and successful Next/SWC install.

## Commands

```bash
npm run smoke:batch84
npm run hosted-demo:preflight
npm run verify:batch84
```

`verify:batch84` is expected to fail until dependency install, Next SWC readiness, production build and production live smoke pass on the target host/CI.
