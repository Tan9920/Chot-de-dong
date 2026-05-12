import { NextRequest, NextResponse } from 'next/server';
import { buildCommunityHubBoard } from '@/lib/community-prestige-hub';
import { assertRuntimeRateLimit, requirePermission } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const auth = await requirePermission('content:review', 'Bạn cần quyền kiểm duyệt để xem Community Hub admin.');
  if (!auth.ok) return auth.response;
  const rate = assertRuntimeRateLimit(request, 'admin_community_hub_read', { windowMs: 60_000, max: 50 });
  if (!rate.allowed) return rate.response;
  const board = await buildCommunityHubBoard({ admin: true });
  await recordSecurityAuditEvent({
    eventType: 'admin_community_hub_read',
    outcome: 'success',
    actorName: auth.user.name,
    actorRole: auth.user.role,
    schoolKey: auth.user.schoolKey,
    departmentKey: auth.user.departmentKey,
    targetType: 'community_hub',
    request,
    metadata: { creatorProfiles: board.summary.creatorProfiles, publicProfiles: board.summary.publicCreatorProfiles, moderationQueue: board.summary.moderationQueue }
  });
  return NextResponse.json({ board });
}
