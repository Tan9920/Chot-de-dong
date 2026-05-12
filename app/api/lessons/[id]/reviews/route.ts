import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { addLessonReview, getLessonById, getSchoolSettings } from '@/lib/storage';
import { canReviewLessonByScope, isLessonVisibleToUser } from '@/lib/governance';
import { assessLessonTrustGate } from '@/lib/lesson-trust-gates';
import { parseBoundedText } from '@/lib/route-security';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập để xem nhận xét.' }, { status: 401 });
  const rate = assertRuntimeRateLimit(request, 'lesson_review_read', { windowMs: 60_000, max: 60 });
  if (!rate.allowed) return rate.response;

  const { id } = await params;
  const lesson = await getLessonById(id);
  if (!lesson) {
    return NextResponse.json({ error: 'Không tìm thấy giáo án.' }, { status: 404 });
  }
  if (!isLessonVisibleToUser(user, lesson)) {
    return NextResponse.json({ error: 'Bạn không có quyền xem nhận xét giáo án này.' }, { status: 403 });
  }
  return NextResponse.json({ items: lesson.reviews ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để gửi nhận xét.' }, { status: 401 });
  }
  const rate = assertRuntimeRateLimit(request, 'lesson_review_write', { windowMs: 60_000, max: 30 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;

  const { id } = await params;
  const lesson = await getLessonById(id);
  if (!lesson) {
    return NextResponse.json({ error: 'Không tìm thấy giáo án.' }, { status: 404 });
  }

  const settings = await getSchoolSettings();
  const canReview = canReviewLessonByScope(user, lesson, { reviewDepartmentOnly: settings.reviewDepartmentOnly });
  if (!canReview) {
    return NextResponse.json({ error: 'Bạn không có quyền phản biện/duyệt giáo án ngoài phạm vi tổ/trường hiện hành.' }, { status: 403 });
  }

  const parsed = await readJsonBody(request, { maxBytes: 20_000, required: true });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const comment = parseBoundedText(body.comment, '', 4000);
  if (!comment) {
    return NextResponse.json({ error: 'Nhận xét không được để trống.' }, { status: 400 });
  }

  const requestedStatus = body.nextStatus === 'draft' || body.nextStatus === 'review' || body.nextStatus === 'approved' ? body.nextStatus : undefined;
  if (requestedStatus === 'approved' || requestedStatus === 'review') {
    const trustGate = assessLessonTrustGate({ requestedStatus, draft: lesson, settings });
    if (!trustGate.allowed) {
      return NextResponse.json({
        error: trustGate.issues.filter((item) => item.severity === 'blocker').map((item) => item.message).join(' ') || 'Giáo án chưa đủ điều kiện duyệt.',
        trustGate,
        qualityChecklist: trustGate.qualityChecklist
      }, { status: 412 });
    }
  }

  const result = await addLessonReview({
    lessonPlanId: id,
    reviewerName: user.name,
    reviewerRole: user.role,
    comment,
    nextStatus: requestedStatus
  });

  return NextResponse.json(result, { status: 201 });
}
