# Batch106 Real Hosted Runtime Closure / Vercel Log Fix

Batch106 bổ sung một tầng evidence board mới cho hosted runtime. Batch105 đã chỉ ra blocker, nhưng Batch106 tách rõ hơn giữa source-level gate, log classifier, artifact proof và claim được phép nói với giáo viên.

## Gate bắt buộc

1. `npm run registry:diagnose`
2. `npm run install:clean`
3. `npm run next:swc-ready`
4. `npm run build:clean`
5. `GIAOAN_SMOKE_MODE=production npm run live:smoke:clean`
6. `npm run auth-invite:runtime-smoke`
7. `GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke`
8. QA browser mobile/desktop trước khi mở rộng tester

Nếu một bước fail, timeout hoặc chưa chạy, không được nói bước đó đã pass.

## API mới

- `GET /api/runtime/hosted-closure`: trả board proof hiện tại.
- `POST /api/runtime/hosted-closure`: nhận log/evidence, phân loại blocker dạng dry-run. Không chạy build/deploy và không sửa dữ liệu.
- `GET /api/admin/hosted-runtime-board`: board admin.

## Log classifier

`classifyHostedRuntimeLog` nhận log Vercel/npm/build/runtime và phân loại các tín hiệu như:

- DNS/registry failure: `EAI_AGAIN`, `fetch failed`, `registry.npmjs.org`.
- npm timeout/CLI issue: `npm_ci_timeout`, `Exit handler never called`, `timeout`.
- Next binary missing: `next: not found`, `node_modules/.bin/next missing`.
- SWC missing: `@next/swc`, optional package missing.
- Build failed: `Failed to compile`, `build failed`, `exit code: 1`.
- Runtime smoke dependency blocker: `dependencies_missing`.
- Hosted smoke missing URL/skipped.

Log classifier chỉ hỗ trợ phân loại; proof thật vẫn là command/artifact pass.

## Điều được nói

- Có hosted-runtime evidence board Batch106.
- Có endpoint dry-run để dán log Vercel/npm/build và phân loại blocker.
- Có script `runtime:hosted-closure-report` để ghi artifact hiện trạng.
- Batch106 không thêm AI, không thêm payment, không tạo verified giả.

## Điều không được nói

- Không nói production-ready.
- Không nói build pass nếu chưa có `.next/BUILD_ID` sau `npm run build:clean`.
- Không nói runtime pass nếu live smoke/auth smoke chưa pass.
- Không nói hosted demo đã ổn nếu chưa có hosted URL smoke ok=true cho URL thật.
- Không nói dữ liệu 1–12 đã verified.

## Hướng tiếp theo

Nếu registry/install/build vẫn fail trên host thật, Batch107 phải xử lý dựa trên Vercel logs cụ thể: DNS, lockfile, optional dependencies, Node version, cache, npm command, hoặc Next/SWC. Nếu chuỗi runtime pass thật, mới cân nhắc nhóm nhỏ giáo viên test có kiểm soát.
