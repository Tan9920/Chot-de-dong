# Batch137 — P0 Hosted Evidence Capture Pack

Batch137 tiếp tục đi chậm theo P0/P1. Batch này không thêm tính năng giáo viên mới. Mục tiêu là biến blocker hosted/public thành một bộ capture bằng chứng rõ ràng: Node24 CI, APP_URL hosted smoke, hosted save/export, visual smoke thật và public rollout board.

## Đã thêm

- `data/p0-hosted-evidence-capture-policy.json`: policy capture bằng chứng P0 hosted.
- `lib/p0-hosted-evidence-capture.ts`: board phân loại evidence `pass / blocked / unverified / fail`.
- `/api/runtime/p0-hosted-evidence-capture`: route runtime đọc board.
- `/api/admin/p0-hosted-evidence-capture-board`: route admin yêu cầu `security:read`.
- `scripts/p0-hosted-evidence-capture-report.mjs`: tạo `artifacts/p0-hosted-evidence-capture-report-last-run.json` và checklist markdown.
- `scripts/validate-batch137-p0-hosted-evidence-capture-source.mjs`: validator source-level.
- `.github/workflows/p0-hosted-final-proof.yml`: thêm bước **Batch137 evidence capture report** để upload cùng artifact.

## Bằng chứng bắt buộc trước khi nói public/hosted ổn

1. Node24 CI/deploy proof: `npm run verify:p0-deepest-node24-ci`.
2. APP_URL strict smoke: `APP_URL=https://<vercel-url> npm run verify:release:strict`.
3. Hosted save/export smoke: `GIAOAN_DEMO_URL=https://<vercel-url> npm run hosted:url-smoke`.
4. Visual smoke thật: `npm run visual:smoke:evidence-validate` sau khi có real captures, không phải chỉ template.
5. Public rollout board: `npm run public-rollout:readiness-report`.
6. P0/P1 stability board: `npm run p0-p1:stability-report`.

## Lệnh chính

```bash
npm run batch137:p0-hosted-evidence-capture-validate
npm run p0:hosted-evidence-capture-report
npm run smoke:batch137
npm run verify:batch137
```

## Giới hạn thật

- Public rollout vẫn bị chặn nếu thiếu Node24, APP_URL và visual evidence thật.
- Batch137 không deploy lên Vercel thay người dùng; nó chỉ tạo board/report/runbook để capture evidence đúng.
- Không gọi production-ready.
- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không mở community auto-public.
