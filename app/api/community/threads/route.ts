import { NextRequest, NextResponse } from 'next/server';
import { buildForumThreadSafetyBoard, createForumThread, listVisibleForumThreads } from '@/lib/forum-thread-safety';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'community_forum_threads_public_read', { windowMs: 60_000, max: 80 });
  if (!rate.allowed) return rate.response;
  const [threads, board] = await Promise.all([listVisibleForumThreads(), buildForumThreadSafetyBoard({ admin: false })]);
  return NextResponse.json({
    threads,
    summary: board.summary,
    policy: board.policy,
    warnings: board.warnings,
    note: 'Forum/Q&A chỉ hiển thị thread đã qua review hoặc limited-safe. New member và thread bị report phải giữ ở queue/limited; không có AI auto-answer.'
  });
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần đăng nhập để gửi câu hỏi/thảo luận cộng đồng.', request);
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'community_forum_threads_submit', { windowMs: 60_000, max: 10 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 32_000, required: true });
  if (!parsed.ok) return parsed.response;

  try {
    const result = await createForumThread(parsed.body, session.user);
    await recordSecurityAuditEvent({
      eventType: 'community_forum_thread_submit',
      outcome: 'success',
      actorName: session.user.name,
      actorRole: session.user.role,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      targetType: 'community_forum_thread',
      targetId: result.thread.id,
      request,
      metadata: { status: result.thread.status, visibility: result.thread.visibility, trustGate: result.thread.trustGate, noAiAutoAnswer: true }
    });
    return NextResponse.json({ ...result, note: 'Thread đã vào hàng chờ kiểm duyệt/limited; chưa public tự do.' }, { status: 201 });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'community_forum_thread_submit', outcome: 'failure', severity: 'warning', actorName: session.user.name, actorRole: session.user.role, reason: error?.message || 'forum_thread_submit_failed', request });
    return NextResponse.json({ error: error?.message || 'Không gửi được thread cộng đồng.' }, { status: 400 });
  }
}
