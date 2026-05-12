import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getLessonById, restoreLessonVersion } from '@/lib/storage';
import { canManageLesson } from '@/lib/workflow';
import { assertRuntimeRateLimit, assertWriteProtection } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'lesson_version_restore', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi phục hồi phiên bản.' }, { status: 401 });
  }

  const { id, versionId } = await params;
  const lesson = await getLessonById(id);
  if (!lesson) {
    return NextResponse.json({ error: 'Không tìm thấy giáo án.' }, { status: 404 });
  }
  if (!canManageLesson(user, lesson)) {
    return NextResponse.json({ error: 'Bạn không có quyền phục hồi giáo án này.' }, { status: 403 });
  }

  const restored = await restoreLessonVersion({ lessonPlanId: id, versionId, actorName: user.name, actorRole: user.role });
  if (!restored) {
    return NextResponse.json({ error: 'Không tìm thấy phiên bản cần phục hồi.' }, { status: 404 });
  }

  return NextResponse.json({ item: restored });
}
