# Batch124 — Node 24 LTS Runtime Alignment

## Mục tiêu
- Cập nhật runtime target từ Node `22.x` lên Node `24.x` để khớp hướng Vercel hiện tại.
- Cập nhật `.node-version` và `@types/node` theo Node 24.
- Cập nhật GitHub Actions từ `Setup Node 22` sang `Setup Node 24`.
- Đổi gate CI cuối sang `npm run verify:release` thay vì batch cũ.

## Không làm
- Không thêm AI/API/model call.
- Không thêm payment/marketplace/quỹ/referral tiền mặt.
- Không tạo verified học thuật giả.
- Không claim production-ready nếu chưa có install/build/live/hosted smoke thật.

## Verify cần chạy
```bash
node -v
npm ci --ignore-scripts --no-audit --no-fund
npm run lint
npm run data:validate
npm run typecheck
npm run build
npm run verify:release
```

Nếu chạy trên Node 22 trong môi trường kiểm thử, có thể thấy `EBADENGINE` warning vì package đã target Node 24.x. Đó không phải bằng chứng Node 24 đã pass. Cần chạy lại trên Vercel/GitHub Actions Node 24 hoặc máy local Node 24.
