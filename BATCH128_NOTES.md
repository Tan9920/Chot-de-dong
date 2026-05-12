# Batch128 - P0 98-99 Local Runtime Closure Hardening

## Purpose
Push P0 as close as possible to 98-99% without fake claims. This batch does **not** move to P1 feature work. It adds a stronger local proof path that runs the hosted URL route suite against a local `next start` server using the current `.next` build.

## Added
- `scripts/p0-loopback-url-smoke.mjs`
- `scripts/verify-p0-9899.mjs`
- `scripts/runtime-p0-9899-closure-report.mjs`
- `scripts/validate-batch128-p0-9899-closure-source.mjs`
- `data/runtime-p0-9899-closure-policy.json`

## Scripts
- `npm run verify:p0-9899`
- `npm run verify:p0-9899-node24-ci`
- `npm run verify:release:strict`
- `npm run runtime:p0-loopback-url-smoke`
- `npm run runtime:p0-9899-closure-report`
- `npm run smoke:batch128`

## Gates
Local P0 98-99 requires:
1. final P0 verifier passes;
2. strict raw Next build exits 0;
3. local production live smoke passes;
4. auth invite runtime smoke passes;
5. loopback hosted-route smoke passes against `next start`;
6. no AI/payment/fake verified-data changes.

100% / public rollout remains blocked until:
- Node 24 CI proof passes;
- real Vercel `APP_URL` strict smoke passes.
