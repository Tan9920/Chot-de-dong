# Batch36 — No-AI 1–12 Product Operating Foundation

Mục tiêu của batch này là chuyển trọng tâm sản phẩm sang nền vận hành không phụ thuộc AI trong giai đoạn đầu: template giáo án, export, governance/compliance, coverage audit 1–12, plan/quota foundation, usage/point ledger foundation, community moderation foundation và easy mode config.

## Thay đổi chính

- Thêm operating config không-AI tại `data/operating-config.json`:
  - AI/model/API trả phí đang là future flag và mặc định tắt.
  - Không bật thanh toán thật, marketplace tiền mặt, quỹ tiền mặt hoặc referral nhiều tầng.
  - Có plan foundation: Free, Khởi đầu Giáo viên, Giáo viên Pro, Creator Pro, Tổ chuyên môn, Trường học.
  - Plan chỉ là cấu hình entitlement/quota, chưa phải billing/payment.
- Thêm ledger foundation:
  - `data/usage-ledger.json`
  - `data/point-ledger.json`
  - `data/community-resources.json`
  - Các file hiện trống để không tạo số liệu ảo.
- Thêm `lib/product-operating.ts`:
  - dựng operating foundation board từ config, coverage hiện tại, saved lessons, usage ledger, point ledger và community resource queue;
  - audit coverage 1–12 theo required subject slots;
  - chỉ rõ seed/reviewed/verified và starter/developing/foundation/operational;
  - phát hiện bias saved lessons lớp 6;
  - validate không bật AI/cash/multi-level referral trong batch này.
- Thêm API:
  - `GET /api/operating/foundation`
- Thêm UI tab:
  - `Vận hành 1–12` trong workspace.
- Thêm scripts:
  - `npm run operating:foundation-report`
  - `npm run operating:foundation-report -- --json`
  - `npm run operating:foundation-validate`
  - `npm run operating:foundation-validate -- --strict`

## Điều cố ý không làm

- Không thêm AI, model, prompt generation, agent AI hoặc API AI trả phí.
- Không bật billing/payment thật.
- Không mở marketplace tiền mặt.
- Không mở quỹ tiền mặt.
- Không thêm referral nhiều tầng.
- Không nâng seed/demo/scaffold thành reviewed/verified.

## Trạng thái dữ liệu sau batch

- Registry 1–12 vẫn có seed coverage rộng nhưng chưa verified.
- Saved lessons seed vẫn nghiêng lớp 6; batch này không giả vờ đã cân bằng bằng cách thêm giáo án demo ảo.
- Ledger và community resource data đang là foundation trống, chưa phải runtime enforcement đầy đủ.
