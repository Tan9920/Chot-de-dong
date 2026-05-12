import { NextResponse } from 'next/server';
import { buildAcademicCopyrightComplianceReport, evaluateAcademicCopyrightCompliance } from '@/lib/academic-copyright-compliance';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    report: buildAcademicCopyrightComplianceReport(),
    warning: 'Batch112 chỉ kiểm tra bản quyền/pháp lý trước khi nâng Verified học thuật. Không tự nâng registry thành verified và không bật contentDepthAllowed.'
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    evaluation: evaluateAcademicCopyrightCompliance(body),
    note: 'Dry-run evaluation only: không ghi registry, không public tài nguyên và không mở nội dung sâu.'
  });
}
