import { NextRequest, NextResponse } from 'next/server';
import { assessLegalTakedownClaim, readLegalTakedownClaims, updateLegalTakedownClaim } from '@/lib/legal-takedown-workflow';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireLegalReviewer() {
  const gate = await requirePermission('content:review', 'Bạn cần quyền rà soát pháp lý/takedown.');
  if (!gate.ok) return { error: gate.response };
  return { user: gate.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireLegalReviewer();
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'admin_legal_takedown_claim_read', { windowMs: 60_000, max: 50 });
  if (!rate.allowed) return rate.response;
  const claims = await readLegalTakedownClaims();
  const items = claims.map((claim) => ({ claim, readiness: assessLegalTakedownClaim(claim) }));
  return NextResponse.json({
    items,
    policy: {
      publicClaimsDoNotProveOwnership: true,
      assetHeldMeansHiddenUntilReview: true,
      reviewerResolutionRequired: true
    }
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireLegalReviewer();
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_legal_takedown_claim_update', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 32_000, required: true });
  if (!parsed.ok) return parsed.response;
  const id = String(parsed.body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Thiếu id takedown claim.' }, { status: 400 });
  try {
    const result = await updateLegalTakedownClaim(id, parsed.body, auth.user!);
    await recordSecurityAuditEvent({
      eventType: 'legal_takedown_claim_review',
      outcome: 'success',
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      schoolKey: auth.user!.schoolKey,
      departmentKey: auth.user!.departmentKey,
      targetType: 'legal_takedown_claim',
      targetId: id,
      request,
      metadata: {
        action: parsed.body?.action || 'update',
        status: result.claim.status,
        linkedLegalAssetIds: result.claim.linkedLegalAssetIds,
        linkedCommunityResourceIds: result.claim.linkedCommunityResourceIds,
        heldLegalAssets: result.hold.heldLegalAssets,
        heldCommunityResources: result.hold.heldCommunityResources
      }
    });
    return NextResponse.json(result);
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'legal_takedown_claim_review', outcome: 'failure', severity: 'warning', actorName: auth.user!.name, actorRole: auth.user!.role, targetType: 'legal_takedown_claim', targetId: id, reason: error?.message || 'claim_review_failed', request });
    return NextResponse.json({ error: error?.message || 'Không cập nhật được takedown claim.' }, { status: 400 });
  }
}
