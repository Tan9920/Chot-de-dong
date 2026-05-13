# Batch146 — Hosted Proof Runner Hardening & Evidence Summary

## Mục tiêu

Đẩy hosted/public proof lên mức cao nhất có thể trong phạm vi source/local hiện tại, không overclaim: thêm preflight strict, summary artifact, GitHub step summary và validator để lần chạy hosted Node24 thật có đủ bằng chứng audit.

## File thêm mới

- `data/batch146-hosted-proof-runner-hardening-policy.json`
- `scripts/p0-hosted-final-proof-preflight.mjs`
- `scripts/p0-hosted-final-proof-summary.mjs`
- `scripts/validate-batch146-hosted-proof-runner-hardening-source.mjs`
- `docs/BATCH146_HOSTED_PROOF_RUNNER_HARDENING.md`
- `BATCH146_NOTES.md`

## File sửa

- `.github/workflows/p0-hosted-final-proof.yml`
- `scripts/p0-hosted-ci-final-proof-runner.mjs`
- `scripts/run-source-validators.mjs`
- `package.json`
- `package-lock.json`
- `README.md`
- `data/runtime-p0-hosted-ci-final-proof-policy.json`
- `data/p0-hosted-proof-execution-gate-policy.json`

## Không đổi

Không thêm AI, không thêm payment, không tạo verified giả, không mở community auto-public, không cho user tự chọn role cao.

## Claim guard

Batch146 là source-level runner/auditability hardening. Hosted proof vẫn chỉ đóng khi workflow GitHub Actions Node24 chạy thật với APP_URL, screenshot PNG thật và các report đều pass. Production-ready vẫn cần production DB/security/legal review riêng.
