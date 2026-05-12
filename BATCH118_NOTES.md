# Batch118 — Runtime Build Hard Gate & Future Blocker Prevention

## Mục tiêu
Đóng hướng rủi ro lớn sau Batch117: raw Next build/hosted demo chưa được chứng minh nhưng dễ bị các batch sau “đi tiếp” và overclaim. Batch118 không thêm AI, không thêm payment, không nâng seed/scaffold thành verified. Trọng tâm là hard gate để sau này blocker build/runtime không bị che khuất bởi tính năng mới.

## Thay đổi chính
- Thêm `data/runtime-build-hard-gate-policy.json` để định nghĩa 4 blocker bắt buộc: raw Next build exit 0, startable artifact, production live smoke, hosted URL smoke.
- Thêm `scripts/validate-batch118-runtime-build-hard-gate-source.mjs` để kiểm tra source-level hard gate, script package, next.config hardening, anti-overclaim marker.
- Thêm `scripts/runtime-build-hard-gate-report.mjs` để đọc evidence build hiện có và phân loại claim nào được phép / bị chặn.
- Cập nhật `next.config.ts`: bỏ các static generation override quá chặt có thể gây lỗi `.next/export/500.html`; thêm `outputFileTracingRoot` và `outputFileTracingExcludes` để giảm trace scope.
- Cập nhật `scripts/next-build-runtime-guard.mjs`: xóa artifact cũ trước mỗi lần chạy và gắn `artifactFreshness: current_run` để tránh dùng nhầm evidence stale.

## Không được claim
- Chưa claim raw build closure nếu `npm run build:raw` hoặc `npm run build:raw:diagnose` chưa có exit 0.
- Chưa claim hosted closure nếu chưa có `GIAOAN_DEMO_URL` smoke pass.
- Chưa claim production-ready.

## Verify gợi ý
```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run source:validate
npm run data:validate
npm run typecheck
npm run next:swc-ready
npm run runtime:build-hard-gate-validate
npm run runtime:build-hard-gate-report
```

`runtime:build-hard-gate-report` có thể fail nếu chưa có raw build evidence thật; đó là hành vi đúng để chặn overclaim.
