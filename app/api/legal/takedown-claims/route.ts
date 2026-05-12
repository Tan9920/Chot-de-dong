import { NextRequest, NextResponse } from 'next/server';
import { createLegalTakedownClaim } from '@/lib/legal-takedown-workflow';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'public_legal_takedown_claim_submit', { windowMs: 60_000, max: 5 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 32_000, required: true });
  if (!parsed.ok) return parsed.response;
  try {
    const result = await createLegalTakedownClaim(parsed.body || {});
    await recordSecurityAuditEvent({
      eventType: 'legal_takedown_claim_submit',
      outcome: 'success',
      severity: result.hold.skipped ? 'warning' : 'info',
      targetType: String(result.claim.targetType),
      targetId: result.claim.targetId || result.claim.sourceUrl || result.claim.id,
      request,
      metadata: {
        claimId: result.claim.id,
        status: result.claim.status,
        linkedLegalAssetIds: result.claim.linkedLegalAssetIds,
        linkedCommunityResourceIds: result.claim.linkedCommunityResourceIds,
        holdSkipped: result.hold.skipped
      }
    });
    return NextResponse.json({
      claimId: result.claim.id,
      status: result.claim.status,
      readiness: result.readiness,
      hold: result.hold,
      policy: {
        noLegalConclusion: true,
        publicSafetyHoldCanApply: true,
        reviewerMustResolve: true
      }
    }, { status: 201 });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'legal_takedown_claim_submit', outcome: 'failure', severity: 'warning', reason: error?.message || 'claim_submit_failed', request });
    return NextResponse.json({ error: error?.message || 'Không gửi được yêu cầu takedown.' }, { status: 400 });
  }
}
