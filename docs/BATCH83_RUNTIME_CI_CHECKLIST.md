# Batch83 Runtime / CI checklist

Mục tiêu Batch83 là làm quy trình kiểm chứng thật rõ hơn trước khi đưa web cho người khác test. Batch này không thêm AI, không thêm thanh toán thật, không mở marketplace/quỹ/referral nhiều tầng.

## Chạy trên máy/CI có internet public npm registry

```bash
npm run npm:diagnose
npm run lockfile:public-registry
npm run registry:diagnose
npm run install:clean
npm run next:swc-ready
npm run data:validate
npm run source:validate
npm run route:contract-validate
npm run deploy:runtime-contract-validate
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
npm run artifact:hygiene
npm run verify:batch83
```

## Diễn giải kết quả

- `source:validate`, `route:contract-validate`, `deploy:runtime-contract-validate` chỉ chứng minh source-level.
- `typecheck` chỉ chứng minh type-level.
- `build:clean` mới chứng minh Next build trong môi trường hiện tại.
- `GIAOAN_SMOKE_MODE=production npm run live:smoke:clean` mới chứng minh route runtime qua server thật sau build.
- Browser/mobile QA vẫn phải làm thủ công hoặc bằng Playwright sau này.

## Không được claim

Không nói production-ready/deploy-ready nếu một trong các lệnh sau fail hoặc chưa chạy:

- `install:clean`
- `next:swc-ready`
- `build:clean`
- `live:smoke:clean`
- browser/mobile QA

## Lưu ý npm/registry

Nếu gặp `EAI_AGAIN`, `ENOTFOUND`, registry protected hoặc thiếu SWC optional package, đó là blocker dependency/runtime. Không được coi source validator pass là build pass.
