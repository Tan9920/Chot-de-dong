import { NextRequest, NextResponse } from 'next/server';
import { reportForumThread } from '@/lib/forum-thread-safety';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  const session = await requireActiveSession('Bạn cần đăng nhập để báo cáo thread cộng đồng.', request);
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'community_forum_thread_report', { windowMs: 60_000, max: 8 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 12_000, required: true });
  if (!parsed.ok) return parsed.response;
  const { id } = await context.params;

  try {
    const result = await reportForumThread(id, parsed.body, session.user);
    await recordSecurityAuditEvent({
      eventType: 'community_forum_thread_report',
      outcome: 'success',
      actorName: session.user.name,
      actorRole: session.user.role,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      targetType: 'community_forum_thread',
      targetId: id,
      request,
      metadata: { reason: result.report.reason, reportStatus: result.report.status, visibilityAfterReport: result.thread.visibility, statusAfterReport: result.thread.status }
    });
    return NextResponse.json({ ...result, note: 'Report đã được ghi nhận; thread sẽ bị giữ khỏi public rộng cho tới khi triage.' });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'community_forum_thread_report', outcome: 'failure', severity: 'warning', actorName: session.user.name, actorRole: session.user.role, targetType: 'community_forum_thread', targetId: id, reason: error?.message || 'forum_thread_report_failed', request });
    return NextResponse.json({ error: error?.message || 'Không báo cáo được thread.' }, { status: 400 });
  }
}
