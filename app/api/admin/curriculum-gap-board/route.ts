import { NextResponse } from 'next/server';
import { buildCurriculumGapBoard, readCurriculumCompatibilityMatrix } from '@/lib/curriculum-compatibility-matrix';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildCurriculumGapBoard(),
    matrix: readCurriculumCompatibilityMatrix(),
    adminWarning: 'Curriculum Gap Board source-level: nhìn lớp/môn/bài nào thiếu nguồn, thiếu reviewer, bị legacy/reference-only, unmapped hoặc chưa được release. Không thay thế review chuyên môn thật.'
  });
}
