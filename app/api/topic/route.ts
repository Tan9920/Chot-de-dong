import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { contentRepository } from '@/lib/content-repository';
import { resolveSubjectName } from '@/lib/subject-naming';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') || '';
  const grade = searchParams.get('grade') || '';
  const subjectInput = searchParams.get('subject') || '';
  const subjectResolution = resolveSubjectName(subjectInput);
  const subject = subjectResolution.canonical;
  const book = searchParams.get('book') || '';
  const topicTitle = searchParams.get('topic') || '';
  const topic = await contentRepository.getTopic(level, grade, subject, book, topicTitle, user);

  if (!topic) {
    return NextResponse.json({ error: 'Không tìm thấy chủ đề.', topic: null, related: [] }, { status: 404 });
  }

  return NextResponse.json({
    topic,
    subjectNaming: subjectResolution,
    related: await contentRepository.listRelatedTopics(grade, subject, book, topicTitle, user)
  });
}
