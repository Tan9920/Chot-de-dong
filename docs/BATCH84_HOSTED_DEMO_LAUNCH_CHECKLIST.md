# Batch84 Hosted Demo Launch Checklist

Batch84 does not claim production readiness. It creates a safer path for pushing the non-AI Lesson Design Studio demo to a hosted test URL and deciding whether that URL is safe to share with a small feedback group.

## What must pass before sharing a demo link

Run these on the actual host/CI environment, not only in a local ZIP audit:

```bash
npm run registry:diagnose
npm run lockfile:public-registry
npm run install:clean
npm run next:swc-ready
npm run data:validate
npm run source:validate
npm run hosted-demo:launch-gate-validate
npm run hosted-demo:preflight
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run runtime:preflight
npm run verify:batch85
```

If any command fails, do not call the demo stable.

## Public test boundary

- Share only with a limited test group.
- Say this is a demo for feedback, not a production product.
- Do not say “AI tạo giáo án chuẩn”, “chuẩn Bộ 100%”, “dùng ngay không cần sửa”, or “không vi phạm bản quyền”.
- Make testers check DOCX/PDF by opening the real files.
- Ask testers to report: create flow, save flow, export flow, mobile layout, wording clarity, Vietnamese font issues, and data-truth warnings.

## Minimal hosted demo environment

```env
NEXT_PUBLIC_DEMO_MODE=true
GIAOAN_DEMO_MODE=true
GIAOAN_ALLOW_DEMO_LOGIN=true
GIAOAN_PUBLIC_TEST_MODE=limited
NEXT_TELEMETRY_DISABLED=1
```

## Route to inspect after deployment

Open these routes after deployment:

- `/api/health`
- `/api/demo/readiness`
- `/api/demo/launch-gate`
- `/api/product/foundation`
- `/api/lesson-design/studio?grade=1&subject=Ti%E1%BA%BFng%20Vi%E1%BB%87t&topic=Demo`

## Manual QA matrix

- Android Chrome, small screen.
- Desktop Chrome.
- Create lesson frames for grade 1, grade 5, grade 6, grade 10.
- Try standard, support, advanced learner profile.
- Try entrance exam / THPT exam mode without accepting invented answers.
- Save draft, reopen, export DOCX, export PDF.
- Confirm all seed/scaffold warnings are visible.
