# Batch141 — P0 Hosted Proof Artifact Disambiguation

## Mục tiêu

Batch141 sửa blocker P0/hosted proof còn lại sau Batch140: cùng một artifact `verify-release-last-run.json` có thể bị report/board đọc như cả `hosted_release_strict` và `p0_100_release`. Điều này có nguy cơ làm hosted strict smoke bị hiểu nhầm là proof P0-100/public closure.

Batch này không thêm tính năng giáo viên mới. Mục tiêu là nâng chất lượng bằng chứng trước khi chạy Node24/GitHub Actions/Vercel thật.

## Thay đổi chính

- Tách artifact cho `verify:release:strict`: `artifacts/verify-release-strict-last-run.json`.
- Tách artifact cho `verify:p0-100-release`: `artifacts/verify-p0-100-release-last-run.json`.
- `scripts/verify-release.mjs` ghi `command`, `proofProfile`, `requireNode24`, `requireHostedUrl`, `requireVisualSmoke` và `artifactContract`.
- `runtime-p0-hosted-ci-final-proof-report` và board runtime/admin chỉ tính pass nếu artifact khớp đúng contract.
- `p0-hosted-ci-final-proof-runner` chạy thêm bước `verify:p0-100-release` riêng, không cho reuse artifact hosted strict.
- Thêm regression validator: artifact `hosted_release_strict` không thể satisfy `p0_100_release`.

## File tạo mới

- `scripts/validate-batch141-p0-hosted-proof-artifact-integrity-source.mjs`
- `docs/BATCH141_P0_HOSTED_PROOF_ARTIFACT_DISAMBIGUATION.md`
- `BATCH141_NOTES.md`

## File sửa

- `package.json`
- `package-lock.json`
- `README.md`
- `data/runtime-p0-hosted-ci-final-proof-policy.json`
- `scripts/verify-release.mjs`
- `scripts/runtime-p0-hosted-ci-final-proof-report.mjs`
- `scripts/p0-hosted-ci-final-proof-runner.mjs`
- `scripts/validate-batch132-p0-hosted-ci-final-proof-source.mjs`
- `scripts/validate-batch139-p0-p1-local-evidence-source.mjs`
- `scripts/validate-batch140-p0-p1-evidence-integrity-source.mjs`
- `scripts/run-source-validators.mjs`
- `lib/runtime-p0-hosted-ci-final-proof.ts`

## Lệnh nên chạy

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run batch141:p0-hosted-proof-artifact-integrity-validate
npm run source:validate
npm run data:validate
npm run smoke:batch141
npm run runtime:p0-hosted-ci-proof-report
npm run p0-p1:local-evidence-runner
npm run p0-p1:local-evidence-report
```

## Chưa được claim

- Chưa production-ready.
- Chưa public rollout.
- Chưa đóng hosted proof thật nếu chưa chạy Node24 CI, Vercel/APP_URL strict smoke, hosted save/export smoke và browser visual smoke thật.
- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không auto-public community.
