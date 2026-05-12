import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi xem release board học thuật.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được xem release board học thuật.' }, { status: 403 });
  }

  const board = await contentManagement.getPackReleaseBoard(user);
  return NextResponse.json({ exportedAt: new Date().toISOString(), board });
}
