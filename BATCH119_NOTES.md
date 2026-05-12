# Batch119 — Runtime Evidence Gate Closure

## Mục tiêu

Batch119 giữ đúng ưu tiên P0 Runtime/Build/Hosted Closure. Batch này không thêm tính năng mới; chỉ đóng khoảng hở bằng chứng runtime sau Batch118:

- `live-http-smoke.mjs` giờ ghi artifact thật tại `artifacts/live-http-smoke-last-run.json`.
- `runtime-build-hard-gate-report.mjs` giờ kiểm tra production live smoke artifact; `.next` manifest còn được ghi nhận khi có, nhưng production live smoke pass được xem là bằng chứng startability trong môi trường local.
- Hosted closure vẫn bị chặn nếu chưa chạy strict `GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke`.
- Thêm policy `data/runtime-evidence-gate-policy.json`.
- Thêm validator/source gate Batch119 và script `verify:batch119`.

## Không thêm thứ cấm

- Không thêm AI SDK/API/model call.
- Không thêm payment/marketplace/quỹ tiền mặt/referral nhiều tầng.
- Không nâng seed/scaffold thành verified giả.
- Không public community auto-publish.
- Không cho user tự nâng role admin/leader qua đăng ký.

## Trạng thái cần nhớ

Local runtime có thể được chứng minh nếu `npm ci`, raw build diagnostic, production live smoke và auth invite runtime smoke đều pass. Tuy nhiên hosted/public demo vẫn chưa được claim nếu chưa có URL thật và strict hosted smoke pass.
