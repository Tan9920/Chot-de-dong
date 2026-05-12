import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStorageMode, searchLessons } from '@/lib/storage';
import type { LessonStatus } from '@/lib/types';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const statusRaw = (searchParams.get('status') || 'all').trim();
  const subject = (searchParams.get('subject') || '').trim();
  const grade = (searchParams.get('grade') || '').trim();
  const author = (searchParams.get('author') || '').trim();
  const status = statusRaw === 'draft' || statusRaw === 'review' || statusRaw === 'approved' ? statusRaw as LessonStatus : 'all';

  const items = user ? await searchLessons({ query: q, status, subject, grade, author }, user) : [];
  return NextResponse.json({ items, storage: getStorageMode() });
}
