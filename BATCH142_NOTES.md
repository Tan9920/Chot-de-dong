# Batch142 — P0 Node24 CI Provenance Hardening

## Mục tiêu

Batch142 sửa blocker P0/hosted proof sau Batch141: một artifact `verify-p0-deepest-last-run.json` chạy trên Node24 local có thể trông giống Node24 proof, nhưng chưa chắc là GitHub Actions/Vercel CI proof. Batch này không thêm feature giáo viên mới; chỉ tăng độ tin cậy evidence trước khi public/hosted closure.

## Thay đổi chính

- `verify:p0-deepest-node24-ci` bật thêm `GIAOAN_REQUIRE_CI_PROVENANCE=1` bên cạnh `GIAOAN_REQUIRE_NODE24=1`.
- `scripts/verify-p0-deepest.mjs` ghi thêm `requireCiProvenance` và `ciProvenance` vào artifact.
- Nếu `GIAOAN_REQUIRE_CI_PROVENANCE=1` mà không chạy trong GitHub Actions, script fail ở preflight và không cho claim CI proof.
- `data/runtime-p0-hosted-ci-final-proof-policy.json` nâng lên Batch142 và yêu cầu `requireCiProvenance=true` cho evidence `node24_ci_deepest`.
- `runtime-p0-hosted-ci-final-proof-report` và runtime/admin board kiểm tra `ciProvenance.githubActions=true`, `githubWorkflow`, `githubRunId`, `runnerOS` trước khi tính Node24 CI evidence pass.
- Thêm regression validator để chứng minh artifact Node24 local không có GitHub Actions provenance bị chặn, còn artifact có provenance hợp lệ mới pass.

## File tạo mới

- `scripts/validate-batch142-p0-node24-ci-provenance-source.mjs`
- `docs/BATCH142_P0_NODE24_CI_PROVENANCE_HARDENING.md`
- `BATCH142_NOTES.md`

## File sửa

- `package.json`
- `package-lock.json`
- `README.md`
- `data/runtime-p0-hosted-ci-final-proof-policy.json`
- `scripts/verify-p0-deepest.mjs`
- `scripts/runtime-p0-hosted-ci-final-proof-report.mjs`
- `lib/runtime-p0-hosted-ci-final-proof.ts`
- `scripts/validate-batch139-p0-p1-local-evidence-source.mjs`
- `scripts/validate-batch140-p0-p1-evidence-integrity-source.mjs`
- `scripts/validate-batch141-p0-hosted-proof-artifact-integrity-source.mjs`
- `scripts/run-source-validators.mjs`

## Lệnh nên chạy

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run batch142:p0-node24-ci-provenance-validate
npm run source:validate
npm run data:validate
npm run smoke:batch142
npm run runtime:p0-hosted-ci-proof-report
```

## Chưa được claim

- Chưa production-ready.
- Chưa public rollout.
- Chưa đóng hosted proof thật nếu chưa chạy GitHub Actions Node24 thật, Vercel/APP_URL strict smoke, hosted save/export smoke và browser visual smoke thật.
- Local Node24 không còn đủ để claim Node24 CI/Vercel proof.
- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không auto-public community.
