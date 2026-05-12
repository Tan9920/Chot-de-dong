# Batch37 — No-AI Operating Runtime Quota & Ledger Guard

## Mục tiêu

Batch37 chuyển một phần quan trọng của Batch36 từ “foundation/config” sang runtime guard thật cho các luồng không-AI đang có:

- dựng giáo án từ template/data có cấu trúc;
- lưu giáo án;
- xuất DOCX/PDF;
- resolve plan/quota theo assignment nội bộ;
- ghi usage ledger runtime;
- hiển thị quota hiện tại trong tab vận hành.

Batch này **không thêm AI**, không thêm model, không thêm API AI, không thêm thanh toán thật, không marketplace tiền mặt, không quỹ tiền mặt, không referral nhiều tầng.

## Thay đổi chính

### 1. Runtime operating engine

File mới: `lib/operating-runtime.ts`

Chức năng:

- đọc `data/operating-config.json`;
- đọc `data/plan-assignments.json`;
- resolve plan hiện tại cho user;
- fallback về `Free Cộng Đồng` nếu không có assignment active;
- build entitlement snapshot;
- kiểm tra quota tháng cho:
  - `template_lesson`;
  - `export_docx`;
  - `export_pdf`;
  - `worksheet_template`;
  - `outline_slide_template`;
- kiểm tra quota số giáo án được lưu;
- ghi `usage-ledger.json` khi action thành công;
- áp operating watermark nếu plan hiện tại yêu cầu.

### 2. Plan assignment demo an toàn

File mới: `data/plan-assignments.json`

Có 3 assignment demo:

- `Giáo viên demo` → Free;
- `Tổ trưởng demo` → Team;
- `Quản trị demo` → School.

Tất cả đều là `seed_demo`, không phải billing/thanh toán thật.

### 3. Membership demo để smoke test role

File sửa: `data/memberships.json`

Trước Batch37, file này trống nên login leader/admin dễ bị auto-provision thành teacher. Batch37 thêm membership demo active cho:

- giáo viên;
- tổ trưởng;
- admin.

Mục tiêu là smoke test workflow tổ/admin trong môi trường JSON demo. Đây không phải hệ thống IAM production.

### 4. API runtime quota

File mới:

- `app/api/operating/usage/route.ts`

Route:

- `GET /api/operating/usage`

Trả về entitlement snapshot của user hiện tại:

- plan;
- assignment source;
- quota used/limit;
- saved lesson used/limit;
- watermark requirement;
- notes cảnh báo chưa phải billing thật.

### 5. Template-builder alias

File mới:

- `app/api/template-builder/route.ts`

Route mới:

- `POST /api/template-builder`

Route này re-export từ `/api/generate` để giảm định vị “AI/generate”. Route cũ vẫn giữ để tránh phá compatibility, nhưng UI đã chuyển sang `/api/template-builder`.

### 6. Runtime guard trong các route chính

File sửa:

- `app/api/generate/route.ts`
  - chặn quota `template_lesson` trước khi dựng;
  - ghi usage ledger sau khi teaching policy cho phép;
  - ghi rõ note không gọi AI.

- `app/api/lessons/route.ts`
  - chặn quota số saved lessons khi tạo mới;
  - ghi usage `save_lesson` sau khi lưu mới thành công.

- `app/api/export/docx/route.ts`
  - chặn quota `export_docx`;
  - áp operating watermark theo plan;
  - ghi usage ledger sau khi export thành công.

- `app/api/export/pdf/route.ts`
  - chặn quota `export_pdf`;
  - áp operating watermark theo plan;
  - ghi usage ledger sau khi export thành công.

### 7. UI vận hành

File sửa:

- `components/workspace.tsx`

Tab `Vận hành 1–12` thêm block runtime quota hiện tại:

- user;
- plan;
- assignment/fallback Free;
- saved lessons quota;
- template/export quota;
- watermark requirement.

Sau generate/export/save/login, UI refresh operating foundation + usage snapshot.

### 8. Validation script

File mới:

- `scripts/validate-operating-runtime.ts`

Script mới:

```bash
npm run operating:runtime-validate
npm run operating:runtime-validate -- --strict
npm run operating:runtime-validate -- --json
```

Kiểm tra:

- AI/cash/referral flags không bật;
- có Free fallback plan;
- có plan assignments;
- có demo membership leader/admin để smoke test;
- usage ledger runtime có createdAt;
- demo entitlement resolve đúng.

## Phần vẫn chưa làm

- Chưa có billing/payment thật.
- Chưa có Prisma models cho plan assignment/usage ledger.
- Chưa enforce quota cho worksheet/slide vì luồng runtime chưa có route hoàn chỉnh.
- Chưa thêm anti-abuse theo IP/device cho anonymous usage.
- Chưa có admin UI sửa plan assignment.
- Chưa có point ledger earning/redeem runtime.
- Chưa có community CRUD/moderation runtime đầy đủ.
- Chưa đổi hẳn tên `/api/generate`; chỉ thêm alias `/api/template-builder` và chuyển UI sang alias mới.

## Verify

Đã verify JSON parse bằng Node cho các file dữ liệu chính.

Chưa verify được:

- `npm install` timeout;
- `npm run typecheck`/`tsc --noEmit` timeout;
- `npm run lint` thiếu deps/Next runtime;
- `npm run build` thiếu deps/Next runtime;
- route smoke test thật chưa chạy được.

Không được coi Batch37 là production-ready nếu chưa chạy lại install/typecheck/build/runtime smoke ở môi trường ổn định.
