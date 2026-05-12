# Batch69 — Basic Web Product Usability & Deployable Demo Guide

Batch69 quay lại phần cơ bản để có một web demo thật sự dễ test: trang chủ rõ mục đích, luồng tạo giáo án ngắn, chỉnh sửa trực tiếp, lưu bản nháp không cần database, xuất DOCX/PDF và health/readiness routes. Tài liệu này không được dùng để claim production-ready nếu chưa có install, typecheck, build và live smoke pass thật.

## 1. Nguyên tắc demo an toàn

- Không thêm AI/API AI/model/agent.
- Không thêm thanh toán thật, marketplace tiền mặt, quỹ tiền mặt hoặc referral nhiều tầng.
- Không public tự do nội dung cộng đồng/forum.
- Không biến seed/scaffold/community thành reviewed/verified nếu chưa có reviewer thật.
- Không bắt giáo viên thường hiểu dashboard governance kỹ thuật mới dùng được web.
- Demo mode chỉ để test luồng sản phẩm, không phải bản triển khai production.

## 2. Luồng người dùng cần ưu tiên

1. Mở trang chủ `/`.
2. Nhìn thấy web này dùng để soạn giáo án, không phải “AI generator”.
3. Chọn lớp, môn, bộ sách/nguồn, bài/chủ đề.
4. Bấm **Tạo khung giáo án**.
5. Chỉnh sửa nội dung trong textarea.
6. Bấm **Lưu bản nháp** để lưu local trong trình duyệt.
7. Bấm **Xuất DOCX** hoặc **Xuất PDF**.
8. Mở file tải về và kiểm tra bố cục.

Nếu luồng này chưa mượt thì chưa nên mở rộng thêm dashboard phức tạp.

## 3. Biến môi trường demo tối thiểu

```env
NEXT_PUBLIC_DEMO_MODE="true"
GIAOAN_DEMO_MODE="true"
GIAOAN_ALLOW_DEMO_LOGIN="true"
NEXT_PUBLIC_DEPLOY_TARGET="vercel_or_render_demo"
DATABASE_URL=""
PDF_FONT_PATH=""
GIAOAN_PRIVILEGED_LOGIN_CODE=""
GIAOAN_REQUIRE_EMAIL_VERIFICATION="false"
GIAOAN_AUTH_MAX_FAILED_LOGIN="8"
GIAOAN_AUTH_LOCK_MINUTES="15"
```

JSON/local fallback là đường chạy khuyến nghị cho demo. Chỉ điền `DATABASE_URL` khi đã tự phát triển tiếp DB mode và verify Prisma thật.

## 4. Lệnh nên chạy trước khi deploy

```bash
npm install
npm run imports:validate
npm run data:validate
npm run demo:readiness-validate
npm run basic-flow:validate
npm run smoke:batch69
npm run typecheck
npm run build
```

Hoặc chạy gộp:

```bash
npm run verify:deploy
```

Nếu lệnh nào fail/timeout/chưa chạy thì phải ghi rõ, không claim pass.

## 5. Routes cần smoke sau khi deploy

- `GET /` — trang chủ + workspace cơ bản.
- `GET /api/health` — kiểm runtime sống.
- `GET /api/demo/readiness` — kiểm source/runtime readiness board.
- `GET /api/demo/basic-flow` — kiểm luồng web cơ bản.
- `GET /api/metadata` — kiểm dữ liệu catalog demo.
- `POST /api/template-builder` — tạo khung giáo án.
- `POST /api/export/docx` — xuất DOCX.
- `POST /api/export/pdf` — xuất PDF.

## 6. Vercel checklist

- Framework: Next.js.
- Install command: `npm install`.
- Build command: `npm run build`.
- Environment variables: dùng block ở mục 3.
- Không cần database để demo cơ bản.
- Sau deploy, mở `/`, `/api/health`, `/api/demo/readiness`, `/api/demo/basic-flow`.

## 7. Render/Docker checklist

