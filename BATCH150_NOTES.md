# Batch150 Notes — P0/P1 to P2 Transition Gate & External Closure Guide

## Scope

Batch150 chuẩn bị chuyển sang P2 bằng cách giải quyết vấn đề khó nhất còn lại: tách rõ điều kiện được thả lỏng P0/P1 để bắt đầu P2 source work với điều kiện hosted/public proof để public rollout.

## Files added

- `data/batch150-p0-p1-to-p2-transition-policy.json`
- `scripts/p0-p1-to-p2-transition-gate.mjs`
- `scripts/p0-p1-external-closure-operator-guide.mjs`
- `scripts/validate-batch150-p0-p1-to-p2-transition-source.mjs`
- `docs/BATCH150_P0_P1_TO_P2_TRANSITION_GATE.md`
- `BATCH150_NOTES.md`

## Files modified

- `package.json` and `package-lock.json`: version `0.150.0`, scripts for Batch150.
- `.github/workflows/p0-hosted-final-proof.yml`: generate/upload Batch150 transition artifacts.
- `scripts/run-source-validators.mjs`: registers Batch150 files/scripts/markers.
- `README.md`: Batch150 status and commands.

## Commands

```bash
npm run batch150:p0-p1-to-p2-transition-validate
npm run smoke:batch150
npm run p0-p1:to-p2-transition-gate
npm run p0-p1:external-closure-guide
npm run verify:batch150
```

## Claim policy

Allowed after local gate pass:

- P0/P1 can be relaxed enough for P2 source work.
- P2 source/local/private work can start.

Forbidden until external proof passes:

- hosted proof closed
- public rollout allowed
- production-ready
- P0/P1 100%

Không thêm AI, không thêm payment, không marketplace/quỹ, không verified giả, không mở community auto-public.

External Closure Operator Guide marker.
