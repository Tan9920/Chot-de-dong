# Batch142 — P0 Node24 CI Provenance Hardening

Batch142 là batch evidence-quality, không phải batch thêm tính năng giáo viên.

## Lý do

Sau Batch141, hosted strict và P0-100 release artifact đã được tách. Tuy nhiên `node24_ci_deepest` vẫn có một lỗ hổng claim: nếu ai đó chạy Node24 local, artifact có thể đạt `nodeMajor=24` và `requireNode24=true`, nhưng điều đó chưa chứng minh đây là GitHub Actions/Vercel CI proof.

## Quy tắc mới

Evidence `node24_ci_deepest` chỉ pass khi artifact thỏa các điều kiện:

1. `ok=true`.
2. `command="verify:p0-deepest"`.
3. `requireNode24=true`.
4. `nodeVersion` major là `24`.
5. Các check runtime bắt buộc đều pass.
6. `requireCiProvenance=true`.
7. `ciProvenance.githubActions=true`.
8. Có `ciProvenance.githubWorkflow`, `ciProvenance.githubRunId`, `ciProvenance.runnerOS`.

## Ý nghĩa

- Local Node24 vẫn dùng để debug build/runtime.
- GitHub Actions Node24 mới được dùng để đóng evidence `node24_ci_deepest`.
- Public rollout tiếp tục bị chặn nếu thiếu APP_URL hosted smoke, hosted save/export smoke, visual smoke và P0-100 release artifact.

## Lệnh chính

```bash
npm run batch142:p0-node24-ci-provenance-validate
npm run smoke:batch142
npm run runtime:p0-hosted-ci-proof-report
```

## Không đổi phạm vi

Batch142 không thêm AI, payment, marketplace, verified giả hoặc auto-public community.