- Dockerfile hiện dùng Node 20 Alpine.
- Build image bằng Dockerfile mặc định.
- Set biến môi trường như mục 3.
- Start command trong container: `npm run start`.
- Sau deploy, smoke các route ở mục 5.

## 8. Điều kiện được gọi là “demo dùng được để người khác test”

Chỉ nên gọi là demo dùng được khi có đủ:

- `npm install` pass thật.
- `npm run smoke:batch69` pass thật.
- `npm run typecheck` pass thật.
- `npm run build` pass thật.
- `/api/health` trả `ok=true` trên host thật.
- `/api/demo/basic-flow` không có blocker.
- Tạo khung giáo án được trên UI.
- Lưu nháp local được.
- Xuất DOCX tải về và mở được.
- Xuất PDF tải về và mở được, hoặc ghi rõ PDF chỉ là fallback tối thiểu nếu font tiếng Việt chưa đạt.

Nếu thiếu bất kỳ điều kiện nào, chỉ gọi là source-level demo foundation.

## 9. Những giới hạn còn phải nói thật

- Lưu nháp bằng localStorage chỉ phù hợp demo, không thay database thật.
- Dữ liệu seed/scaffold chưa phải dữ liệu verified toàn bộ lớp 1–12.
- DOCX đã chuyển sang OpenXML tối thiểu để mở được, nhưng cần kiểm tra trình bày thật trong Word/Google Docs.
- PDF là fallback tối thiểu; tiếng Việt có thể không đẹp bằng DOCX nếu chưa dùng font Unicode server-side.
- Governance/compliance vẫn còn trong repo nhưng không nên đẩy ra trước mặt giáo viên thường ở demo đầu.

## Bổ sung Batch70: deploy không chỉ để demo

Trước khi cho người ngoài test, ngoài các endpoint demo cũ, cần kiểm tra thêm:

```bash
/api/product/foundation
```

Endpoint này không thay thế build/typecheck, nhưng giúp xác nhận repo không bỏ sót nền móng dài hạn: định vị không-AI, data truth, plan/usage, moderation, storage path và runtime gates.

Lệnh source-level mới:

```bash
npm run product:foundation-validate
npm run smoke:batch70
```

Vẫn chưa được claim production-ready nếu thiếu:

```bash
npm install
npm run typecheck
npm run build
npm run start
```

## Batch71 storage note

Batch71 thêm JSON persistence cho saved lessons:

- `data/saved-lessons.json`
- `data/saved-lesson-versions.json`

Trên môi trường serverless có filesystem read-only hoặc instance reset, JSON persistence chỉ dùng để demo nội bộ. Nếu host không cho ghi file bền vững, lưu bản nháp có thể fallback về localStorage trên trình duyệt. Không claim đây là database production.

Smoke thêm trước khi cho người khác test:

```bash
npm run saved-lessons:persistence-validate
npm run smoke:batch71
```

Khi chạy server thật, cần test `GET /api/lessons`, `POST /api/lessons`, rồi reload và kiểm tra bản nháp còn được đọc lại từ server JSON.


## Batch72 — Export Quality & Compliance Packet

Export DOCX/PDF now supports `lessonId`/`savedLessonId` so the server can read a saved lesson, attach data-truth labels, draft/review/approved status, watermark, and a compliance packet. This is still source-level/demo foundation; run install/typecheck/build/live smoke and manually open exported files before claiming deploy readiness.


## Batch73 — Runtime Security Closure

Batch73 giảm các điểm demo/no-op lớn trước public demo: session cookie đọc từ JSON session store, CSRF header+cookie, same-origin guard, in-memory rate-limit, password hash bằng scrypt, permission guard theo owner/school/department/visibility, và security audit JSON. Đây vẫn là source-level/demo foundation; chưa claim production-ready nếu install/typecheck/build/live smoke chưa pass.

Lệnh mới: `npm run runtime:security-validate`, `npm run smoke:batch73`, `npm run verify:batch73`.
