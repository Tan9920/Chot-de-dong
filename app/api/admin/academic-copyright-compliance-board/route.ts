import { NextResponse } from 'next/server';
import { buildAcademicCopyrightComplianceBoard } from '@/lib/academic-copyright-compliance';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildAcademicCopyrightComplianceBoard(),
    warning: 'Admin board dùng để chặn bản quyền/pháp lý trước khi review/release. Không dùng để fake coverage, không auto-public community resource.'
  });
}
