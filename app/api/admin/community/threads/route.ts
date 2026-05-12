import { NextRequest, NextResponse } from 'next/server';
import { buildForumThreadSafetyBoard, reviewForumThread } from '@/lib/forum-thread-safety';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireReviewer() {
  const gate = await requirePermission('content:review', 'Bạn cần quyền kiểm duyệt để quản lý Forum/Q&A.');
  if (!gate.ok) return { error: gate.response };
  return { user: gate.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireReviewer();
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'admin_forum_threads_read', { windowMs: 60_000, max: 50 });
  if (!rate.allowed) return rate.response;
  const board = await buildForumThreadSafetyBoard({ admin: true });
  await recordSecurityAuditEvent({
    eventType: 'admin_forum_threads_read',
    outcome: 'success',
    actorName: auth.user!.name,
    actorRole: auth.user!.role,
    schoolKey: auth.user!.schoolKey,
    departmentKey: auth.user!.departmentKey,
    targetType: 'community_forum_threads',
    request,
    metadata: { totalThreads: board.summary.totalThreads, moderationQueue: board.summary.moderationQueue, openReports: board.summary.openReports }
  });
  return NextResponse.json({ board });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireReviewer();
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_forum_threads_review', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 24_000, required: true });
  if (!parsed.ok) return parsed.response;
  const id = String(parsed.body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Thiếu id thread cộng đồng.' }, { status: 400 });

  try {
    const result = await reviewForumThread(id, parsed.body, auth.user!);
    await recordSecurityAuditEvent({
      eventType: 'admin_forum_thread_review',
      outcome: 'success',
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      schoolKey: auth.user!.schoolKey,
      departmentKey: auth.user!.departmentKey,
      targetType: 'community_forum_thread',
      targetId: id,
      request,
      metadata: { action: parsed.body?.action || 'review', status: result.thread.status, visibility: result.thread.visibility, blockers: result.readiness.issues.filter((issue) => issue.severity === 'blocker').length }
    });
    return NextResponse.json(result);
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'admin_forum_thread_review', outcome: 'failure', severity: 'warning', actorName: auth.user!.name, actorRole: auth.user!.role, targetType: 'community_forum_thread', targetId: id, reason: error?.message || 'forum_thread_review_failed', request });
    return NextResponse.json({ error: error?.message || 'Không kiểm duyệt được thread.' }, { status: 400 });
  }
}
