import { NextRequest, NextResponse } from 'next/server';
import { createCommunityResource, listPublicCommunityResources } from '@/lib/community-moderation';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'community_resource_public_read', { windowMs: 60_000, max: 80 });
  if (!rate.allowed) return rate.response;
  const resources = await listPublicCommunityResources();
  return NextResponse.json({ resources, policy: { publicListingRequiresModeration: true, minimumSourceStatus: 'reviewed', releaseDossierRequiredForPublic: true } });
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần đăng nhập để gửi tài nguyên cộng đồng.');
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'community_resource_submit', { windowMs: 60_000, max: 12 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 32_000, required: true });
  if (!parsed.ok) return parsed.response;
  try {
    const resource = await createCommunityResource(parsed.body, session.user);
    await recordSecurityAuditEvent({
      eventType: 'community_resource_submit',
      outcome: 'success',
      actorName: session.user.name,
      actorRole: session.user.role,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      targetType: 'community_resource',
      targetId: resource.id,
      request,
      metadata: { moderationStatus: resource.moderationStatus, visibility: resource.visibility, copyrightRisk: resource.copyrightRisk, releaseDossierRequiredBeforePublic: true }
    });
    return NextResponse.json({ resource, note: 'Tài nguyên đã vào hàng chờ kiểm duyệt; chưa public.' }, { status: 201 });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'community_resource_submit', outcome: 'failure', severity: 'warning', actorName: session.user.name, actorRole: session.user.role, reason: error?.message || 'submit_failed', request });
    return NextResponse.json({ error: error?.message || 'Không gửi được tài nguyên cộng đồng.' }, { status: 400 });
  }
}
