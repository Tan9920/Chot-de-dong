import { NextRequest, NextResponse } from 'next/server';
import { buildDemoFeedbackBoard, createDemoFeedbackSubmission } from '@/lib/demo-feedback-intake';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'demo_feedback_board_read', { windowMs: 60_000, max: 80 });
  if (!rate.allowed) return rate.response;
  try {
    return NextResponse.json(buildDemoFeedbackBoard());
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được feedback board.',
      note: 'Không nên mở rộng nhóm test nếu feedback board không hoạt động.'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần phiên demo hợp lệ để gửi feedback.', request);
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'demo_feedback_submit', { windowMs: 60_000, max: 10 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 24_000, required: true });
  if (!parsed.ok) return parsed.response;

  try {
    const submission = createDemoFeedbackSubmission(parsed.body, session.user);
    await recordSecurityAuditEvent({
      eventType: 'demo_feedback_submit',
      outcome: 'success',
      actorName: session.user.name,
      actorRole: session.user.role,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      targetType: 'demo_feedback',
      targetId: submission.id,
      request,
      metadata: { severity: submission.severity, issueCategory: submission.issueCategory, riskFlags: submission.riskFlags }
    });
    return NextResponse.json({
      submission,
      board: buildDemoFeedbackBoard().board,
      note: 'Đã ghi feedback demo. Raw feedback không public; dùng để quyết định có mở rộng test hay phải dừng sửa lỗi.'
    }, { status: 201 });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'demo_feedback_submit', outcome: 'failure', severity: 'warning', actorName: session.user.name, actorRole: session.user.role, reason: error?.message || 'feedback_submit_failed', request });
    return NextResponse.json({ error: error?.message || 'Không gửi được feedback demo.' }, { status: 400 });
  }
}
