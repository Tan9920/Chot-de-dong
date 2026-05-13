# Batch148 — Hosted Proof Evidence Authenticity Lock

## Mục tiêu
Batch148 vẫn ở P0 hosted proof. Batch147 đã có closure dossier để đọc artifact thật; Batch148 thêm lớp anti-stale/authenticity lock để tránh nhầm artifact local, artifact cũ, artifact trộn nhiều lần chạy, hoặc thiếu screenshot PNG thành hosted proof thật.

## Không mở rộng tính năng
Không thêm AI, payment, marketplace, verified giả, community auto-public, hoặc tính năng giáo án mới. Batch này chỉ khóa bằng chứng hosted proof.

## Năng lực mới
- `npm run p0:hosted-proof-authenticity-lock` tạo JSON/Markdown lock report.
- `npm run p0:hosted-proof-authenticity-lock:strict` fail nếu artifact bundle chưa đủ bằng chứng.
- Hỗ trợ đọc artifact bundle tải từ GitHub Actions bằng `GIAOAN_HOSTED_PROOF_ARTIFACT_ROOT=<folder>` hoặc `--artifact-root=<folder>`.
- Hash sha256 mọi JSON bằng chứng quan trọng và screenshot PNG.
- Kiểm timestamp spread để chặn stale/mixed-run evidence.
- Kiểm run identity từ GitHub Actions, Node24, APP_URL HTTPS non-local, closure dossier, visual evidence và public rollout readiness.

## Cách dùng sau khi có Vercel URL
```bash
# 1. Vào GitHub Actions > P0 Hosted Final Proof
# 2. Run workflow với app_url=https://<vercel-url>, strict=true
# 3. Tải artifact p0-hosted-final-proof-artifacts và giải nén
GIAOAN_HOSTED_PROOF_ARTIFACT_ROOT=<thu-muc-artifact-da-giai-nen> npm run p0:hosted-proof-authenticity-lock:strict
```

## Claim guard
Nếu strict lock chưa pass, không claim hosted proof closed/public rollout/production-ready. Kể cả lock pass, production-ready vẫn cần production DB/security/legal review riêng.

## Vì sao cần anti-stale
Một repo local có thể có nhiều file `last-run.json` sinh từ các ngày khác nhau. Nếu không khóa timestamp, SHA-256, run identity và screenshot inventory, người đọc dễ nhầm local/old artifact là proof thật. Batch148 chặn rủi ro này.

## Kết quả mong đợi local
Trong môi trường local chưa có GitHub Actions Node24 + APP_URL, command thường tạo report `authenticityLocked=false`. Đây là đúng, không phải lỗi.

Ghi chú bắt buộc: không claim production-ready nếu chưa có production DB/security/legal review thật.
