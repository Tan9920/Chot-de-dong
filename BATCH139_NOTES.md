# BATCH139_NOTES — P0/P1 Local Evidence Lift

Batch139 focuses only on local P0/P1 evidence quality.

## Scope

- Improve local Node22 evidence from mostly command notes to artifact-backed current-run proof.
- Keep public rollout blocked until Node24, APP_URL hosted smoke and visual smoke evidence are real.
- Do not add teacher-facing feature modules.

## Added

- `data/p0-p1-local-evidence-policy.json`
- `lib/p0-p1-local-evidence.ts`
- `/api/runtime/p0-p1-local-evidence`
- `/api/admin/p0-p1-local-evidence-board`
- `scripts/p0-p1-command-evidence.mjs`
- `scripts/p0-p1-local-evidence-runner.mjs`
- `scripts/p0-p1-local-evidence-report.mjs`
- `scripts/validate-batch139-p0-p1-local-evidence-source.mjs`
- `docs/BATCH139_P0_P1_LOCAL_EVIDENCE_LIFT.md`

## Not added

- Không thêm AI/API AI/model SDK.
- Không thêm thanh toán/Stripe/PayPal.
- Không tạo dữ liệu verified giả.
- Không auto-public community.

## Required commands

```bash
npm run batch139:p0-p1-local-evidence-validate
npm run smoke:batch139
npm run p0-p1:local-evidence-runner
npm run p0-p1:stability-report
npm run p0:hosted-proof-execution-report
```

## Remaining hosted blockers

- Node24 CI proof.
- APP_URL hosted strict smoke.
- Real browser visual smoke.
- Production DB/security/legal review.
