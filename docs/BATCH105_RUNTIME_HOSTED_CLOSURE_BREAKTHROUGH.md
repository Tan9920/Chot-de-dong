# Batch105 Runtime/Hosted Closure Breakthrough

Batch105 biến các lỗi runtime thành một hệ thống gate rõ ràng. Trước đây repo có nhiều validator source-level nhưng khi cần demo thật vẫn bị kẹt ở install/build/Next/SWC/hosted smoke. Batch này không cố che lỗi; nó làm rõ lỗi nào đang chặn, lệnh nào phải chạy, và trạng thái nào được phép nói với giáo viên.

## Vì sao chọn Batch105 này

Sau Batch103 và Batch104, hướng học thuật đã đúng: không nâng dữ liệu verified 1–12 bằng sửa nhãn. Nhưng nếu demo không build/host được, giáo viên không test được. Vì vậy Batch105 ưu tiên runtime/hosted closure thay vì thêm feature mới.

## Gate bắt buộc

1. `npm run registry:diagnose`
2. `npm run install:clean`
3. `npm run next:swc-ready`
4. `npm run build:clean`
5. `GIAOAN_SMOKE_MODE=production npm run live:smoke:clean`
6. `npm run auth-invite:runtime-smoke`
7. `GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke`

Nếu một bước fail hoặc timeout, không được nói bước đó đã pass.

## Source-level thêm mới

- `data/runtime-deploy-closure-plan.json`
- `lib/runtime-deploy-closure.ts`
- `/api/runtime/deploy-closure`
- `/api/admin/runtime-deploy-board`
- `scripts/runtime-deploy-closure-report.mjs`
- `scripts/validate-batch105-runtime-deploy-closure-source.mjs`
- UI `runtime-deploy-closure-card`

## Điều được nói

- Có evidence board để biết runtime/deploy đang bị chặn ở đâu.
- Có chain lệnh rõ cho Termux/Vercel/CI.
- Có gate để ngăn overclaim.
- Batch105 không thêm AI, không thêm payment, không tạo verified giả.

## Điều không được nói

- Không nói production-ready.
- Không nói hosted demo đã ổn nếu chưa có URL smoke pass.
- Không nói build pass nếu chưa có `.next/BUILD_ID` sau `npm run build:clean`.
- Không nói dữ liệu 1–12 đã verified.
- Không nói app là AI tạo giáo án chuẩn.

## Hướng Batch106

Nếu Batch105 verify runtime còn fail vì registry/install: tiếp tục Runtime Closure, nhưng tập trung vào môi trường host thật, Vercel logs và command path. Nếu runtime pass thật: chọn một nhóm nhỏ giáo viên test có kiểm soát, hoặc làm First Reviewed Scope Release Dossier nếu đã có source pack hợp pháp + reviewer thật.
