import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi lấy scaffold evidence ledger.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Bạn không có quyền lấy scaffold evidence ledger.' }, { status: 403 });
  }
  const packId = new URL(request.url).searchParams.get('packId') || '';
  if (!packId) {
    return NextResponse.json({ error: 'Thiếu packId để sinh scaffold evidence ledger.' }, { status: 400 });
  }
  const scaffold = await contentManagement.getPackAcademicEvidenceLedgerScaffold(user, { packId });
  if (!scaffold) return NextResponse.json({ error: `Không tìm thấy dữ liệu/scaffold cho pack ${packId}.` }, { status: 404 });
  return NextResponse.json(scaffold);
}
