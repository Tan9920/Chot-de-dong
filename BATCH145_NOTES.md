# Batch145 — Hosted Proof Artifact Upload Closure

## Mục tiêu

Sau Batch144, Local/source P0/P1 đã là closed source candidate. Batch145 chọn đúng blocker tiếp theo: hosted/public proof chưa đóng vì cần bằng chứng chạy thật trên hosted URL, đặc biệt screenshot visual smoke thật phải được upload cùng artifact GitHub Actions để audit sau này.

## Thay đổi chính

- Thêm `data/batch145-hosted-proof-artifact-upload-policy.json`.
- Thêm `scripts/validate-batch145-hosted-proof-artifact-upload-source.mjs`.
- Thêm `docs/BATCH145_HOSTED_PROOF_ARTIFACT_UPLOAD_CLOSURE.md`.
- Sửa `.github/workflows/p0-hosted-final-proof.yml` để upload:
  - `artifacts/*.json`
  - `artifacts/*.md`
  - `artifacts/visual-smoke/**/*.png`
- Thêm scripts Batch145 trong `package.json`.
- Đưa validator Batch145 vào `source:validate`.

## Claim policy

Được claim: hosted proof artifact upload/auditability đã được nâng ở mức source-level.

Không được claim: hosted proof closed, public rollout allowed, production-ready, 100%, visual smoke pass nếu chưa có workflow Node24 + APP_URL + screenshot PNG artifact thật.

## Không đổi

Không thêm AI, không thêm payment, không tạo verified giả, không mở community auto-public, không cho tự chọn role cao.
