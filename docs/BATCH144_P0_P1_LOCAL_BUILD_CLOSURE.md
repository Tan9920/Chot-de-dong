# Batch144 — P0/P1 Local Build Closure

Batch này tập trung đúng blocker lớn nhất sau Batch143: build production bị giết bởi giới hạn thời gian tương tác và bị đọc như treo ở `Collecting page data`. Audit lại bằng background execution cho thấy raw Next build có thể đi qua page data, generate static pages, finalizing optimization, collecting build traces và exit 0. Vì vậy batch này không thêm tính năng giáo viên mới, mà làm bằng chứng build đủ sạch để phục vụ đóng P0/P1 local.

## Controls mới

1. `scripts/next-build-runtime-guard.mjs` xoá `.next` trước khi chạy, trừ khi đặt `GIAOAN_BUILD_GUARD_PRESERVE_NEXT=1`.
2. `scripts/raw-next-build-diagnostic.mjs` xoá `.next` trước khi chạy, trừ khi đặt `GIAOAN_RAW_BUILD_PRESERVE_NEXT=1`.
3. `data/p0-p1-local-evidence-policy.json` thêm gate bắt buộc `raw_build_diagnostic`.
4. `scripts/p0-p1-local-evidence-runner.mjs` chạy `GIAOAN_RAW_BUILD_TIMEOUT_MS=180000 npm run build:raw:diagnose`.
5. `scripts/p0-p1-local-evidence-report.mjs` và `lib/p0-p1-local-evidence.ts` kiểm tra raw build bằng contract chặt.
6. `data/p0-p1-final-closure-policy.json` thêm raw build vào closure board.
7. `scripts/validate-batch144-p0-p1-build-closure-source.mjs` kiểm tra source-level regression.

## Lệnh verify khuyến nghị

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run batch144:p0-p1-build-closure-validate
npm run source:validate
npm run data:validate
GIAOAN_BUILD_TRACE_GRACE_MS=0 GIAOAN_BUILD_ARTIFACT_READY_GRACE_MS=0 npm run build
GIAOAN_RAW_BUILD_TIMEOUT_MS=180000 npm run build:raw:diagnose
npm run p0-p1:local-evidence-runner
npm run p0-p1:local-evidence-report
npm run p0-p1:stability-report
npm run p0-p1:final-closure-report
```

## Giới hạn còn lại

Batch144 chỉ đóng hướng local/source P0/P1 nếu lệnh verify pass. Hosted/public proof vẫn cần Node24 GitHub Actions, Vercel/APP_URL thật, visual screenshot thật, production DB/security/legal review. Không được claim production-ready.
