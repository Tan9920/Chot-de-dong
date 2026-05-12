# Batch87 — Controlled Demo Feedback Loop + Teacher Test Pack

## Mục tiêu

Batch87 không thêm AI, không thêm thanh toán, không thêm marketplace/quỹ/referral nhiều tầng. Mục tiêu là làm cho việc chia link demo an toàn hơn: trước khi gửi cho giáo viên phải có test pack, câu hỏi feedback, mức ưu tiên lỗi và API/UI nhắc rõ demo chưa production-ready.

## Thay đổi chính

- Thêm `data/demo-tester-feedback-pack.json` để chuẩn hóa tester group, checklist trước khi chia link, nhiệm vụ test, câu hỏi feedback, phân loại P0/P1/P2/P3 và tin nhắn mời test.
- Thêm `lib/demo-tester-pack.ts` để kết hợp tester pack với hosted demo launch gate.
- Thêm `GET /api/demo/tester-pack` để workspace và hosted URL smoke đọc được gói test.
- Nối workspace vào tester pack: hiển thị khuyến nghị chia link, nhóm tester, checklist, nhiệm vụ test và câu hỏi feedback.
- Mở rộng `scripts/hosted-demo-url-smoke.mjs` để kiểm `/api/demo/tester-pack` trên domain thật.
- Thêm `scripts/validate-batch87-demo-tester-feedback-source.mjs`.
- Cập nhật package version lên `0.87.0` và thêm `smoke:batch87`, `verify:batch87`.
- Cập nhật GitHub Actions dùng Batch87 scripts.
- Cập nhật launch checklist và product foundation sang Batch87.

## Trạng thái thật

Batch87 là source-level/test-process hardening. Nó giúp tránh chia link demo bừa bãi và giúp thu feedback có cấu trúc, nhưng không chứng minh production-ready. Vẫn phải chạy install/build/live smoke/hosted URL smoke trên Vercel/GitHub thật.

## Không thay đổi

- Không thêm AI/API AI/model call.
- Không thêm thanh toán thật.
- Không mở cộng đồng public tự do.
- Không tạo dữ liệu verified giả.
- Không copy nội dung SGK dài hoặc học liệu không rõ quyền.

## Verify cần chạy

```bash
npm run data:validate
npm run demo:tester-pack-validate
npm run source:validate
npm run smoke:batch87
npm run typecheck
npm run next:swc-ready
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
npm run verify:batch87
```

## Rủi ro còn lại

- Chưa có bằng chứng teacher feedback thật cho đến khi mời nhóm nhỏ test.
- Chưa có proof build/runtime nếu dependency chưa cài và host chưa smoke pass.
- JSON fallback vẫn không phải database production multi-user.
- Dữ liệu học thuật 1–12 verified vẫn thấp; seed/scaffold chỉ dựng khung an toàn.
