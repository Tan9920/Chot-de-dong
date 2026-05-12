# Batch140 — P0/P1 Evidence Report Integrity Fix

## Mục tiêu

Batch140 sửa đúng blocker evidence-quality phát hiện sau Batch139: `p0-p1-local-evidence-report` không được coi artifact runner còn `status="running"`, `completed < total` là pass chỉ vì `ok=true`.

## Thay đổi chính

- `scripts/p0-p1-local-evidence-report.mjs` kiểm tra riêng runner artifact bằng luật nghiêm ngặt:
  - `ok === true`
  - `status === "pass"`
  - `completed === total`
  - `commands.length === total`
  - mọi command có `ok === true` và `status === "pass"`
- `lib/p0-p1-local-evidence.ts` áp dụng cùng luật cho runtime/admin board.
- `scripts/p0-p1-local-evidence-runner.mjs` ghi artifact đang chạy với `ok=false`, `status="running"` để timeout/interruption không thể bị report đọc nhầm là pass.
- Runner không gọi lồng `npm run p0-p1:local-evidence-report` nữa; report phải chạy sau runner để tránh vòng tự kiểm tra khi runner chưa hoàn tất.
- Thêm validator hồi quy `scripts/validate-batch140-p0-p1-evidence-integrity-source.mjs` mô phỏng artifact `ok=true/status=running/completed<total` và xác nhận report fail đúng.

## Không thay đổi

- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không mở auto-public community.
- Không cho user tự chọn admin/tổ trưởng/trường.
- Không mở hosted/public rollout.

## Verify gợi ý

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run batch140:p0-p1-evidence-integrity-validate
npm run source:validate
npm run data:validate
npm run smoke:batch140
npm run p0-p1:local-evidence-runner
npm run p0-p1:local-evidence-report
npm run p0-p1:stability-report
npm run p0:hosted-proof-execution-report
```

## Vẫn chưa đóng

- Node24 CI thật.
- Vercel/APP_URL hosted strict smoke thật.
- Browser visual smoke evidence thật.
- Production DB/security/legal review.
- Production-ready/public rollout.
