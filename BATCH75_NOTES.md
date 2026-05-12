# BATCH75 — Curriculum Import Review & Lesson Drafting Quality Foundation

Ngày: 2026-04-29

## Mục tiêu

Tập trung đúng vào phần người dùng yêu cầu: dữ liệu các môn và chất lượng soạn giáo án. Batch này không thêm AI, không tạo dữ liệu verified giả, không thêm thanh toán/marketplace/quỹ tiền mặt.

## Thay đổi chính

1. Thêm foundation cho pipeline nhập/duyệt dữ liệu môn học:
   - `data/curriculum-import-drafts.json`
   - `lib/curriculum-data-pipeline.ts`
   - `GET /api/subject-data/review-board`
   - `GET/POST /api/admin/subject-data/imports`

2. Thêm hồ sơ soạn giáo án theo lớp/mục tiêu:
   - `data/lesson-drafting-profiles.json`
   - `lib/lesson-drafting-profile.ts`
   - `GET /api/lesson-drafting/profiles`

3. Nâng generator soạn giáo án:
   - Không dùng một mẫu máy móc cho mọi lớp.
   - Áp dụng profile lớp 1–2, 3–4, lớp 5, 6–9, 10–12, ôn thi vào 10, ôn thi THPT.
   - Hoạt động có đủ mục tiêu, nội dung, sản phẩm, tổ chức thực hiện 4 bước.
   - Nếu dữ liệu chưa đủ reviewed/foundation thì chỉ dựng khung, không sinh kiến thức sâu/câu hỏi/đáp án/Casio.

4. Nâng checklist chất lượng giáo án:
   - Kiểm tra 8 mục chính.
   - Kiểm tra yêu cầu cần đạt.
   - Kiểm tra cấu trúc hoạt động.
   - Kiểm tra source/license/data truth/safe content gate/anti-overclaim/Casio guard.

## Verify source-level

Các lệnh direct Node cần chạy:

```bash
node scripts/validate-json-data.mjs
node scripts/validate-internal-imports.mjs
node scripts/validate-subject-data-truth-source.mjs
node scripts/validate-curriculum-import-review-source.mjs
node scripts/validate-lesson-drafting-quality-source.mjs
```

## Chưa production-ready

- Chưa có dữ liệu môn học verified mới.
- Import vẫn preview-only.
- Chưa có reviewer thật/audit log nâng reviewed/verified.
- Chưa typecheck/build/live smoke do dependency chưa cài được trong môi trường audit.
- Chưa browser/mobile QA.

## Batch tiếp theo nên làm

Batch76 nên tập trung vào UI hiển thị chất lượng dữ liệu + soạn giáo án: giáo viên cần thấy rõ profile lớp, trạng thái dữ liệu, safe mode, checklist và việc cần tự nhập nguồn trước khi xuất/sử dụng.
