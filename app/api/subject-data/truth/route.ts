import { NextRequest, NextResponse } from 'next/server';
import { buildSubjectDataGate, buildSubjectDataSummary, listSubjectDataRecords } from '@/lib/subject-data-truth';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const book = searchParams.get('book') || undefined;
  const topic = searchParams.get('topic') || undefined;

  if (grade || subject || book || topic) {
    const gate = buildSubjectDataGate({ grade, subject, book, topic });
    return NextResponse.json({ gate });
  }

  return NextResponse.json({
    summary: buildSubjectDataSummary(),
    records: listSubjectDataRecords(),
    warning: 'Danh sách này là truth registry dữ liệu môn học. Có dòng coverage không có nghĩa là đã có dữ liệu verified hoặc được phép sinh kiến thức sâu.'
  });
}
