# Batch130 — P1 Security & Data Protection Foundation

## Scope

Batch130 is one P1 source-level batch. It does not claim public rollout, production auth, or hosted closure. The goal is to lock the security/data protection spine before any wider Golden Path, Team, School, community, payment, or AI work.

## What changed

- Hardened anonymous demo fallback in `lib/auth.ts`: only `session-demo-*` fallback cookies can become an anonymous demo teacher when JSON session persistence fails. Arbitrary `session-*` cookie values no longer become a user.
- Added `data/security-data-protection-foundation-policy.json` as the P1 control map for account core, route security, role governance, session security, audit logging, privacy/data minimization, founder absence safe mode, and release blockers.
- Added `lib/security-data-protection.ts` to build a safe board without exposing personal data.
- Added `GET /api/security/data-protection` for a public guardrail board that contains no emails, sessions, or audit event details.
- Added `GET /api/admin/security-data-protection-board`, protected by `security:read`/admin permission, for admin-only board access.
- Added `scripts/validate-batch130-security-data-protection-source.mjs` and `scripts/security-data-protection-report.mjs`.

## Guardrails kept

- Không thêm AI, AI SDK, prompt-agent, model call, API key, or paid model path.
- Không thêm payment, Stripe/PayPal, marketplace cash, quỹ tiền mặt, or referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không auto-public community.
- Save/export still require a real password account; demo sessions can preview/create safe frames only.
- Role elevation still requires membership/invite; public register/login defaults to teacher.

## What this does not prove

- It does not prove Node24 CI/Vercel hosted build.
- It does not prove hosted APP_URL strict smoke.
- It does not prove real browser visual smoke on mobile/tablet/desktop.
- It does not replace DB-backed production auth/session/ledger, privacy policy, legal review, backup, account deletion/export flow, or incident response.

## Commands

```bash
npm run security:data-protection-validate
npm run security:data-protection-report
npm run smoke:batch130
npm run verify:batch130
```

`verify:batch130` can still fail or time out in non-Node24 environments because P0 hosted/Node24 gates remain intentionally strict.
