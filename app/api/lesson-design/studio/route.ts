import { NextRequest, NextResponse } from 'next/server';
import { buildSubjectDataGate } from '@/lib/subject-data-truth';
import { resolveSubjectName } from '@/lib/subject-naming';
import { resolveLessonDraftingProfile } from '@/lib/lesson-drafting-profile';
import { buildLessonDesignStudioPacket } from '@/lib/lesson-design-studio';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function payloadFromSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    grade: searchParams.get('grade') || '6',
    subject: searchParams.get('subject') || 'Ngữ văn',
    book: searchParams.get('book') || 'Cánh Diều',
    topic: searchParams.get('topic') || 'Bài mở đầu',
    duration: searchParams.get('duration') || '1 tiết',
    learnerProfile: searchParams.get('learnerProfile') || 'standard',
    examMode: searchParams.get('examMode') || 'standard',
    designMode: searchParams.get('designMode') || 'standard',
    lessonIntent: searchParams.get('lessonIntent') || 'new_lesson',
    classSize: searchParams.get('classSize') || 'standard',
    deviceAccess: searchParams.get('deviceAccess') || 'teacher_only',
    space: searchParams.get('space') || 'regular_room'
  };
}

async function build(payload: any) {
  const subjectNaming = resolveSubjectName(payload.subject || 'Ngữ văn') as any;
  const subject = subjectNaming.canonicalSubject || subjectNaming.canonical || payload.subject || 'Ngữ văn';
  const profile = resolveLessonDraftingProfile({ ...payload, subject });
  const gate = buildSubjectDataGate({ grade: payload.grade, subject, book: payload.book, topic: payload.topic });
  return buildLessonDesignStudioPacket({ payload: { ...payload, subject }, profile, gate });
}

export async function GET(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'lesson_design_studio_read', { windowMs: 60_000, max: 120 });
  if (!rate.allowed) return rate.response;
  const studio = await build(payloadFromSearchParams(request));
  return NextResponse.json({ studio, note: 'Lesson Design Studio là lớp thiết kế bài dạy không-AI; thiếu dữ liệu verified thì chỉ dựng khung an toàn.' });
}

export async function POST(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'lesson_design_studio_write', { windowMs: 60_000, max: 40 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 80_000, required: true });
  if (!parsed.ok) return parsed.response;
  const studio = await build(parsed.body || {});
  return NextResponse.json({ studio, note: 'Đã dựng gói thiết kế bài dạy. Đây không phải thẩm định chuyên môn.' });
}
