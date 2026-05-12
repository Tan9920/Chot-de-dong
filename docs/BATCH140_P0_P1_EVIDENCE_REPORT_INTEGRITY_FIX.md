# Batch140 — P0/P1 Evidence Report Integrity Fix

Batch140 là batch sửa chất lượng bằng chứng, không phải batch thêm tính năng giáo viên mới.

## Vấn đề được sửa

Sau Batch139, có trường hợp artifact `artifacts/p0-p1-local-evidence-runner-last-run.json` còn ở trạng thái đang chạy hoặc bị timeout/incomplete, ví dụ:

```json
{
  "ok": true,
  "status": "running",
  "completed": 6,
  "total": 12
}
```

Nếu report chỉ nhìn `ok === true`, hệ thống có thể hiểu nhầm runner đã pass. Điều này làm bằng chứng P0/P1 local bị phồng quá mức trước khi có Node24/Vercel/visual proof thật.

## Luật mới

Runner artifact chỉ được tính là pass khi đồng thời thỏa mãn:

1. `ok === true`
2. `status === "pass"`
3. `completed === total`
4. `commands.length === total`
5. mọi command có `ok === true` và `status === "pass"`

Nếu artifact đang chạy, timeout, thiếu command, hoặc có command không pass, report/board phải hiển thị `running` hoặc `fail`, không phải `pass`.

## Cách chạy đúng sau Batch140

```bash
npm run p0-p1:local-evidence-runner
npm run p0-p1:local-evidence-report
```

Không chạy report như một command bên trong runner nữa, vì lúc đó runner chưa thể có `status="pass"` và `completed===total`.

## Kết luận phạm vi

Batch140 giúp local P0/P1 evidence trung thực hơn. Nó không thay thế Node24 CI, hosted APP_URL smoke, real browser visual smoke, production DB, security review hoặc legal review.

Không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public community.
