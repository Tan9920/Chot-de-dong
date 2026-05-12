import { NextResponse } from 'next/server';
import { buildAcademicVerificationReadinessReport } from '@/lib/academic-verification-accelerator';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    report: buildAcademicVerificationReadinessReport(),
    warning: 'Batch111 chỉ tạo official source spine + readiness report. API này không nâng registry thành verified và không bật contentDepthAllowed.'
  });
}
