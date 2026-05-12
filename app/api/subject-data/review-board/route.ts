import { NextResponse } from 'next/server';
import { buildCurriculumImportReviewBoard } from '@/lib/curriculum-data-pipeline';
import { buildSubjectDataSummary } from '@/lib/subject-data-truth';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    subjectDataSummary: buildSubjectDataSummary(),
    importReviewBoard: buildCurriculumImportReviewBoard(),
    warning: 'Review board này là foundation để nhập/duyệt dữ liệu môn học; chưa có dữ liệu verified mới.'
  });
}
