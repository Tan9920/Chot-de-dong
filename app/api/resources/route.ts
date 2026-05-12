import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { contentRepository } from '@/lib/content-repository';
import { canonicalSubjectName } from '@/lib/subject-naming';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const grade = searchParams.get('grade') || '';
  const subject = canonicalSubjectName(searchParams.get('subject') || '');
  const book = searchParams.get('book') || '';
  const topic = searchParams.get('topic') || '';

  const items = await contentRepository.filterSharedResources({ q, grade, subject, book, topic }, user);
  return NextResponse.json({ items });
}
