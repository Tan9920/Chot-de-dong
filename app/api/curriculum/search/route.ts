import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { contentRepository } from '@/lib/content-repository';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const grade = searchParams.get('grade') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const book = searchParams.get('book') || undefined;

  return NextResponse.json({
    items: await contentRepository.searchCurriculum(q, grade, subject, book, user)
  });
}
