# Batch131 — P0 Hosted Final Proof & Visual Smoke Closure Gate

## Why this batch

The current repo has strong local/startable runtime proof, but hosted/public proof is still blocked by missing Node24 CI/Vercel proof, real hosted APP_URL strict smoke, and visual smoke across mobile/tablet/desktop. Batch131 therefore does not add product features. It adds a stricter P0 final proof gate so the project cannot accidentally claim hosted/public readiness from local-only evidence.

## Added

- `data/runtime-p0-hosted-final-proof-policy.json`
- `lib/runtime-p0-hosted-final-proof.ts`
- `app/api/runtime/p0-hosted-final-proof/route.ts`
- `app/api/admin/p0-hosted-final-proof-board/route.ts`
- `scripts/runtime-p0-hosted-final-proof-report.mjs`
- `scripts/visual-smoke-evidence-template.mjs`
- `scripts/visual-smoke-evidence-validate.mjs`
- `scripts/verify-p0-hosted-final-proof.mjs`
- `scripts/validate-batch131-p0-hosted-final-proof-source.mjs`
- `docs/BATCH131_P0_HOSTED_FINAL_PROOF.md`

## Modified

- `package.json` / `package-lock.json` version to `0.131.0`.
- Added Batch131 scripts.
- `scripts/verify-release.mjs` now supports required visual smoke evidence.
- `verify:p0-100-release` now requires visual smoke evidence.
- `scripts/run-source-validators.mjs` registers the Batch131 source gate.

## Truth labels

- Source-level gate ready: yes.
- Hosted public proof closed: no, unless strict hosted/visual artifacts pass.
- Public rollout allowed: no by default.
- không production-ready.
- Không thêm AI/payment/marketplace/quỹ/referral cash.
- Không tạo verified giả.

## Verify

```bash
npm run runtime:p0-hosted-final-proof-validate
npm run runtime:p0-hosted-final-proof-report
npm run visual:smoke:evidence-template
npm run smoke:batch131
npm run verify:batch131
```

Strict hosted proof requires Node24 + hosted APP_URL + real visual evidence:

```bash
APP_URL=https://<url-vercel-that> npm run verify:p0-hosted-final-proof
APP_URL=https://<url-vercel-that> npm run verify:p0-100-release
```
