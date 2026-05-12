import { NextRequest, NextResponse } from 'next/server';
import { assessCommunityResourcePublication, readCommunityResources, requestCommunityResourceTakedown, reviewCommunityResource } from '@/lib/community-moderation';
import { readLegalAssets } from '@/lib/legal-asset-library';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireReviewer() {
  const gate = await requirePermission('content:review', 'Bạn cần quyền kiểm duyệt nội dung cộng đồng.');
  if (!gate.ok) return { error: gate.response };
  return { user: gate.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireReviewer();
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'admin_community_resource_read', { windowMs: 60_000, max: 50 });
  if (!rate.allowed) return rate.response;
  const [resources, legalAssets] = await Promise.all([readCommunityResources(), readLegalAssets()]);
  const items = resources.map((resource) => ({
    resource,
    readiness: assessCommunityResourcePublication(resource, legalAssets, { minimumSourceStatus: 'reviewed' })
  }));
  return NextResponse.json({ items, policy: { publicRequiresApprovedModeration: true, minimumSourceStatus: 'reviewed', unknownOrHighCopyrightBlocksPublic: true, releaseDossierRequiredForPublic: true } });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireReviewer();
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_community_resource_review', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 24_000, required: true });
  if (!parsed.ok) return parsed.response;
  const id = String(parsed.body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Thiếu id tài nguyên cộng đồng.' }, { status: 400 });
  try {
    const result = parsed.body?.action === 'takedown'
      ? { resource: await requestCommunityResourceTakedown(id, String(parsed.body?.reason || ''), auth.user!), readiness: undefined, releaseDossier: undefined, releaseDossierSnapshotId: undefined }
      : await reviewCommunityResource(id, parsed.body, auth.user!);
    await recordSecurityAuditEvent({
      eventType: 'community_resource_review',
      outcome: 'success',
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      schoolKey: auth.user!.schoolKey,
      departmentKey: auth.user!.departmentKey,
      targetType: 'community_resource',
      targetId: id,
      request,
      metadata: { action: parsed.body?.action || 'review', visibility: result.resource.visibility, moderationStatus: result.resource.moderationStatus, releaseDossierDecision: result.releaseDossier?.decision || result.resource.releaseDossierSummary?.decision, releaseDossierSnapshotId: result.releaseDossierSnapshotId || result.resource.releaseDossierSnapshotId, releaseDossierBlockers: result.releaseDossier?.blockerCount || result.resource.releaseDossierSummary?.blockerCount }
    });
    return NextResponse.json(result);
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'community_resource_review', outcome: 'failure', severity: 'warning', actorName: auth.user!.name, actorRole: auth.user!.role, targetType: 'community_resource', targetId: id, reason: error?.message || 'review_failed', request });
    return NextResponse.json({ error: error?.message || 'Không kiểm duyệt được tài nguyên cộng đồng.' }, { status: 400 });
  }
}
