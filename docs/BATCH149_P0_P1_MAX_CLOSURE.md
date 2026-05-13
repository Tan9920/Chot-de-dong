# Batch149 — P0/P1 Maximum Closure & Security Cookie Hardening

## Mục tiêu

Batch149 tiếp tục đúng blocker P0/P1: đẩy local/source/runtime evidence lên tối đa trong phạm vi có thể chạy ở repo, nhưng vẫn khóa hosted/public proof cho đến khi có GitHub Actions Node24 + Vercel APP_URL thật.

Batch này không thêm tính năng giáo viên mới. Trọng tâm là:

1. Harden P1 security cookie posture: CSRF cookie được đặt `httpOnly: true`; logout cũng clear cookie với cùng posture.
2. Thêm max-closure runner để chạy một chuỗi P0/P1 quan trọng trong một artifact duy nhất.
3. Thêm max-closure report để phân biệt rõ local/source/runtime candidate với hosted/public proof.
4. Giữ `publicRolloutAllowed=false` và `productionReady=false` nếu chưa có hosted proof thật.

## Lệnh chính

```bash
npm run batch149:p0-p1-max-closure-validate
npm run smoke:batch149
npm run p0-p1:max-closure-runner
npm run p0-p1:max-closure-report
npm run verify:batch149
```

## Vì sao vẫn chưa claim production-ready

Hosted proof vẫn cần các bằng chứng ngoài repo:

- GitHub Actions Node24 run thật có CI provenance.
- Vercel APP_URL/NEXT_PUBLIC_APP_URL/GIAOAN_DEMO_URL thật.
- Hosted save/export smoke qua HTTPS.
- Screenshot PNG visual smoke thật cho mobile/tablet/desktop.
- Artifact set tải từ cùng một GitHub Actions run và pass closure dossier + authenticity lock.
- Production DB/session/security/legal review.

## Claim được phép

Nếu runner pass, chỉ được nói:

- P0/P1 local/source/runtime max-closure candidate trong môi trường audit hiện tại.
- P1 CSRF cookie posture đã harden ở source-level.
- Hosted proof readiness tốt hơn nhưng chưa đóng.

## Claim bị cấm

Không nói:

- production-ready;
- public-rollout-ready;
- P0/P1 100%;
- hosted proof closed;
- visual smoke passed nếu không có PNG thật;
- Node24 CI proof nếu chỉ chạy Node22/local.

Không thêm AI, payment, marketplace, quỹ, verified giả hoặc community auto-public.

Ghi chú khóa claim: không claim production-ready khi chưa có hosted/public proof thật và review production.
