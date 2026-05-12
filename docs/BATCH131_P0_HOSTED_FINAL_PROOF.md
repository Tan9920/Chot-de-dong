# Batch131 — P0 Hosted Final Proof & Visual Smoke Closure Gate

## Scope

Batch131 is a P0 proof/gate batch, not a product-feature batch. It does not claim hosted closure, public rollout, production auth, or production-ready status. It adds the stricter proof chain needed before anyone can honestly say the hosted demo is closed.

## What changed

- Added `data/runtime-p0-hosted-final-proof-policy.json` to define the required proof gates: Node24 CI/Vercel proof, hosted APP_URL strict smoke, hosted save/export smoke, visual smoke evidence, and final release proof.
- Added `lib/runtime-p0-hosted-final-proof.ts` plus public/admin API boards to surface missing gates without exposing secrets.
- Added visual smoke evidence tooling:
  - `npm run visual:smoke:evidence-template`
  - `npm run visual:smoke:evidence-validate`
- Added strict proof scripts:
  - `npm run runtime:p0-hosted-final-proof-report`
  - `npm run verify:p0-hosted-final-proof`
- Tightened `verify:p0-100-release` so it requires visual smoke evidence in addition to Node24 and hosted URL proof.

## Truth labels

- Source-level proof gate: yes.
- Hosted proof closed: no, unless Node24 + APP_URL + visual evidence artifacts pass in the target environment.
- Public rollout allowed: no by default.
- Production-ready: no.
- không production-ready.

## Guardrails kept

- Không thêm AI, AI SDK, model call, prompt-agent, or API key.
- Không thêm payment, marketplace, quỹ tiền mặt, or referral nhiều tầng.
- Không tạo verified giả.
- Không auto-public community.
- Không copy dài SGK/SGV/tài liệu bản quyền.

## Commands

Source-level verification:

```bash
npm run runtime:p0-hosted-final-proof-validate
npm run runtime:p0-hosted-final-proof-report
npm run visual:smoke:evidence-template
npm run smoke:batch131
npm run verify:batch131
```

Strict hosted proof after Vercel deploy:

```bash
APP_URL=https://<url-vercel-that> npm run verify:p0-hosted-final-proof
APP_URL=https://<url-vercel-that> npm run verify:p0-100-release
```

`verify:p0-hosted-final-proof` and `verify:p0-100-release` are expected to fail on Node22, without APP_URL, or without real visual evidence.
