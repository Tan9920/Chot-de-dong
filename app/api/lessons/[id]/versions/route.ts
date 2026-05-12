import { NextRequest, NextResponse } from 'next/server';
import { getLessonVersions } from '@/lib/storage';
import { requireLessonRouteAccess } from '@/lib/route-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireLessonRouteAccess(id, 'lesson:read');
  if (!auth.ok) return auth.response;
  const items = await getLessonVersions(id);
  return NextResponse.json({ items });
}
