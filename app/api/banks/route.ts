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
  const grade = searchParams.get('grade') || undefined;
  const subjectInput = searchParams.get('subject') || undefined;
  const subject = subjectInput ? canonicalSubjectName(subjectInput) : undefined;
  const book = searchParams.get('book') || undefined;
  const topic = searchParams.get('topic') || undefined;

  const questions = await contentRepository.getQuestionBank(grade, subject, book, topic, user);
  const rubrics = await contentRepository.getRubricBank(grade, subject, book, topic, user);

  return NextResponse.json({
    questions,
    rubrics
  });
}
