import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { applyLessonGovernanceSnapshotBackfill, buildLessonGovernanceBackfillReport } from '@/lib/lesson-provenance-backfill';
import { isLessonVisibleToUser } from '@/lib/governance';
import { readLessons, saveLesson } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập để xem preview backfill provenance giáo án.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/quản trị có quyền quản trị nội dung mới được xem backfill provenance.' }, { status: 403 });
  }
  const lessons = (await readLessons()).filter((lesson) => isLessonVisibleToUser(user, lesson));
  return NextResponse.json({ report: await buildLessonGovernanceBackfillReport(lessons) });
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập để chạy backfill provenance giáo án.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/quản trị có quyền quản trị nội dung mới được chạy backfill provenance.' }, { status: 403 });
  }

  const rate = assertRuntimeRateLimit(request, 'admin_admin_lessons_provenance_backfill_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const apply = body.apply === true;
  const lessons = (await readLessons()).filter((lesson) => isLessonVisibleToUser(user, lesson));
  const preview = await buildLessonGovernanceBackfillReport(lessons);
  if (!apply) return NextResponse.json({ applied: false, report: preview });

  const byId = new Map(preview.items.map((item) => [item.lessonId, item]));
  for (const lesson of lessons) {
    const item = byId.get(lesson.id);
    if (!item || item.action !== 'backfill' || !item.snapshot) continue;
    await saveLesson(applyLessonGovernanceSnapshotBackfill(lesson, item), {
      actorName: user.name,
      actorRole: user.role,
      changeSummary: `Backfill governance/provenance snapshot từ pack ${item.matchedPackId}.`,
      eventAction: 'updated'
    });
  }

  const finalLessons = (await readLessons()).filter((lesson) => isLessonVisibleToUser(user, lesson));
  return NextResponse.json({ applied: true, report: await buildLessonGovernanceBackfillReport(finalLessons) });
}
