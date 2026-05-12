import { NextRequest, NextResponse } from 'next/server';
import { getLessonPedagogyProfile } from '@/lib/lesson-pedagogy';
import { getGradeLessonBlueprint } from '@/lib/grade-lesson-structure';
import { resolveSubjectName } from '@/lib/subject-naming';
import { getLessonTechnicalDraftingProfile } from '@/lib/lesson-technical-drafting';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade') || 'Lớp 1';
  const level = searchParams.get('level') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const profile = getLessonPedagogyProfile(grade, level);
  const gradeBlueprint = getGradeLessonBlueprint(grade, level);
  const subjectNaming = subject ? resolveSubjectName(subject) : undefined;
  const technicalDrafting = getLessonTechnicalDraftingProfile(grade, level);

  return NextResponse.json({
    profile,
    gradeBlueprint,
    subjectNaming,
    technicalDrafting,
    notice: 'Hồ sơ sư phạm và chuẩn kĩ thuật soạn giáo án theo lớp là rule-based foundation, không phải dữ liệu verified từ chuyên gia. Dùng để tránh áp một khung giáo án chung hoặc câu chữ kỹ thuật yếu cho mọi lớp.'
  });
}
