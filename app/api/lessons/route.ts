import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStorageMode, readLessons, saveLesson, getSchoolSettings } from '@/lib/storage';
import { SavedLessonPlan } from '@/lib/types';
import { assertSavedLessonQuota, recordOperatingUsage } from '@/lib/operating-runtime';
import { normalizeSubjectPayload } from '@/lib/subject-naming';
import { assessLessonTrustGate } from '@/lib/lesson-trust-gates';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireRealAccountSession } from '@/lib/runtime-security';
import { isLessonVisibleToUser } from '@/lib/governance';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ items: [], storage: getStorageMode() });
  const lessons = await readLessons();
  const items = lessons.filter((item) => isLessonVisibleToUser(user, item));
  return NextResponse.json({ items, storage: getStorageMode() });
}

export async function POST(request: NextRequest) {
  const accountGate = await requireRealAccountSession('lưu bản nháp lên demo', request);
  if (!accountGate.ok) return accountGate.response;
  const user = accountGate.user;

  const rate = assertRuntimeRateLimit(request, 'save_lesson', { windowMs: 60_000, max: 30 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const parsed = await readJsonBody(request, { maxBytes: 180_000, required: true });
  if (!parsed.ok) return parsed.response;
  const body = normalizeSubjectPayload(parsed.body);
  const requestedStatus = body.status === 'review' || body.status === 'approved' ? body.status : 'draft';
  const settings = await getSchoolSettings();
  const trustGate = assessLessonTrustGate({ requestedStatus, draft: body, settings });
  if (!trustGate.allowed) {
    return NextResponse.json({
      error: trustGate.issues.filter((item) => item.severity === 'blocker').map((item) => item.message).join(' ') || 'Giáo án chưa đủ điều kiện gửi duyệt/duyệt.',
      trustGate,
      qualityChecklist: trustGate.qualityChecklist
    }, { status: 412 });
  }

  const quotaGate = await assertSavedLessonQuota(user, 1);
  if (!quotaGate.allowed) {
    return NextResponse.json({ error: quotaGate.error, entitlement: { plan: quotaGate.plan, used: quotaGate.used, limit: quotaGate.limit } }, { status: quotaGate.status });
  }

  const now = new Date().toISOString();
  const lesson: SavedLessonPlan = {
    id: randomUUID(),
    title: body.title || `${body.subject} - ${body.topic}`,
    level: body.level,
    grade: body.grade,
    subject: body.subject,
    book: body.book,
    topic: body.topic,
    template: body.template,
    methods: Array.isArray(body.methods) ? body.methods : [],
    techniques: Array.isArray(body.techniques) ? body.techniques : [],
    content: body.content || '',
    status: requestedStatus,
    governanceSnapshot: body.governanceSnapshot || undefined,
    visibilityScope: body.visibilityScope === 'private' || body.visibilityScope === 'school' ? body.visibilityScope : 'department',
    currentVersion: 1,
    authorId: user.id,
    authorName: user.name,
    authorRole: user.role,
    schoolKey: user.schoolKey || settings.schoolKey,
    schoolName: user.schoolName || settings.schoolName,
    departmentKey: user.departmentKey || settings.departmentKey,
    departmentName: user.departmentName || settings.departmentName,
    reviews: [],
    versions: [],
    history: [],
    createdAt: now,
    updatedAt: now
  };

  const saved = await saveLesson(lesson, {
    actorName: user.name,
    actorRole: user.role,
    changeSummary: body.changeSummary || 'Tạo mới giáo án.',
    eventAction: body.eventAction || 'created'
  });
  await recordOperatingUsage({
    user,
    action: 'save_lesson',
    quantity: 1,
    scope: { level: saved.level, grade: saved.grade, subject: saved.subject, book: saved.book, topic: saved.topic },
    note: `Lưu giáo án mới: ${saved.title}`
  });
  return NextResponse.json({ item: saved, qualityChecklist: trustGate.qualityChecklist, trustGate }, { status: 201 });
}
