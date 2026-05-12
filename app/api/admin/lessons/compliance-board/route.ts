import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { isLessonVisibleToUser } from '@/lib/governance';
import { getSchoolSettings, readLessons } from '@/lib/storage';
import { buildLessonComplianceBoard } from '@/lib/lesson-compliance';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập để xem lesson compliance board.' }, { status: 401 });
  if (!assertLessonPermission(user, 'lesson:review')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được xem lesson compliance board.' }, { status: 403 });
  }
  const [settings, lessons] = await Promise.all([getSchoolSettings(), readLessons()]);
  const visibleLessons = lessons.filter((lesson) => isLessonVisibleToUser(user, lesson));
  const board = buildLessonComplianceBoard(visibleLessons, settings);
  return NextResponse.json({ board });
}
