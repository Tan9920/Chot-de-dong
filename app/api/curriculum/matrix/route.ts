import { NextRequest, NextResponse } from 'next/server';
import { buildCurriculumGapBoard, listCurriculumBooksets, listCurriculumRecords, listCurriculumSubjects, readCurriculumCompatibilityMatrix, resolveCurriculumSelection } from '@/lib/curriculum-compatibility-matrix';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const grade = url.searchParams.get('grade') || '5';
  const subject = url.searchParams.get('subject') || 'Toán';
  const topicId = url.searchParams.get('topicId') || 'g5-toan-phan-so';
  const bookset = url.searchParams.get('bookset') || 'ket_noi_tri_thuc';
  const includeLegacy = url.searchParams.get('includeLegacy') === '1';
  return NextResponse.json({
    matrix: readCurriculumCompatibilityMatrix(),
    booksets: listCurriculumBooksets({ includeLegacy }),
    subjects: listCurriculumSubjects(grade),
    records: listCurriculumRecords({ grade, subject, bookset, includeLegacy }),
    resolution: resolveCurriculumSelection({ grade, subject, topicId, bookset, adminMode: includeLegacy }),
    gapBoard: buildCurriculumGapBoard(),
    warning: 'Batch110 source-level curriculum matrix. Kết nối tri thức là trục chính; legacy/reference-only ẩn khỏi teacher flow; không claim verified/production-ready.'
  });
}
