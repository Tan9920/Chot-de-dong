# Batch69 — Basic Web Product Usability & Real Demo Flow

## Mục tiêu

Batch69 không thêm ý tưởng/tính năng phức tạp mới. Mục tiêu là sửa hướng ưu tiên để repo có một web demo cơ bản, dễ hiểu và dễ đưa lên host hơn:

1. Trang chủ nói rõ web dùng để soạn giáo án, không phải AI generator.
2. Người dùng thường có thể tạo khung giáo án, chỉnh sửa, lưu bản nháp và xuất file ngay.
3. Các phần governance/compliance/dashboard kỹ thuật không làm rối luồng đầu tiên.
4. Dữ liệu seed/scaffold/demo được gắn nhãn trung thực.
5. Deploy/readiness có route và script kiểm tra luồng cơ bản.

## Thay đổi chính

### UI/UX

- Viết lại `components/workspace.tsx` thành một trang demo sản phẩm cơ bản:
  - hero/landing rõ mục đích;
  - form chọn lớp, môn, bộ sách/nguồn, bài/chủ đề;
  - nút tạo khung giáo án gọi thật `/api/template-builder`;
  - textarea chỉnh sửa nội dung trực tiếp;
  - lưu bản nháp bằng `localStorage` để demo không phụ thuộc database;
  - xuất DOCX/PDF bằng POST routes;
  - trạng thái runtime/readiness/basic-flow được đưa xuống phần phụ, không làm rối người dùng thường.
- Bổ sung utility CSS trong `app/globals.css` cho input/button/panel cơ bản.
- Cập nhật metadata trong `app/layout.tsx` theo định vị demo soạn giáo án.

### Basic deploy/demo readiness

- Thêm `lib/demo-basic-flow.ts` để kiểm tra source-level luồng web cơ bản.
- Thêm `app/api/demo/basic-flow/route.ts` trả board kiểm tra:
  - trang chủ;
  - workspace;
  - health/readiness APIs;
  - template-builder;
  - export DOCX/PDF;
  - local draft fallback;
  - nhãn seed/scaffold trung thực.
- Cập nhật `lib/demo-readiness.ts` để đưa basic flow vào readiness board.
- Cập nhật `scripts/validate-demo-readiness-source.mjs`.
- Thêm `scripts/validate-basic-flow-source.mjs`.
- Cập nhật `package.json`:
  - version `0.69.0`;
  - `basic-flow:validate`;
  - `smoke:batch69`;
  - `verify:batch69`;
  - `verify:deploy` trỏ về batch69.

### Export cơ bản

- Viết lại `lib/exporter.ts`:
  - DOCX không còn là text đổi đuôi; đã tạo OpenXML ZIP tối thiểu gồm `[Content_Types].xml`, `_rels/.rels`, `word/document.xml`, `word/styles.xml`.
  - PDF được tạo lại với xref/object tối thiểu hợp lệ hơn.
  - PDF vẫn là fallback tối thiểu, có thể mất dấu tiếng Việt vì chưa nhúng font Unicode; DOCX là đường xuất khuyến nghị cho demo tiếng Việt.

### Tài liệu

- Viết lại `README.md` theo trạng thái thật Batch69, tránh claim quá mức.
- Viết lại `DEPLOYMENT_DEMO_GUIDE.md` theo checklist demo web cơ bản.

## File tạo mới

- `lib/demo-basic-flow.ts`
- `app/api/demo/basic-flow/route.ts`
- `scripts/validate-basic-flow-source.mjs`
- `BATCH69_NOTES.md`

## File sửa chính

- `components/workspace.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `lib/demo-readiness.ts`
- `lib/exporter.ts`
- `scripts/validate-demo-readiness-source.mjs`
- `package.json`
- `README.md`
- `DEPLOYMENT_DEMO_GUIDE.md`

## Verify đã chạy được trong môi trường này

Đã chạy trực tiếp bằng `node`:

```bash
node scripts/validate-demo-readiness-source.mjs
node scripts/validate-basic-flow-source.mjs
node scripts/validate-internal-imports.mjs
node scripts/validate-json-data.mjs
```

Kết quả thực tế:

- `validate-demo-readiness-source`: pass, không thiếu required file.
- `validate-basic-flow-source`: pass, đủ marker luồng tạo/sửa/lưu/xuất và exporter.
- `validate-internal-imports`: pass, không phát hiện thiếu import `@/lib/*`.
- `validate-json-data`: pass riêng lẻ, 11 file JSON parse OK, 0 fail.

Đã kiểm riêng exporter bằng Node type stripping:

- `generateDocxBuffer` tạo buffer bắt đầu bằng `PK`.
- `unzip -t` với file DOCX test báo không lỗi ZIP.
- `generatePdfBuffer` tạo file được nhận diện là `PDF document, version 1.4, 1 page(s)`.

## Chưa verify được / phải nói thật

- `npm install --no-audit --no-fund` bị timeout trong môi trường này, chưa có `node_modules` local.
- `npm run ...` trong môi trường này có hiện tượng timeout/hang dù gọi trực tiếp `node scripts/...` chạy được. Cần chạy lại trên máy/host thật.
- `tsc --noEmit` / `npm run typecheck` chưa pass thật.
- `npm run build` chưa pass thật.
- Chưa live smoke trên Vercel/Render/Railway.
- Chưa mở file DOCX/PDF bằng Word/Google Docs/trình đọc PDF thật trong host deploy; mới verify format source-level/file-level.

## Lệnh cần chạy lại sau khi nhận ZIP

```bash
npm install
npm run imports:validate
npm run data:validate
npm run demo:readiness-validate
npm run basic-flow:validate
npm run smoke:batch69
npm run typecheck
npm run build
npm run start
```

Sau khi deploy:

```bash
GET /
GET /api/health
GET /api/demo/readiness
GET /api/demo/basic-flow
GET /api/metadata
POST /api/template-builder
POST /api/export/docx
POST /api/export/pdf
```

## Rủi ro còn lại

- Lưu nháp bằng `localStorage` chỉ là demo UX; bản thật cần DB/storage bền vững.
- Dữ liệu seed/scaffold chưa verified toàn bộ lớp 1–12.
- PDF chưa đảm bảo tiếng Việt đẹp nếu chưa có font Unicode server-side.
- Nhiều module governance/admin vẫn có trong repo, nhưng cần tiếp tục tách rõ easy/standard/advanced để không làm người dùng thường bị quá tải.
- Build/runtime thật vẫn phải được xác minh trên host.

## Đánh giá trạng thái thực tế

Batch69 cải thiện đúng phần nền web demo: người dùng mở trang chủ có thể hiểu sản phẩm, tạo bản nháp, sửa, lưu local và xuất file. Tuy nhiên đây vẫn là **source-level demo usability upgrade**, chưa phải production-ready và chưa được claim deploy pass cho đến khi `npm install`, `typecheck`, `build` và live smoke pass thật.
