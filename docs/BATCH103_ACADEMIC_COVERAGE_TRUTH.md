# Batch103 Academic Coverage Truth & Verification Gate

Mục tiêu: xử lý điểm đau “Dữ liệu học thuật verified 1–12 thấp” bằng cách đo đúng sự thật, khóa deep content khi thiếu dữ liệu, và tạo verification board cho quy trình nhập-duyệt sau này.

## Vì sao không tự nâng verified ngay?

Verified không phải là flag kỹ thuật. Một scope chỉ được coi là verified khi có nguồn hợp pháp, metadata, reviewer thật, audit log, release gate, license/attribution và cơ chế takedown. Nếu tự sửa JSON từ `seed` sang `verified`, sản phẩm sẽ rủi ro học thuật/pháp lý và mất uy tín.

## Batch103 đã thêm

- Academic policy: quy định điều kiện deep content.
- Academic verification queue: hàng đợi 134 scope cần nguồn/reviewer.
- Coverage audit report: thống kê verified/deepContentAllowed/blocked theo cấp/lớp/môn.
- API audit: `/api/academic/coverage-audit`.
- Admin board: `/api/admin/academic-verification-board`.
- UI Academic Truth card: hiển thị số scope, số verified, số bị khóa.

## Cách đọc chỉ số

- `verifiedOrApprovedPercent`: tỉ lệ scope đã có nhãn verified/approved_for_release trong registry.
- `deepContentAllowedPercent`: tỉ lệ scope được phép dùng dữ liệu sâu.
- `blockedFromDeepContentPercent`: tỉ lệ scope phải dùng khung an toàn.

Trong batch này, nếu các chỉ số verified/deepContentAllowed vẫn thấp hoặc bằng 0, đó là sự thật code và là điều đúng về governance, không phải lỗi validator.

## Lệnh kiểm tra

```bash
npm run batch103:academic-coverage-validate
npm run smoke:batch103
npm run typecheck
```
