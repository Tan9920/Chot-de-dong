# Batch138 — P0 Hosted Proof Execution Gate

Batch138 tiếp tục hướng P0/P1 ổn định trước khi mở rộng tính năng. Batch này không thêm tính năng giáo viên mới. Mục tiêu là thêm một **P0 hosted proof execution gate** để gom Node24, APP_URL, hosted save/export, visual smoke, P0/P1 stability và public rollout readiness vào một báo cáo duy nhất.

## Vì sao chọn batch này

Batch137 đã có evidence capture pack, nhưng vẫn còn rủi ro vận hành: nhiều artifact nằm rải rác nên dễ overclaim rằng hosted proof đã xong. Batch138 thêm gate đọc artifact thật, phân loại blocker và liệt kê lệnh tiếp theo.

## File/chức năng mới

- `data/p0-hosted-proof-execution-gate-policy.json`: policy hard gate cho Node24, APP_URL, hosted save/export, visual smoke, capture board và public rollout readiness.
- `lib/p0-hosted-proof-execution-gate.ts`: builder cho runtime/admin board.
- `/api/runtime/p0-hosted-proof-execution-gate`: board runtime read-only.
- `/api/admin/p0-hosted-proof-execution-gate-board`: board admin yêu cầu quyền `security:read`.
- `scripts/p0-hosted-proof-execution-gate-report.mjs`: tạo artifact `artifacts/p0-hosted-proof-execution-gate-last-run.json` và checklist markdown.
- `scripts/validate-batch138-p0-hosted-proof-execution-source.mjs`: validator source contract.

## Lệnh chính

```bash
npm run batch138:p0-hosted-proof-execution-validate
npm run p0:hosted-proof-execution-report
npm run smoke:batch138
npm run verify:batch138
```

## Điều kiện hosted proof đóng thật

Tất cả gate sau phải pass bằng artifact thật:

1. `npm run verify:p0-deepest-node24-ci`
2. `APP_URL=https://<vercel-url> npm run verify:release:strict`
3. `GIAOAN_DEMO_URL=https://<vercel-url> npm run hosted:url-smoke`
4. `npm run visual:smoke:evidence-validate`
5. `npm run p0-p1:stability-report`
6. `npm run p0:hosted-evidence-capture-report`
7. `npm run public-rollout:readiness-report`

## Không overclaim

- Không nói production-ready.
- Không nói public rollout allowed nếu public rollout report còn false.
- Không nói hosted proof closed nếu Node24/APP_URL/visual/save-export artifacts chưa pass.
- Không nói visual smoke pass nếu chỉ có template.
- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không auto-public community.

## Trạng thái thật kỳ vọng trong local Node22

Ở local Node22 hoặc khi thiếu APP_URL, report nên ghi `hostedProofClosed=false` và liệt kê blocker. Đây là kết quả đúng, không phải lỗi sản phẩm. Hosted proof thật phải chạy trên Node24/GitHub Actions/Vercel hoặc môi trường tương đương.
