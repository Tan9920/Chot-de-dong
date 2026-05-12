import { NextRequest, NextResponse } from 'next/server';
import { reviewActivityGameContribution } from '@/lib/activity-game-moderation';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('content:review', 'Bạn cần quyền review nội dung để duyệt Activity/Game Library.');
  if (!gate.ok) return gate.response;
  const rate = assertRuntimeRateLimit(request, 'admin_activity_game_review', { windowMs: 60_000, max: 24 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 32_000, required: true });
  if (!parsed.ok) return parsed.response;
  const { id } = await params;

  try {
    const result = await reviewActivityGameContribution(id, parsed.body, gate.user);
    await recordSecurityAuditEvent({
      eventType: 'activity_game_review_decision',
      outcome: result.blockedFromPublic ? 'blocked' : 'success',
      severity: result.blockedFromPublic ? 'warning' : 'info',
      actorName: gate.user.name,
      actorRole: gate.user.role,
      schoolKey: gate.user.schoolKey,
      departmentKey: gate.user.departmentKey,
      targetType: 'activity_game',
      targetId: id,
      request,
      metadata: { decision: result.decision, blockedFromPublic: result.blockedFromPublic, moderationStatus: result.item.moderationStatus, visibility: result.item.visibility, officialExportAllowed: result.readiness.officialExportAllowed }
    });
    return NextResponse.json(result);
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'activity_game_review_decision', outcome: 'failure', severity: 'warning', actorName: gate.user.name, actorRole: gate.user.role, targetType: 'activity_game', targetId: id, reason: error?.message || 'review_failed', request });
    return NextResponse.json({ error: error?.message || 'Không duyệt được hoạt động/trò chơi.' }, { status: 400 });
  }
}
