# Batch53 — Legal Takedown & Publication Incident Workflow Hardening

Date: 2026-04-27

## Scope

Batch53 continues after Batch52. It does **not** add AI, billing, marketplace cash flow, fake verified data, or deep subject generation. The goal is to close a legal/community risk still open after Batch51/52: public/community assets can now be gated, but the repo still lacked a concrete takedown-claim workflow and incident record for copyright/source disputes.

## What changed in code

### 1. Legal takedown claim workflow

New file:

- `lib/legal-takedown-workflow.ts`

Main functions:

- `normalizeLegalTakedownClaim()`
- `readLegalTakedownClaims()`
- `assessLegalTakedownClaim()`
- `createLegalTakedownClaim()`
- `applyTakedownClaimSafetyHold()`
- `updateLegalTakedownClaim()`

The workflow records a claim, checks whether it is actionable, resolves linked internal records by legal asset id, community resource id, or source URL, and applies a safety hold when there is enough minimum information. A safety hold is not a legal conclusion; it only keeps risky material out of public visibility until review.

### 2. Public takedown claim API

New file:

- `app/api/legal/takedown-claims/route.ts`

`POST` has:

- same-origin/CSRF write protection;
- runtime rate limit;
- guarded JSON body read;
- legal claim creation;
- security audit event `legal_takedown_claim_submit`;
- response policy saying the claim is not a legal conclusion and reviewer resolution is still required.

### 3. Admin takedown claim API

New file:

- `app/api/admin/legal-takedown-claims/route.ts`

`GET/PATCH` have:

- `content:review` permission gate;
- runtime rate limit;
- CSRF protection for PATCH;
- guarded JSON body read;
- admin update workflow for triage/hold/resolve/reject/reinstate/duplicate;
- security audit event `legal_takedown_claim_review`.

### 4. Type and Prisma prep

Modified file:

- `lib/types.ts`

Added:

- `LegalTakedownClaimTargetType`
- `LegalTakedownClaimStatus`
- `LegalTakedownClaimSeverity`
- `LegalTakedownClaimRecord`
- `LegalTakedownClaimIssue`
- `LegalTakedownClaimReadiness`

Modified file:

- `prisma/schema.prisma`

Added model prep:

- `LegalTakedownClaimRecord`

This is database migration preparation only. Runtime still uses JSON fallback until Prisma generate/migration and DB smoke are verified.

### 5. JSON fallback data

New file:

- `data/legal-takedown-claims.json`

Starts as an empty array. No fake claim data is seeded.

### 6. Validators and smoke scripts

New files:

- `scripts/validate-legal-takedown-workflow.mjs`
- `scripts/smoke-batch53-legal-takedown-source.mjs`
- `scripts/verify-batch53-source.mjs`

Modified file:

- `package.json`

Added scripts:

- `legal:takedown-validate`
- `smoke:batch53`
- `verify:batch53`

## What is still foundation/scaffold

- This is a source-level/JSON fallback workflow, not a full production legal operation.
- No public UI form yet; only API foundation.
- No admin dashboard UI for claim triage yet.
- No email/Zalo/in-app notifications for claim receipt or resolution.
- No identity verification for external claimants.
- No immutable legal case log/WORM storage.
- No file upload scanning, antivirus, MIME sniffing, perceptual hashing, or duplicate detection.
- No real database migration verified in this environment.
- No Next HTTP server smoke verified yet.

## Remaining risk

- A public claim with incomplete contact/target data is stored but does not automatically safety-hold assets.
- A valid-looking claim can still be abusive or false; admin/legal review is required.
- Safety hold is intentionally conservative and can temporarily hide public resources while under review.
- JSON fallback can race under concurrent writes.
- Legal asset and community-resource DB persistence remains prepared but not proven until Prisma and runtime checks pass.

## Commands added

```bash
npm run legal:takedown-validate
npm run smoke:batch53
npm run verify:batch53
```

## Production readiness note

This batch does **not** make the product production-ready. It improves the legal/community publication-risk workflow, but build/runtime/Prisma/HTTP smoke still need real verification after dependencies install successfully.
