import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
import { buildAcademicPackDossierTemplate } from '@/lib/academic-dossier';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi tải dossier template.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được tải dossier template.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const packId = String(searchParams.get('packId') || '').trim();
  if (!packId) {
    return NextResponse.json({ error: 'Thiếu packId để sinh dossier template.' }, { status: 400 });
  }

  const releaseBoard = await contentManagement.getPackReleaseBoard(user);
  const template = buildAcademicPackDossierTemplate(packId, releaseBoard.items);
  if (!template) {
    return NextResponse.json({ error: `Không tìm thấy pack ${packId}.` }, { status: 404 });
  }

  return NextResponse.json(template);
}
