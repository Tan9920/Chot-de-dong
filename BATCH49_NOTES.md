# Batch49 — Typecheck, Build Reliability & Runtime Smoke Harness

Date: 27/04/2026

This batch follows Batch48 and focuses on reliability before adding new product surface area. It does **not** add AI, AI API calls, real billing, marketplace money flows, fake verified educational data, or broad new feature scope.

## Goals

1. Make the existing source-level TypeScript check pass again after Batch48.
2. Remove the audit fragility caused by `tsconfig.tsbuildinfo` writes in restricted environments.
3. Fix the nullable account-lockout message bug reported by the post-batch audit.
4. Improve the offline Node/Next type shims used when dependencies are not installed.
5. Add a dependency-light runtime/source smoke harness for the auth/export/security routes most affected by Batch47/48.
6. Tighten change-password so it cannot operate on an email/password account that is not tied to the current session account id.

## What changed

### Typecheck/build-reliability foundation

- `tsconfig.json`
  - Changed `compilerOptions.incremental` from `true` to `false` so `npm run typecheck` no longer tries to write `tsconfig.tsbuildinfo` during audit/typecheck.

- `types/runtime-shims.d.ts`
  - Added minimal offline declarations for `fs.existsSync`, `fs.readFileSync`, `fs.writeFileSync`, `fs.readdirSync`, `fs.mkdirSync`.
  - Added `fs/promises.writeFile` and `fs/promises.mkdir`.
  - Added `crypto.createHash`, `crypto.randomBytes`, `crypto.scryptSync`, `crypto.timingSafeEqual`.
  - Replaced the loose `Buffer` global with a minimal `Buffer` class including `from`, `concat`, and `toString`.

- `types/next-shims.d.ts`
  - Added minimal `NextRequest.cookies.get()` shape.
  - Added `NextResponse.next()`.

### Auth lifecycle/security tightening

- `lib/account-security.ts`
  - Fixed the nullable error in `verifyPasswordAccount()` by guarding `accountBlockedMessage(updated)` with a non-null check.
  - Extended `changePasswordAccount()` to accept `authAccountId`.
  - Added a session/account match check before changing the password when `authAccountId` is supplied.

- `app/api/auth/change-password/route.ts`
  - Now requires `session.user.authAccountId` before password change.
  - Passes `authAccountId` into `changePasswordAccount()` so the account email in the body must match the authenticated session account.

- `app/api/auth/logout-all/route.ts`
  - Uses `sessionCookieName` instead of a hardcoded cookie name when clearing the session cookie.

### Offline smoke harness

- Added `scripts/smoke-batch49-runtime-source.mjs`
  - No `tsx`, no alias import, no Next server required.
  - Statically checks the source-level guard chain for:
    - login
    - register
    - change-password
    - logout-all
    - export DOCX
    - export PDF
    - official-source-bootstrap
    - admin security-audit
  - Checks the updated runtime/Next shims and `tsconfig.incremental=false`.

- Added `scripts/verify-batch49-source.mjs`
  - Parses JSON files.
  - Scans source files for blocked AI/API needles.
  - Runs the Batch49 source smoke harness.

- `package.json`
  - Added `smoke:batch49`.
  - Added `verify:batch49`.

## Verified in this environment

Passed:

- `unzip -t /mnt/data/giao-an-mvp-vn-batch48-auth-lifecycle-security-ops.zip`
- `npm run typecheck`
- `npm run smoke:batch49`
- `npm run verify:batch49`
- `npm run auth:lifecycle-validate`
- `npm run route:hardening-validate`
- `npm run verify:batch48`
- `npm run verify:batch47`
- `node --experimental-strip-types scripts/validate-auth-invite-csrf.ts`
- `node --experimental-strip-types scripts/validate-runtime-security-ux.ts`
- `node --experimental-strip-types scripts/validate-product-trust-account-security.ts`

Still not verified / failed because dependencies were unavailable:

- `npm install --ignore-scripts --no-audit --no-fund` timed out; `node_modules/` was not created.
- `npm run lint` failed with `next: not found`.
- `npm run build` failed with `next: not found`.
- `npx prisma generate` timed out while trying to fetch/install Prisma; Prisma generate/migration is not verified.
- npm validators that depend on `tsx` failed with `tsx: not found`.

## Remaining limitations

- This batch proves source-level typecheck and offline smoke only; it does not prove Next runtime, browser behavior, DOCX/PDF export runtime, or Prisma-backed DB auth.
- Email verification/reset password are still not implemented.
- Security audit dashboard UI, audit retention, tamper evidence, and distributed rate limiting remain future work.
- Educational content remains seed/starter/scaffold unless separately reviewed; do not market it as verified official corpus.
- Community publishing must still remain gated by moderation/review.
