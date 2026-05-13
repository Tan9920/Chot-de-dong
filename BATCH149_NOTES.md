# Batch149 Notes — P0/P1 Maximum Closure & Security Cookie Hardening

## Scope

Đúng yêu cầu tiếp tục hoàn thiện P0/P1 tối đa nhưng không overclaim. Batch149 chỉ xử lý P0/P1 closure evidence và P1 security-cookie hardening.

## Added

- `data/batch149-p0-p1-max-closure-policy.json`
- `scripts/p0-p1-max-closure-runner.mjs`
- `scripts/p0-p1-max-closure-report.mjs`
- `scripts/validate-batch149-p0-p1-max-closure-source.mjs`
- `docs/BATCH149_P0_P1_MAX_CLOSURE.md`

## Modified

- `lib/runtime-security.ts`: CSRF cookie now uses `httpOnly: true` while the token is still returned in JSON for the `x-csrf-token` header.
- `app/api/auth/logout/route.ts`: CSRF cookie clear now also uses `httpOnly: true`.
- `package.json` and `package-lock.json`: version `0.149.0`, scripts for Batch149.
- `scripts/run-source-validators.mjs`: registers Batch149 files/scripts.
- `README.md`: adds Batch149 status block.

## Commands

```bash
npm run batch149:p0-p1-max-closure-validate
npm run smoke:batch149
npm run p0-p1:max-closure-runner
npm run p0-p1:max-closure-report
npm run verify:batch149
```

## Truth lock

- Hosted/public proof vẫn blocked nếu chưa có Vercel APP_URL + GitHub Actions Node24 + PNG visual smoke thật.
- Production-ready vẫn false.
- Public rollout vẫn false.
- Không thêm AI, không thêm payment, không marketplace/quỹ, không verified giả, không community auto-public.

Hosted/public proof phải còn là blocker thật cho đến khi có artifact external; không được biến local artifact thành proof public.

hosted/public proof vẫn là blocker thật.
