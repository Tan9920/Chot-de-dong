import { NextRequest, NextResponse } from 'next/server';
import { getLessonVersionDiff } from '@/lib/storage';
import { requireLessonRouteAccess } from '@/lib/route-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireLessonRouteAccess(id, 'lesson:read');
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get('versionId');
  const compareVersionId = searchParams.get('compareVersionId');

  if (!versionId) {
    return NextResponse.json({ error: 'Thiếu versionId để so sánh.' }, { status: 400 });
  }

  const diff = await getLessonVersionDiff({ lessonPlanId: id, versionId, compareVersionId });
  if (!diff) {
    return NextResponse.json({ error: 'Không tạo được bản diff cho cặp phiên bản này.' }, { status: 404 });
  }

  return NextResponse.json({ diff });
}
