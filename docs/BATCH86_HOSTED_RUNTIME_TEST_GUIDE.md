# BATCH86 HOSTED RUNTIME TEST GUIDE

Mục tiêu: kiểm tra domain Vercel/host thật sau khi deploy, không chỉ kiểm source-level trong repo.

## Lệnh bắt buộc trước khi chia link demo

```bash
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
```

Nếu deployment bật Vercel Deployment Protection, cấu hình secret trong GitHub/Vercel CI:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=...
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
```

Script sẽ gửi header `x-vercel-protection-bypass` khi có `VERCEL_AUTOMATION_BYPASS_SECRET`.

## Script kiểm gì?

- Trang chủ `/`.
- `GET /api/health`.
- `GET /api/metadata`.
- `GET /api/demo/readiness`.
- `GET /api/demo/basic-flow`.
- `GET /api/demo/launch-gate`.
- `GET /api/product/foundation`.
- `GET /api/operating/foundation`.
- `GET /api/operating/usage`.
- `GET /api/lesson-design/studio`.
- `GET /api/subject-data/review-board`.
- `GET /api/lesson-drafting/profiles`.
- `GET /api/auth/csrf`.
- `POST /api/template-builder` có CSRF.
- `POST /api/lesson-design/studio` có CSRF.
- `POST /api/export/docx`.
- `POST /api/export/pdf`.

## Artifact

Kết quả được ghi vào:

```bash
artifacts/hosted-demo-url-smoke-last-run.json
```

Launch gate sẽ đọc artifact này nếu có để hiển thị trạng thái `hosted_url_smoke_runtime_state`.

## Quy tắc chia link

- không chia link rộng nếu `hosted:url-smoke` chưa pass trên domain thật.
- Không gửi `VERCEL_AUTOMATION_BYPASS_SECRET` cho người test ngoài.
- Không coi script pass là production-ready.
- Vẫn phải test mobile thật: Android màn hình nhỏ, iPhone/Safari nếu có, mở DOCX/PDF tải về.
- Vẫn phải giữ cảnh báo: không-AI, seed/scaffold, giáo viên tự kiểm tra nội dung trước khi dùng.
