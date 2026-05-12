# Batch102 — Teacher Demo Breakthrough & Acceptance Gate

## Mục tiêu

Batch102 không nhồi thêm AI hay tính năng tiền mặt. Batch này gom các vấn đề nhức nhối nhiều lần trước vào một lớp bứt phá có kiểm soát:

- giáo viên không phải tự gõ lớp/môn/bài từ đầu nếu dữ liệu đã có trong catalog;
- dashboard nói rõ trạng thái thật: source tốt đến đâu, còn blocker nào;
- export hiển thị quota lưu/DOCX/PDF thay vì để giáo viên bấm mù;
- có API `/api/demo/breakthrough` để gom runtime/readiness/operating/blocker thành một báo cáo dễ hiểu;
- vẫn giữ nguyên no-AI core, không payment thật, không marketplace tiền mặt, không quỹ tiền mặt, không referral nhiều tầng;
- không claim production-ready nếu install/build/runtime/hosted smoke chưa pass.

## Thay đổi chính

- Nâng version `package.json` và `package-lock.json` lên `0.102.0`.
- Thêm `lib/demo-breakthrough.ts`.
- Thêm `app/api/demo/breakthrough/route.ts`.
- Thêm `scripts/validate-batch102-breakthrough-source.mjs`.
- Thêm `docs/BATCH102_TEACHER_DEMO_BREAKTHROUGH.md`.
- Cập nhật `components/workspace.tsx`:
  - `breakthrough-card` trên dashboard;
  - `teacher-starter-grid` chọn nhanh lớp/môn/bài;
  - `quota-strip` ở tab xuất file;
  - debug JSON có breakthrough report.
- Cập nhật `app/globals.css` cho UI Batch102.
- Cập nhật validators Batch89–101 để chấp nhận version `0.102.0`.

## Điều đã đóng được ở source-level

- Có nguồn sự thật nhanh cho demo readiness: `/api/demo/breakthrough`.
- Có lựa chọn nhanh bài học từ metadata catalog, giảm tình trạng bắt giáo viên tự nhập thủ công.
- Có UI nói thẳng blocker thay vì chỉ hiển thị đẹp.
- Có quota save/DOCX/PDF xuất hiện trong màn hình export.
- Có validator Batch102 để chặn overclaim.

## Điều chưa được claim

- Chưa claim npm install sạch nếu registry/network còn lỗi.
- Chưa claim Next build nếu chưa có `node_modules/.bin/next` và `.next/BUILD_ID`.
- Chưa claim live runtime smoke/hosted smoke/browser QA nếu chưa chạy thật.
- JSON persistence/ledger vẫn là demo/fallback, chưa DB production.
- Dữ liệu học thuật 1–12 vẫn chưa verified đủ.

## Lệnh chính

```bash
npm run batch102:breakthrough-validate
npm run smoke:batch102
npm run typecheck
npm run registry:diagnose
npm run install:clean
npm run next:swc-ready
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
GIAOAN_DEMO_URL=https://your-host npm run hosted:url-smoke
```
