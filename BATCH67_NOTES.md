# Batch67 — Deployable Demo & Runtime Closure Breakthrough

## Mục tiêu

Batch67 không thêm tính năng rời rạc. Batch này chuyển trọng tâm từ source-level foundation sang khả năng demo/deploy minh bạch:

- Có `GET /api/health`.
- Có `GET /api/demo/readiness`.
- Có `DemoReadinessBoard` để báo rõ blocker/warning/checks/smoke flow.
- Có `DEPLOYMENT_DEMO_GUIDE.md` cho Vercel/Render/local demo.
- Workspace tab `Vận hành 1–12` hiển thị Batch67 demo readiness.
- Operating board nối `demoReadiness` để không còn cảm giác “9 mấy %” mơ hồ.

## File tạo mới

- `BATCH67_NOTES.md`
- `DEPLOYMENT_DEMO_GUIDE.md`
- `lib/demo-readiness.ts`
- `app/api/health/route.ts`
- `app/api/demo/readiness/route.ts`
- `scripts/validate-demo-readiness-source.mjs`
- `scripts/smoke-batch67-demo-runtime-source.mjs`
- `scripts/verify-batch67-source.mjs`

## File sửa

- `lib/types.ts`
- `lib/product-operating.ts`
- `components/workspace.tsx`
- `data/operating-config.json`
- `.env.example`
- `package.json`

## Chính sách an toàn giữ nguyên

- Không thêm AI/API AI/model/agent.
- Không thêm thanh toán thật.
- Không marketplace tiền mặt.
- Không quỹ tiền mặt.
- Không referral nhiều tầng.
- Không public cộng đồng/forum tự do.
- Không verified giả cho seed/scaffold.
- Demo mode không thay thế production hardening.

## Demo/runtime truth

Batch67 tạo nền demo readiness rất rõ, nhưng không được claim production-ready nếu chưa có:

- `npm ci` pass thật.
- `npm run typecheck` pass thật.
- `npm run build` pass thật.
- `npm run prisma:generate` pass thật hoặc xác nhận JSON fallback demo.
- Live HTTP smoke thật với session/cookie/CSRF.

Nếu thiếu node_modules/local toolchain, readiness board phải báo blocker.

## Scripts mới

```bash
npm run demo:readiness-validate
npm run smoke:batch67
npm run verify:batch67
```

Các script này là source-level, không thay thế runtime/build thật.
