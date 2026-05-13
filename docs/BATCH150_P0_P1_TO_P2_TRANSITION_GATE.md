# Batch150 — P0/P1 to P2 Transition Gate & External Closure Guide

## Mục tiêu

Batch150 là batch chốt trước khi chuyển sang P2. Vấn đề khó nhất không còn là thêm feature, mà là **thả lỏng P0/P1 đúng cách**: cho phép bắt đầu P2 source/local nếu P0/P1 local/source/runtime đủ mạnh, nhưng vẫn chặn mọi public rollout nếu chưa có hosted proof thật.

## Quyết định an toàn

- Có thể bắt đầu **P2 source work** khi `npm run p0-p1:to-p2-transition-gate` pass.
- Không được mở **P2 public exposure** nếu GitHub Actions Node24 + Vercel APP_URL + hosted save/export + PNG visual smoke chưa pass.
- Không claim production-ready, P0/P1 100%, hosted proof closed nếu thiếu artifact thật.
- Không thêm AI/payment/marketplace/quỹ/community auto-public/verified giả.

## Lệnh mới

```bash
npm run batch150:p0-p1-to-p2-transition-validate
npm run p0-p1:to-p2-transition-gate
npm run p0-p1:to-p2-transition-gate:strict-public
npm run p0-p1:external-closure-guide
npm run smoke:batch150
npm run verify:batch150
```

## Ý nghĩa gate

`p0-p1:to-p2-transition-gate` tạo:

- `artifacts/batch150-p0-p1-to-p2-transition-gate-last-run.json`
- `artifacts/batch150-p0-p1-to-p2-transition-gate.md`

Nếu local pass nhưng hosted chưa pass, trạng thái đúng là:

> P2 source work allowed, public exposure blocked, production-ready false.

## Vấn đề không thể giải quyết trong chat/local ZIP

Các việc này cần bạn làm ngoài repo:

1. Deploy thật lên Vercel để có HTTPS APP_URL.
2. Chạy GitHub Actions Node24 workflow `P0 Hosted Final Proof`.
3. Tải artifact `p0-hosted-final-proof-artifacts`.
4. Kiểm `p0:hosted-proof-closure-dossier:strict` và `p0:hosted-proof-authenticity-lock:strict`.
5. Kiểm production DB/session/security/legal trước public rộng.

## Vì sao đây là batch khó nhất trước P2

Nếu không có Batch150, dự án dễ bị kẹt giữa hai cực: hoặc cứ P0/P1 mãi, hoặc nhảy P2 và claim quá tay. Batch150 đặt ranh giới rõ: **P2 được làm trong source/local/private, nhưng public rollout vẫn bị khóa**.


Ghi chú validator: hosted/public proof vẫn bị chặn nếu thiếu artifact thật; không claim production-ready khi chưa có review production.
