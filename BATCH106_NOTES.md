# BATCH106 — Real Hosted Runtime Closure / Vercel Log Fix

## Mục tiêu

Batch106 tiếp tục đúng hướng Batch105 nhưng siết chặt hơn vào hosted runtime proof: registry, npm install sạch, Next/SWC, build, local production smoke, auth invite smoke, hosted URL smoke và QA browser. Batch này không thêm feature mới, không thêm AI, không thêm payment và không nâng dữ liệu học thuật verified giả.

## Vì sao chọn Batch106

Post-Batch105 audit chỉ ra blocker lớn nhất không phải thiếu ý tưởng sản phẩm mà là chưa chứng minh install/build/runtime/hosted pass. Nếu không đóng chuỗi này, giáo viên không test demo thật được. Vì vậy Batch106 ưu tiên runtime/hosted proof thay vì UI đẹp hơn hoặc dữ liệu học thuật mới.

## Đã thêm

- Hosted runtime evidence plan: `data/runtime-hosted-closure-evidence.json`.
- Hosted runtime closure library: `lib/runtime-hosted-closure.ts`.
- API teacher/admin:
  - `GET /api/runtime/hosted-closure`
  - `POST /api/runtime/hosted-closure` dry-run log/evidence classifier
  - `GET /api/admin/hosted-runtime-board`
- Report script: `scripts/runtime-hosted-closure-report.mjs`.
- Source validator: `scripts/validate-batch106-runtime-hosted-closure-source.mjs`.
- Workspace card: `runtime-hosted-closure-card`.
- Demo breakthrough report now includes `runtimeHostedClosure`.
- Vercel env marker: `GIAOAN_BATCH106_HOSTED_RUNTIME_GATE=real_hosted_runtime_proof_required`.

## Không làm

- Không tạo verified giả.
- Không nâng `contentDepthAllowed`.
- Không thêm AI / OpenAI / Gemini / Anthropic SDK.
- Không thêm payment thật.
- Không chuyển JSON fallback sang DB production.
- Không claim production-ready.

## Lệnh chính

```bash
npm run smoke:batch106
npm run runtime:hosted-closure-report
npm run verify:batch106
```

## Điều kiện mới được mời nhóm nhỏ test

Chỉ cân nhắc khi các lệnh sau pass thật:

```bash
npm run registry:diagnose
npm run install:clean
npm run next:swc-ready
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke
```

Không claim production-ready kể cả khi pass nhóm này, vì vẫn còn DB production, browser QA rộng, security hardening thật, verified học thuật thật và moderation/community pháp lý dài hạn.
