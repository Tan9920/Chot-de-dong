# BATCH133 NOTES — Public Rollout Readiness Control Center

## Mục tiêu

Chọn phần có thể làm tốt nhất hiện tại: **public rollout readiness source-level**.

Không chọn hosted/public proof vì môi trường này không có APP_URL Vercel thật, không chạy Node24 CI/Vercel thật, và không có visual smoke browser capture thật. Vì vậy Batch133 nâng cấp phần readiness board/dossier/safe-mode/rollback để tăng khả năng chuẩn bị rollout mà vẫn không overclaim.

## Thay đổi chính

- Tạo `data/public-rollout-readiness-policy.json`.
- Tạo `lib/public-rollout-readiness.ts`.
- Tạo API public `/api/runtime/public-rollout-readiness`.
- Tạo API admin `/api/admin/public-rollout-readiness-board` với `requirePermission('security:read')`.
- Tạo `scripts/public-rollout-readiness-report.mjs`.
- Tạo `scripts/public-rollout-dossier-template.mjs`.
- Tạo `scripts/validate-batch133-public-rollout-readiness-source.mjs`.
- Thêm scripts:
  - `public-rollout:readiness-validate`
  - `public-rollout:readiness-report`
  - `public-rollout:dossier-template`
  - `smoke:batch133`
  - `verify:batch133`

## Trạng thái claim

- Source-level public rollout control: có.
- Public rollout vẫn bị chặn.
- Không production-ready.
- Không hosted-demo-closed.
- Không 100%.

## Không thêm rủi ro cấm

Không thêm AI/API AI/model SDK/API key. Không thêm payment. Không thêm marketplace/quỹ/referral tiền mặt. Không tạo verified giả. Không auto-public community.

## Lệnh chạy

```bash
npm run public-rollout:readiness-validate
npm run public-rollout:dossier-template
npm run public-rollout:readiness-report
npm run smoke:batch133
npm run verify:batch133
```

Ghi chú claim: không production-ready; public rollout vẫn bị chặn cho tới khi có proof thật.
