# Batch130 — P1 Security & Data Protection Foundation

## Why this batch

Batch129 already pushed P0 local/startable runtime proof very high, while public rollout remains blocked by Node24 hosted proof, APP_URL strict smoke, and visual browser smoke. Because P1 source-work is allowed but public rollout is not, the next safe blocker is the security/data protection spine: account, role, session, privacy, audit, and release blockers.

## Added

- `data/security-data-protection-foundation-policy.json`
- `lib/security-data-protection.ts`
- `app/api/security/data-protection/route.ts`
- `app/api/admin/security-data-protection-board/route.ts`
- `scripts/security-data-protection-report.mjs`
- `scripts/validate-batch130-security-data-protection-source.mjs`
- `docs/BATCH130_SECURITY_DATA_PROTECTION_FOUNDATION.md`

## Modified

- `package.json` / `package-lock.json` version to `0.130.0` and added Batch130 scripts.
- `lib/auth.ts` now blocks arbitrary `session-*` demo fallback; only `session-demo-*` can be used for anonymous fallback when JSON session persistence fails.

## Truth labels

- This is source-level/type-level P1 foundation, not production auth.
- JSON fallback remains demo/runtime foundation only.
- public rollout vẫn bị chặn until Node24 CI/Vercel proof, hosted APP_URL strict smoke, and real visual smoke pass.
- No AI, payment, marketplace cash, referral money, fake verified data, or auto-public community was added.

## Verify

```bash
npm run security:data-protection-validate
npm run security:data-protection-report
npm run source:validate
npm run data:validate
npm run typecheck
npm run smoke:batch130
```
