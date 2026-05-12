import { NextRequest, NextResponse } from 'next/server';
import { buildDemoFeedbackBoard, listDemoFeedbackSubmissions } from '@/lib/demo-feedback-intake';
import { assertRuntimeRateLimit, requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const permission = await requirePermission('demo_feedback:review', 'Bạn cần quyền admin/reviewer để xem feedback demo chi tiết.', request);
  if (!permission.ok) return permission.response;
  const rate = assertRuntimeRateLimit(request, 'admin_demo_feedback_read', { windowMs: 60_000, max: 60 });
  if (!rate.allowed) return rate.response;
  return NextResponse.json({
    board: buildDemoFeedbackBoard().board,
    submissions: listDemoFeedbackSubmissions(),
    note: 'Danh sách đã được redacted. Raw contact không public trong demo foundation.'
  });
}
