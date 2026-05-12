import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi xem citation kit của pack.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được xem citation kit của pack.' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const packId = searchParams.get('packId') || undefined;
  if (!packId) return NextResponse.json({ error: 'Thiếu packId.' }, { status: 400 });
  const summary = await contentManagement.getPackCitationKit(packId);
  return NextResponse.json(summary);
}
