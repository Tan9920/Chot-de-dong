import { NextRequest, NextResponse } from 'next/server';
import { createActivityGameContribution } from '@/lib/activity-game-moderation';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần đăng nhập để gửi hoạt động/trò chơi vào hàng duyệt.');
  if (!session.ok) return session.response;
  const rate = assertRuntimeRateLimit(request, 'activity_game_contribution_write', { windowMs: 60_000, max: 12 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 32_000, required: true });
  if (!parsed.ok) return parsed.response;

  try {
    const result = await createActivityGameContribution(parsed.body, session.user);
    await recordSecurityAuditEvent({
      eventType: 'activity_game_contribution_submit',
      outcome: 'success',
      actorName: session.user.name,
      actorRole: session.user.role,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      targetType: 'activity_game',
      targetId: result.item.id,
      request,
      metadata: { moderationStatus: result.item.moderationStatus, visibility: result.item.visibility, safeSkeletonOnly: result.readiness.safeSkeletonOnly }
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'activity_game_contribution_submit', outcome: 'failure', severity: 'warning', actorName: session.user.name, actorRole: session.user.role, targetType: 'activity_game', reason: error?.message || 'submit_failed', request });
    return NextResponse.json({ error: error?.message || 'Không gửi được hoạt động/trò chơi.' }, { status: 400 });
  }
}
