import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { deleteLesson, getLessonById, getSchoolSettings, saveLesson } from '@/lib/storage';
import { SavedLessonPlan } from '@/lib/types';
import { canManageLesson, resolveLessonUpdate } from '@/lib/workflow';
import { normalizeLessonGovernanceSnapshot } from '@/lib/lesson-governance';
import { assertLessonPermission } from '@/lib/access';
import { normalizeSubjectPayload } from '@/lib/subject-naming';
import { assessLessonTrustGate } from '@/lib/lesson-trust-gates';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập để xem giáo án.' }, { status: 401 });
  const rate = assertRuntimeRateLimit(request, 'read_lesson', { windowMs: 60_000, max: 80 });
  if (!rate.allowed) return rate.response;
  const { id } = await params;
  const lesson = await getLessonById(id);
  if (!lesson) {
    return NextResponse.json({ error: 'Không tìm thấy giáo án.' }, { status: 404 });
  }
  if (!assertLessonPermission(user, 'lesson:read', lesson)) {
    return NextResponse.json({ error: 'Bạn không có quyền xem giáo án này.' }, { status: 403 });
  }
  return NextResponse.json({ item: lesson });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập workspace trước khi cập nhật.' }, { status: 401 });
  }

  const rate = assertRuntimeRateLimit(request, 'update_lesson', { windowMs: 60_000, max: 30 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const { id } = await params;
  const parsed = await readJsonBody(request, { maxBytes: 180_000, required: true });
  if (!parsed.ok) return parsed.response;
  const body = normalizeSubjectPayload(parsed.body);
  const current = await getLessonById(id);
  if (!current) {
    return NextResponse.json({ error: 'Không tìm thấy giáo án.' }, { status: 404 });
  }

  if (!canManageLesson(user, current)) {
    return NextResponse.json({ error: 'Bạn không có quyền cập nhật giáo án này.' }, { status: 403 });
  }

  const settings = await getSchoolSettings();
  const resolved = resolveLessonUpdate({
    user,
    current,
    body,
    approvalRequired: settings.approvalRequired,
    reviewDepartmentOnly: settings.reviewDepartmentOnly
  });

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const nextGovernanceSnapshot = body.governanceSnapshot ? normalizeLessonGovernanceSnapshot(body.governanceSnapshot) : current.governanceSnapshot;
  const trustGate = assessLessonTrustGate({
    requestedStatus: resolved.nextStatus,
    draft: { ...body, governanceSnapshot: nextGovernanceSnapshot },
    fallback: current,
    settings
  });
  if (!trustGate.allowed) {
    return NextResponse.json({
      error: trustGate.issues.filter((item) => item.severity === 'blocker').map((item) => item.message).join(' ') || 'Giáo án chưa đủ điều kiện gửi duyệt/duyệt.',
      trustGate,
      qualityChecklist: trustGate.qualityChecklist
    }, { status: 412 });
  }

  const updated: SavedLessonPlan = {
    ...current,
    ...body,
    governanceSnapshot: nextGovernanceSnapshot,
    id,
    schoolKey: current.schoolKey,
    schoolName: current.schoolName,
    departmentKey: current.departmentKey,
    departmentName: current.departmentName,
    visibilityScope: body.visibilityScope === 'private' || body.visibilityScope === 'school' ? body.visibilityScope : (body.visibilityScope === 'department' ? 'department' : current.visibilityScope),
    status: resolved.nextStatus,
    authorId: current.authorId,
    authorName: current.authorName,
    authorRole: current.authorRole,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString()
  };
  const saved = await saveLesson(updated, {
    actorName: user.name,
    actorRole: user.role,
    changeSummary: resolved.changeSummary,
    eventAction: resolved.eventAction as any
  });
  return NextResponse.json({ item: saved, qualityChecklist: trustGate.qualityChecklist, trustGate });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập workspace trước khi xóa.' }, { status: 401 });
  }
  const rate = assertRuntimeRateLimit(request, 'delete_lesson', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const { id } = await params;
  const lesson = await getLessonById(id);
  if (!lesson) {
    return NextResponse.json({ error: 'Không tìm thấy giáo án.' }, { status: 404 });
  }
  if (!canManageLesson(user, lesson)) {
    return NextResponse.json({ error: 'Bạn không có quyền xóa giáo án này.' }, { status: 403 });
  }
  await deleteLesson(id);
  return NextResponse.json({ ok: true });
}
