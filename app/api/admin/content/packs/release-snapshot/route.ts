import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi xem release snapshot.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được xem release snapshot.' }, { status: 403 });
  }
  const packId = new URL(request.url).searchParams.get('packId');
  if (!packId) return NextResponse.json({ error: 'Thiếu packId.' }, { status: 400 });
  const snapshot = await contentManagement.getPackReleaseSnapshot(user, { packId });
  if (!snapshot) return NextResponse.json({ error: 'Không tìm thấy pack hoặc pack chưa có dữ liệu snapshot.' }, { status: 404 });
  return NextResponse.json(snapshot);
}
