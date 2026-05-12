# Batch70 — Long-Term Basic Product Foundation

## Mục tiêu

Sửa hướng Batch69: phần cơ bản không chỉ làm ở mức demo. Batch70 khóa lại nền móng sản phẩm dài hạn để các nâng cấp sau không bị lệch sang vá UI ngắn hạn hoặc governance quá phức tạp.

## Nguyên tắc đã giữ

- Không thêm AI/API/model/agent.
- Không thêm thanh toán thật/marketplace/quỹ tiền mặt/referral nhiều tầng.
- Không verified giả.
- Không public cộng đồng tự do.
- Không copy dài SGK/sách giáo viên.
- Không làm workspace người dùng thường quá kỹ thuật.
- Nếu thiếu dữ liệu reviewed/verified thì chỉ tạo khung an toàn.

## File tạo mới

- `data/product-foundation.json`
- `lib/product-foundation.ts`
- `app/api/product/foundation/route.ts`
- `scripts/validate-product-foundation-source.mjs`
- `docs/BASIC_PRODUCT_FOUNDATION.md`
- `BATCH70_NOTES.md`

## File sửa

- `components/workspace.tsx`
- `lib/demo-basic-flow.ts`
- `package.json`
- `README.md`
- `DEPLOYMENT_DEMO_GUIDE.md`

## API mới

- `GET /api/product/foundation`

API này trả product foundation board gồm:

- định vị không-AI;
- core user flow;
- data truth labels;
- interface modes;
- plan foundation;
- community moderation foundation;
- runtime gates;
- next critical batch recommendation.

## Scripts mới

```bash
npm run product:foundation-validate
npm run smoke:batch70
npm run verify:batch70
```

## Verify source-level đã chạy trong môi trường tạo batch

Các lệnh source-level cần chạy:

```bash
node scripts/validate-product-foundation-source.mjs
node scripts/validate-basic-flow-source.mjs
node scripts/validate-internal-imports.mjs
node scripts/validate-json-data.mjs
```

## Chưa claim

Không claim production-ready vì vẫn cần chạy thật:

```bash
npm install
npm run typecheck
npm run build
npm run start
```

Và live HTTP smoke:

```bash
/
/api/health
/api/demo/readiness
/api/demo/basic-flow
/api/product/foundation
/api/metadata
```

## Batch tiếp theo đề xuất

Batch71 — Persistence & Real Saved Lesson Foundation.

Lý do: sau Batch70, nền móng đã được model hóa nhưng lưu nháp vẫn là localStorage demo. Muốn thành web thật cần repository lưu giáo án, versioning, storage/database path và API lưu/mở/sửa/xuất theo saved lesson id.

## Verify đã thực hiện trong lượt tạo Batch70 này

PASS trực tiếp bằng Node:

```bash
node scripts/validate-product-foundation-source.mjs
node scripts/validate-basic-flow-source.mjs
node scripts/validate-internal-imports.mjs
node scripts/validate-json-data.mjs
node scripts/validate-demo-readiness-source.mjs
```

Ghi chú môi trường: gọi qua `npm run product:foundation-validate` có in kết quả pass nhưng tiến trình npm trong môi trường này không thoát sạch trước timeout của tool, nên không claim npm-script pass hoàn toàn. Khi nhận ZIP cần chạy lại trên máy/host thật.
