# BATCH136 NOTES — P0/P1 Stability Gate

Batch136 ưu tiên ổn định theo P0/P1, không mở thêm feature lớn.

Đã thêm:

- P0/P1 stability policy để tách rõ local P0, P1 foundation và hosted/public proof.
- Runtime board `/api/runtime/p0-p1-stability`.
- Admin board `/api/admin/p0-p1-stability-board` yêu cầu quyền `security:read`.
- Report script `npm run p0-p1:stability-report` ghi `artifacts/p0-p1-stability-report-last-run.json`.
- Validator `npm run p0-p1:stability-validate`.
- README được cập nhật để không còn mở đầu bằng trạng thái Batch100 cũ.

Giới hạn thật:

- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không mở community auto-public.
- Không gọi production-ready.
- public rollout remains blocked nếu thiếu Node24/Vercel/APP_URL/visual proof thật.

Lệnh chính:

```bash
npm run smoke:batch136
npm run verify:batch136
```
