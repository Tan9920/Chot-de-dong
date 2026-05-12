import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { getLessonById, getSchoolSettings } from '@/lib/storage';
import { buildLessonCompliancePacket } from '@/lib/lesson-compliance';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập để xem compliance packet của giáo án.' }, { status: 401 });
  const { id } = await params;
  const lesson = await getLessonById(id);
  if (!lesson) return NextResponse.json({ error: 'Không tìm thấy giáo án.' }, { status: 404 });
  if (!assertLessonPermission(user, 'lesson:read', lesson)) {
    return NextResponse.json({ error: 'Bạn không có quyền xem compliance packet của giáo án này.' }, { status: 403 });
  }
  const settings = await getSchoolSettings();
  const packet = buildLessonCompliancePacket({ lesson, settings });
  return NextResponse.json({ packet });
}
