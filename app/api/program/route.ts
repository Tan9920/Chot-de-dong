import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { contentRepository } from '@/lib/content-repository';
import { getSchoolSettings } from '@/lib/storage';
import { resolveCurriculumScope } from '@/lib/curriculum-scope';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const [curriculum, summary, settings] = await Promise.all([
    contentRepository.getCurriculumCatalog(user),
    contentRepository.getCurriculumSummary(user),
    getSchoolSettings()
  ]);
  const fallbackScope = resolveCurriculumScope(curriculum, summary.gradeLevelMap, settings);
  const grade = searchParams.get('grade') || fallbackScope?.grade || '';
  const subject = searchParams.get('subject') || fallbackScope?.subject || '';
  const book = searchParams.get('book') || fallbackScope?.book || '';
  const program = grade && subject && book ? await contentRepository.getProgramDistribution(grade, subject, book, user) : null;
  return NextResponse.json({ program });
}
