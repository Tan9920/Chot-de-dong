# Batch141 — P0 Hosted Proof Artifact Disambiguation

Batch141 là batch P0 evidence-quality. Nó xử lý rủi ro report/board hosted proof đọc nhầm một artifact release chung thành nhiều loại proof khác nhau.

## Vấn đề trước Batch141

Trước batch này, `hosted_release_strict` và `p0_100_release` cùng trỏ tới `artifacts/verify-release-last-run.json`. Nếu `verify:release:strict` pass, report có thể đọc artifact đó là đủ cho `p0_100_release`, dù artifact không chứng minh `requireNode24=true` và `requireVisualSmoke=true`.

## Cách sửa

1. `verify:release:strict` ghi artifact riêng:
   - `artifacts/verify-release-strict-last-run.json`
   - `proofProfile=hosted_release_strict`
   - `requireHostedUrl=true`
   - `requireVisualSmoke=false`

2. `verify:p0-100-release` ghi artifact riêng:
   - `artifacts/verify-p0-100-release-last-run.json`
   - `proofProfile=p0_100_release`
   - `requireNode24=true`
   - `requireHostedUrl=true`
   - `requireVisualSmoke=true`

3. Report/board kiểm tra `artifactContract` trước khi tính pass.

4. Runner hosted CI final proof có bước riêng `p0-100-release-proof`.

## Ý nghĩa

Batch141 không làm app production-ready. Nó chỉ làm bằng chứng trung thực hơn: artifact hosted strict không thể thay thế artifact P0-100 release.

## Gate còn thiếu

- Node24 GitHub Actions/Vercel thật.
- APP_URL hosted strict smoke thật.
- Hosted account save/export smoke thật.
- Browser visual smoke evidence thật.
- Production DB/security/legal review.

## Guardrail giữ nguyên

- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không public cộng đồng tự động.
- Không claim “chuẩn Bộ”, “100%”, “production-ready”.
