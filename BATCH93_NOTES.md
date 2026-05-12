# Batch93 — runtime metadata smoke + repository identity cleanup

Batch93 tiếp nối Batch92 theo hướng không thêm feature bề mặt khi runtime/build còn thiếu bằng chứng. Trọng tâm là sửa lệch thông tin bàn giao và tăng smoke proof cho metadata starter data.

## Lý do chọn batch này

- `package.json.description` vẫn ghi Batch91/data-paused dù repo đã là Batch92 starter data expansion.
- `README.md` vẫn mở đầu bằng Batch88 Feedback Evidence Dossier, dễ làm người nhận repo hiểu sai trạng thái hiện tại.
- Metadata/search starter topics chưa được smoke bằng server thật.

## Làm gì

- Nâng repo version lên `0.93.0` trong `package.json` và `package-lock.json`.
- Sửa description và README theo trạng thái Batch93/Batch92.
- Thêm `scripts/validate-batch93-runtime-metadata-source.mjs`.
- Cập nhật live smoke và hosted URL smoke để `/api/metadata` không chỉ check HTTP 200 mà còn check starter metadata và `deepContentAllowedRecords`.
- Thêm scripts `runtime-metadata:validate`, `smoke:batch93`, `verify:batch93`.
- Cập nhật `scripts/run-source-validators.mjs` để Batch93 vào source validation chain.

## Không làm gì

- Không thêm AI/model/SDK/API key; nói ngắn gọn: không thêm AI.
- Không thêm payment thật, marketplace, quỹ tiền mặt hoặc referral nhiều tầng.
- Không nâng dữ liệu starter lên reviewed/verified/approved_for_release.
- Không bật `contentDepthAllowed`.
- Không claim production-ready; nói ngắn gọn: không production-ready nếu chưa verify runtime thật.

## Verify source-level

```bash
node --check scripts/validate-batch93-runtime-metadata-source.mjs
node scripts/validate-batch93-runtime-metadata-source.mjs
node scripts/validate-json-data.mjs
node scripts/validate-internal-imports.mjs
node scripts/run-source-validators.mjs
node scripts/hosted-demo-preflight.mjs
node scripts/assert-artifact-hygiene.mjs
```
