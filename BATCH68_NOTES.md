# Batch68 — Deploy Stability & Missing Runtime Files Closure

## Mục tiêu đúng theo yêu cầu

Batch này không thêm ý tưởng sản phẩm mới. Trọng tâm là làm repo có đường chạy web demo ổn định hơn, đặc biệt khi ZIP đầu vào Batch67 bị thiếu/corrupt các file nền deploy.

## Phát hiện audit đầu vào

- ZIP upload tên `giao-an-mvp-vn-batch67-deployable-demo-runtime-closure.zip` không giải nén được bằng `unzip` vì thiếu central directory.
- Đã khôi phục bằng local ZIP entries, nhưng repo trích xuất chỉ có 188 file.
- Thiếu các file cực quan trọng để deploy/build:
  - `package.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `postcss.config.mjs`
  - `tailwind.config.ts`
  - `next-env.d.ts`
  - phần lớn `lib/*`
  - `scripts/*`
  - `prisma/*`
  - `public/*`
- Nếu đẩy nguyên ZIP Batch67 lên web sẽ rất dễ lỗi install/build/import/runtime.

## Thay đổi chính

### 1. Bổ sung nền deploy/build

- Tạo `package.json` pin Next.js 15 + React 19 + TypeScript + Tailwind 3.
- Tạo `tsconfig.json` có alias `@/*`.
- Tạo `next.config.ts`.
- Tạo `postcss.config.mjs` và `tailwind.config.ts`.
- Tạo `next-env.d.ts`.
- Tạo `.gitignore`.
- Tạo `public/robots.txt`.
- Sửa `Dockerfile` sang đường build demo không phụ thuộc Prisma.
- Sửa `.env.example` để mặc định JSON fallback/demo mode, không đặt sẵn fake `DATABASE_URL`.

### 2. Khép import/runtime tối thiểu

Vì ZIP thiếu `lib/*`, Batch68 bổ sung các module runtime tối thiểu để route không vỡ import, gồm các nhóm:

- auth/session demo-safe
- runtime security/CSRF/rate/write guard demo-safe
- content repository fallback
- content management fallback/proxy
- storage JSON in-memory fallback
- generator khung giáo án an toàn
- quality checklist
- governance/compliance/export guard
- operating/demo readiness
- community/forum/legal/activity-game moderation fallback
- release dossier/signoff fallback
- pedagogy/grade structure/technical drafting fallback

Các fallback này chỉ nhằm làm demo route sống và không claim dữ liệu verified.

### 3. Giảm rủi ro UI build

- `components/workspace.tsx` được thay bằng màn hình deployable demo runtime gọn, gọi thật:
  - `/api/health`
  - `/api/demo/readiness`
  - `/api/metadata`
  - `/api/auth/csrf`
  - `/api/template-builder`
- Bản UI cũ rất lớn được giữ lại dạng `.legacy.tsx.txt` để tham khảo, nhưng không tham gia compile.
- `components/content-admin.tsx` cũ cũng được giữ lại dạng `.legacy.tsx.txt` để tránh build/typecheck bị kéo theo khối admin lớn khi lib gốc đang thiếu.

## Chính sách giữ nguyên

- Không thêm AI/model/API trả phí.
- Không thêm thanh toán thật.
- Không marketplace tiền mặt.
- Không quỹ tiền mặt.
- Không referral nhiều tầng.
- Không public cộng đồng tự do.
- Không nâng seed/scaffold thành verified.
- Demo mode không thay thế production hardening.

## Verify đã chạy được trong môi trường hiện tại

Do `npm install` bị timeout trong môi trường làm việc, chưa thể verify build thật. Các kiểm tra source-level đã in kết quả OK:

- `node scripts/validate-demo-readiness-source.mjs` → OK, không thiếu required deploy files.
- `node scripts/smoke-batch67-demo-runtime-source.mjs` → OK, các route smoke chính tồn tại.
- `node scripts/validate-json-data.mjs` → OK, parse được 11 file JSON, 0 lỗi parse.
- Scan import module nội bộ `@/lib/*` → không còn module import bị thiếu.

## Chưa verify được

- `npm install` timeout.
- `npm run typecheck` chưa pass thật.
- `npm run build` chưa pass thật.
- Chưa live HTTP smoke trên Vercel/Render.
- Chưa kiểm thử export DOCX/PDF bằng trình duyệt thật.

## Cách kiểm tra lại trên máy/host thật

```bash
npm install
npm run data:validate
npm run demo:readiness-validate
npm run smoke:batch67
npm run typecheck
npm run build
npm run start
```

Sau đó mở:

```bash
/api/health
/api/demo/readiness
/
```

## Đánh giá thật

Batch68 làm repo tiến gần hơn tới deployable demo vì đã bổ sung các file nền bị thiếu và tạo đường chạy demo không phụ thuộc DB/Prisma/AI. Tuy nhiên không được gọi là production-ready vì build thật và live smoke chưa được xác nhận trong môi trường này.
