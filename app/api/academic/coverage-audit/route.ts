import { NextRequest, NextResponse } from 'next/server';
import { buildAcademicCoverageAuditReport, buildAcademicVerificationGate } from '@/lib/academic-coverage-audit';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const book = searchParams.get('book') || undefined;
  const topic = searchParams.get('topic') || undefined;

  return NextResponse.json({
    report: buildAcademicCoverageAuditReport({ grade, subject }),
    gate: grade || subject || book || topic ? buildAcademicVerificationGate({ grade, subject, book, topic }) : undefined,
    warning: 'Batch103 academic coverage audit đo sự thật dữ liệu học thuật. Đây không phải bằng chứng dữ liệu đã verified; scope chưa đủ điều kiện luôn bị khóa ở chế độ khung an toàn.'
  });
}
