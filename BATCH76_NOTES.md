# BATCH76 — Subject Data & Lesson Drafting UI Integration

## Mục tiêu

Batch76 nối các foundation đã có ở Batch75 vào workspace chính để giáo viên và người test nhìn thấy rõ:

- sự thật dữ liệu môn học hiện tại;
- dữ liệu nào vẫn chỉ là seed/scaffold/starter;
- hồ sơ soạn giáo án đang áp dụng theo lớp, mục tiêu ôn thi và mức học sinh;
- checklist chất lượng giáo án rule-based sau khi tạo hoặc trước khi xuất.

Batch này không thêm AI, không thêm thanh toán thật, không thêm marketplace/quỹ/referral nhiều tầng và không nâng giả dữ liệu thành reviewed/verified.

## Thay đổi chính

### components/workspace.tsx

- Fetch thêm `/api/subject-data/review-board` để hiển thị registry records, deep-content allowed, unsafe count, import drafts và blocker import.
- Fetch thêm `/api/lesson-drafting/profiles` theo lớp, mục tiêu/chế độ và mức học sinh.
- Thêm lựa chọn `Mục tiêu / chế độ`: bài học thường, ôn thi vào 10, ôn thi THPT.
- Thêm lựa chọn `Mức học sinh`: cần hỗ trợ/lớp yếu, chuẩn, nâng cao/chuyên sâu.
- Hiển thị hồ sơ soạn giáo án đang áp dụng, nhịp tổ chức, phân hóa, guidance và cảnh báo cần tránh.
- Gọi `/api/lesson-quality` từ workspace qua nút `Kiểm tra` / `Chạy checklist hiện tại`.
- Sau khi tạo giáo án từ `/api/template-builder`, lưu lại `qualityChecklist` trả về để hiển thị ngay.
- Thêm panel `Sự thật dữ liệu môn học`, `Hồ sơ soạn theo lớp/mục tiêu`, `Checklist chất lượng giáo án`.
- Cập nhật copy hero từ Batch71 persistence sang Batch76 data truth UI.

### scripts/validate-batch76-ui-integration-source.mjs

- Validator source-level kiểm tra workspace đã nối đủ API/marker UI quan trọng.
- Kiểm tra package scripts Batch76.
- Kiểm tra các source Batch76 không thêm AI SDK/API call.

### package.json

- Version: `0.76.0`.
- Thêm script `ui:batch76-validate`.
- Thêm script `smoke:batch76`.
- Thêm script `verify:batch76`.

## Phạm vi thật

Đây là UI/source-level integration. Batch này giúp giảm rủi ro giáo viên hiểu nhầm dữ liệu scaffold là verified, nhưng chưa làm dữ liệu môn học thành reviewed/verified, chưa thêm reviewer thật, chưa tạo database production, chưa chứng minh live browser/mobile QA.

## Lệnh kiểm tra nên chạy

```bash
node scripts/validate-json-data.mjs
node scripts/validate-internal-imports.mjs
node scripts/validate-curriculum-import-review-source.mjs
node scripts/validate-lesson-drafting-quality-source.mjs
node scripts/validate-batch76-ui-integration-source.mjs
npm run smoke:batch76
npm run typecheck
npm run build
```

Nếu lệnh nào fail/timeout/chưa chạy, phải ghi rõ trong bàn giao.
