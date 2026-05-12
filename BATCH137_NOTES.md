# BATCH137 NOTES — P0 Hosted Evidence Capture Pack

Batch137 chọn blocker P0 thật còn lại: hosted/public proof chưa đóng. Batch này giữ P0/P1 ổn định trước, không thêm tính năng giáo viên mới.

Đã thêm:

- P0 hosted evidence capture policy.
- Runtime board `/api/runtime/p0-hosted-evidence-capture`.
- Admin board `/api/admin/p0-hosted-evidence-capture-board` yêu cầu quyền `security:read`.
- Report script `npm run p0:hosted-evidence-capture-report` ghi JSON report và checklist markdown vào `artifacts/`.
- Validator `npm run batch137:p0-hosted-evidence-capture-validate`.
- Workflow P0 Hosted Final Proof có thêm bước Batch137 evidence capture report.

Giới hạn thật:

- Public rollout vẫn bị chặn nếu chưa có Node24 CI/Vercel proof, APP_URL hosted smoke thật và visual evidence thật.
- Batch137 không thay thế việc deploy thật lên Vercel.
- Không production-ready.
- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không auto-public community.

Lệnh chính:

```bash
npm run smoke:batch137
npm run verify:batch137
```
