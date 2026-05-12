# Batch86 — Hosted URL Runtime Smoke + Share-Control Evidence

## Mục tiêu

Batch86 không thêm AI và không thêm tính năng thương mại mới. Batch này tập trung nâng cấp đường kiểm chứng demo thật sau khi deploy: không chỉ build/local smoke, mà phải có script đánh vào domain Vercel/host thật trước khi chia link.

## Thay đổi chính

- Thêm `scripts/hosted-demo-url-smoke.mjs`.
- Thêm `scripts/validate-batch86-hosted-url-runtime-source.mjs`.
- Thêm `docs/BATCH86_HOSTED_RUNTIME_TEST_GUIDE.md`.
- `package.json` lên `0.86.0`.
- Thêm scripts:
  - `hosted:url-smoke`
  - `hosted:url-smoke:optional`
  - `hosted:url-smoke-source-validate`
  - `smoke:batch86`
  - `verify:batch86`
- GitHub Actions nhận `GIAOAN_DEMO_URL` và `VERCEL_AUTOMATION_BYPASS_SECRET`, chạy hosted smoke nếu có URL, upload artifact.
- Launch gate đọc `artifacts/hosted-demo-url-smoke-last-run.json` để hiện trạng thái `hosted_url_smoke_runtime_state`.
- Hosted checklist yêu cầu chạy:
  - `GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke`

## Hosted URL Runtime Smoke kiểm gì?

- `/`
- `/api/health`
- `/api/metadata`
- `/api/demo/readiness`
- `/api/demo/basic-flow`
- `/api/demo/launch-gate`
- `/api/product/foundation`
- `/api/operating/foundation`
- `/api/operating/usage`
- `/api/lesson-design/studio`
- `/api/subject-data/review-board`
- `/api/lesson-drafting/profiles`
- `/api/auth/csrf`
- `POST /api/template-builder`
- `POST /api/lesson-design/studio`
- `POST /api/export/docx`
- `POST /api/export/pdf`

## Giới hạn trung thực

Batch86 không chứng minh production-ready nếu chưa chạy trên domain thật. Trong môi trường chỉ có source ZIP, script source validator có thể pass, nhưng `hosted:url-smoke` strict cần `GIAOAN_DEMO_URL`.

## Không làm

- Không thêm AI.
- Không thêm OpenAI/Gemini/Anthropic SDK.
- Không thêm thanh toán thật.
- Không thêm marketplace/quỹ/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không public cộng đồng tự do.

## Lệnh chính

```bash
npm run smoke:batch86
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
npm run verify:batch86
```
