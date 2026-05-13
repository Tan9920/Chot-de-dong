# Batch147 — Real Hosted Proof Run Closure Kit

## Mục tiêu
Batch147 không thêm tính năng giáo án mới. Batch này đóng đúng blocker hiện tại: làm cho lần chạy hosted proof thật trên GitHub Actions Node24 + Vercel APP_URL có thể được đọc, kiểm và kết luận bằng một dossier rõ ràng, thay vì đoán từ log rời rạc.

## Vì sao cần batch này
Batch146 đã có preflight, summary và artifact upload. Nhưng sau khi workflow chạy, vẫn cần một lớp kiểm cuối: tải artifact về, kiểm đủ JSON/MD/PNG, kiểm Node24/GitHub Actions/APP_URL, kiểm visual smoke, kiểm hosted save/export, kiểm public rollout tách riêng, và xuất kết luận go/no-go.

## Lệnh mới
```bash
npm run p0:hosted-proof-closure-dossier
npm run p0:hosted-proof-closure-dossier:strict
npm run batch147:real-hosted-proof-run-closure-validate
npm run smoke:batch147
npm run verify:batch147
```

## Cách chạy hosted proof thật
1. Deploy repo lên Vercel và lấy HTTPS URL thật.
2. Vào GitHub Actions → workflow `P0 Hosted Final Proof`.
3. Chạy `workflow_dispatch` với `app_url=<Vercel URL>` và `strict=true`.
4. Đợi workflow chạy trên Node24.
5. Tải artifact `p0-hosted-final-proof-artifacts`.
6. Giải nén artifact.
7. Chạy kiểm dossier:

```bash
GIAOAN_HOSTED_PROOF_ARTIFACT_ROOT=<thu-muc-giai-nen-artifact> npm run p0:hosted-proof-closure-dossier:strict
```

## Kết luận hợp lệ
Chỉ được nói hosted proof closed khi:
- Preflight artifact pass với Node24, GitHub Actions provenance và HTTPS APP_URL.
- Hosted CI final proof runner strict pass, failed = 0.
- Runtime hosted CI report pass.
- Execution gate có `hostedProofClosed=true`.
- Final summary có `hostedProofClosed=true`.
- Visual smoke có đủ viewport và PNG screenshot thật.
- Không thấy dấu hiệu secret leak trong artifact text.

## Điều vẫn chưa được claim
- Không claim production-ready trong Batch147.
- Không claim public rollout allowed nếu public-rollout readiness chưa pass và chưa có review production DB/security/legal.
- Không dùng local Node22, loopback hoặc dry-run để thay proof thật.
- Không thêm AI, payment, verified giả hoặc community auto-public.

## Ghi chú claim
Dùng tùy chọn `--artifact-root=<thu-muc>` nếu không muốn đặt biến môi trường. Dossier này giúp kiểm hosted proof nhưng vẫn không claim production-ready nếu chưa có review production DB/security/legal.
