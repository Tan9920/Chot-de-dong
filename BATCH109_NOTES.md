# Batch109 — Offline Teacher Export & Printable Lesson Preview Polish

## Mục tiêu

Batch109 được chọn vì Batch108 đã sửa đầu vào lớp/môn/chủ đề, nhưng chưa có Vercel/build/runtime proof thật. Thay vì vá lẻ hoặc claim hosted-ready, batch này nâng lát cắt offline hữu hình cho giáo viên: bản nháp giáo án có preview in được, tải TXT, tải HTML in được, checklist an toàn dễ hiểu, và vẫn giữ toàn bộ guardrail Batch108.

## Thay đổi chính

- Nâng version repo lên `0.109.0`.
- Thêm `data/teacher-pilot-print-export-policy.json` để mô tả export offline source-level và claim policy.
- Nâng `public/teacher-pilot-demo.html`:
  - giữ dropdown lớp/môn/chủ đề;
  - giữ chặn `Tiếng Việt + Phân số`;
  - không cho tự chọn `verified`;
  - thêm preview in được với `@media print`;
  - thêm nút `Tải TXT`, `Tải HTML in được`, `In / xuất PDF bằng trình duyệt`;
  - thêm checklist giáo viên trước khi dùng.
- Thêm `buildTeacherPilotPrintableExport()` trong `lib/teacher-pilot-completion.ts`.
- API `/api/teacher-pilot/completion` trả thêm `printableExport` source-level.
- Admin board trả thêm `printableExport` để kiểm tra.
- Thêm validator/report Batch109:
  - `scripts/validate-batch109-offline-print-export-source.mjs`
  - `scripts/teacher-print-export-report.mjs`
  - `artifacts/teacher-print-export-last-run.json`
- Đăng ký script:
  - `npm run batch109:offline-print-export-validate`
  - `npm run teacher-pilot:print-export-report`
  - `npm run smoke:batch109`
  - `npm run verify:batch109`

## Không làm trong batch này

- Không thêm AI/API/model call.
- Không tạo verified giả.
- Không mở contentDepthAllowed.
- Không thêm payment/marketplace/quỹ tiền mặt/referral nhiều tầng.
- Không claim hosted/runtime pass.
- Không claim DOCX/PDF server-side đã pass.
- Không sửa sâu dữ liệu verified học thuật 1–12.

## Verify cần chạy

Source/offline:

```bash
npm run data:validate
npm run imports:validate
npm run source:validate
npm run batch108:teacher-topic-picker-validate
npm run batch109:offline-print-export-validate
npm run teacher-pilot:topic-picker-report
npm run teacher-pilot:print-export-report
npm run smoke:batch109
npm run artifact:hygiene
```

Runtime/hosted vẫn cần chạy lại khi có môi trường install/build thật:

```bash
npm run registry:diagnose
GIAOAN_NPM_CI_TIMEOUT_MS=15000 npm run install:clean
npm run typecheck
npm run next:swc-ready
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run auth-invite:runtime-smoke
GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke
npm run verify:batch109
```

## Cách claim an toàn

Được nói: có demo offline mở trực tiếp, chọn đúng lớp/môn/chủ đề, tạo khung giáo án, tải TXT/HTML in được ở client-side.

Không được nói: production-ready, hosted pass, DOCX/PDF server-side pass, dữ liệu verified 1–12, chuẩn Bộ, dùng ngay không cần sửa.
