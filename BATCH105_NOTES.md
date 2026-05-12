# BATCH105 — Runtime/Hosted Closure Breakthrough

## Mục tiêu

Batch105 không thêm AI, không thêm payment, không tạo verified giả và không làm đẹp số liệu học thuật. Batch này xử lý điểm nghẽn lớn nhất sau Batch104: install/build/runtime/hosted chưa được chứng minh.

## Đã thêm

- Runtime/hosted closure evidence plan: `data/runtime-deploy-closure-plan.json`.
- Runtime deploy closure library: `lib/runtime-deploy-closure.ts`.
- API teacher/admin:
  - `GET /api/runtime/deploy-closure`
  - `POST /api/runtime/deploy-closure` dry-run evidence evaluation only
  - `GET /api/admin/runtime-deploy-board`
- Workspace card: `runtime-deploy-closure-card`.
- Demo breakthrough report now includes `runtimeDeployClosure`.
- Source validator: `scripts/validate-batch105-runtime-deploy-closure-source.mjs`.
- Report script: `scripts/runtime-deploy-closure-report.mjs`.
- Vercel install/build command now goes through clean scripts.
- `.node-version` added to match Node 22.16.0 audit environment.

## Không làm

- Không tạo verified giả.
- Không nâng `contentDepthAllowed`.
- Không thêm AI / OpenAI / Gemini / Anthropic SDK.
- Không thêm payment thật.
- Không chuyển JSON fallback sang DB production.
- Không claim production-ready.

## Lệnh chính

```bash
npm run smoke:batch105
npm run runtime:deploy-closure-report
npm run verify:batch105
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

Không claim production-ready kể cả khi pass nhóm này, vì vẫn còn DB production, bảo mật, browser QA, dữ liệu học thuật verified, moderation/community và pháp lý dài hạn.
