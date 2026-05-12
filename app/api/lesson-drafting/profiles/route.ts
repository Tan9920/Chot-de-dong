import { NextRequest, NextResponse } from 'next/server';
import { buildLessonDraftingProfileSummary, listLessonDraftingProfiles, resolveLessonDraftingProfile } from '@/lib/lesson-drafting-profile';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade') || undefined;
  const examMode = searchParams.get('examMode') || undefined;
  const learnerProfile = searchParams.get('learnerProfile') || undefined;

  if (grade || examMode || learnerProfile) {
    return NextResponse.json({ profile: resolveLessonDraftingProfile({ grade, examMode, learnerProfile }) });
  }

  return NextResponse.json({ summary: buildLessonDraftingProfileSummary(), profiles: listLessonDraftingProfiles() });
}
