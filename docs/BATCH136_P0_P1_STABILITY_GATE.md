# Batch136 — P0/P1 Stability Gate

Batch136 không thêm tính năng giáo viên mới. Batch này khóa lại hướng “từ từ, ổn P0/P1 trước” bằng một gate riêng để các batch sau không nhầm source/local evidence với hosted/public evidence.

## Vì sao chọn batch này

Sau Batch134–135, repo đã có thêm giao diện/tính năng từ file kế hoạch và đã được gắn guardrail. Blocker thật tiếp theo không phải mở thêm module, mà là giữ P0/P1 ổn định:

- P0 local/build/runtime phải chạy lại rõ.
- P1 auth/role/security chỉ được coi là foundation khi smoke thật còn pass.
- Public rollout vẫn bị chặn nếu thiếu Node24, APP_URL hosted smoke và visual evidence thật.
- Không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public cộng đồng.

## File chính

- `data/p0-p1-stability-gate-policy.json`
- `lib/p0-p1-stability-gate.ts`
- `app/api/runtime/p0-p1-stability/route.ts`
- `app/api/admin/p0-p1-stability-board/route.ts`
- `scripts/p0-p1-stability-report.mjs`
- `scripts/validate-batch136-p0-p1-stability-source.mjs`

## Cách đọc kết quả

- `localP0Stable=true`: chỉ nói được local/source/runtime evidence đang sạch theo artifact có sẵn và manual command phải chạy lại.
- `p1FoundationSourceReady=true`: chỉ cho phép P1 source work có kiểm soát, không phải public rollout.
- `publicP1RolloutAllowed=false`: trạng thái mặc định cho tới khi hosted proof thật pass.
- `productionReady=false`: luôn giữ false trong batch này.

## Lệnh chính

```bash
npm run p0-p1:stability-validate
npm run p0-p1:stability-report
npm run smoke:batch136
npm run verify:batch136
```

## Giới hạn

Batch136 là source-level/runtime-evidence gate. Nó không thay thế GitHub Actions Node24, Vercel APP_URL strict smoke, browser visual smoke, production DB/security review hoặc legal review.

public rollout remains blocked.
