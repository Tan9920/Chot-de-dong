# Batch88 — Feedback Evidence Dossier + Demo Expansion Gate

## Mục tiêu

Nâng cấp sâu phần kiểm soát demo sau Batch87: không chỉ có tester pack, mà có nơi nhận feedback thật, board tổng hợp P0/P1/P2/P3, privacy gate, source validator và launch gate biết dừng mở rộng nếu feedback có blocker.

## Thay đổi chính

- Thêm `lib/demo-feedback-intake.ts`.
- Thêm `data/demo-feedback-submissions.json`.
- Thêm `GET/POST /api/demo/feedback`.
- Thêm `GET /api/admin/demo/feedback` cho admin/reviewer, trả dữ liệu redacted.
- `lib/demo-tester-pack.ts` nay đính kèm feedback board/form config.
- `lib/hosted-demo-launch-gate.ts` nay kiểm `demo_feedback_evidence_dossier` và chặn nếu có P0/P1 mở.
- `scripts/hosted-demo-url-smoke.mjs` kiểm GET/POST feedback intake.
- Thêm `scripts/validate-batch88-demo-feedback-evidence-source.mjs`.
- Cập nhật `data/hosted-demo-release-checklist.json`, `package.json`, `package-lock.json`, `scripts/run-source-validators.mjs`.

## Không làm

- Không thêm AI/API model.
- Không thêm thanh toán thật.
- Không marketplace/quỹ tiền mặt/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không claim production-ready.

## Verify kỳ vọng

- `npm run demo:feedback-validate`
- `npm run smoke:batch88`
- `npm run typecheck`
- Sau khi deploy thật: `GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke`

## Rủi ro còn lại

- Chưa có feedback giáo viên thật nếu chưa deploy và gửi link.
- JSON feedback store chỉ phù hợp demo/foundation, production cần DB/locking/backup.
- Build/live smoke vẫn phải chạy trên host thật trước khi mời test rộng.

## Marker kiểm soát

- không thêm AI.
- chưa production-ready.
