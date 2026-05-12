# Batch139 — P0/P1 Local Evidence Lift

Batch139 strengthens the local P0/P1 proof chain without adding new teacher-facing features.

## What changed

- Added a current-run local evidence runner: `npm run p0-p1:local-evidence-runner`.
- Added command evidence wrappers for typecheck, Next/SWC readiness, artifact hygiene, route contract and runtime preflight.
- Added `data/p0-p1-local-evidence-policy.json` and a runtime/admin evidence board.
- Updated the P0/P1 stability gate so local proof no longer depends on manual pass notes for typecheck/SWC.

## What this proves

When the Batch139 local evidence runner passes on Node22, local P0/P1 evidence is smoother and stronger than the earlier 95–97% estimate because the core checks are backed by current-run artifacts.

## What this does not prove

- It does not prove Node24 CI.
- It does not prove Vercel/hosted APP_URL strict smoke.
- It does not prove real browser visual smoke.
- It does not make the project production-ready.

## Guardrails

- Không thêm AI.
- Không thêm thanh toán.
- Không tạo verified giả.
- Không auto-public cộng đồng.
- Không cho người dùng tự chọn admin/tổ trưởng khi đăng ký.
