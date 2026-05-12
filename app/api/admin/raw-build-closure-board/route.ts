import { NextResponse } from 'next/server';
import { buildRuntimeRawBuildClosureReport } from '@/lib/runtime-raw-build-closure';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const report = buildRuntimeRawBuildClosureReport();
  return NextResponse.json({
    board: 'Batch117 Raw Next Build / Hosted Closure Board',
    ok: report.ok,
    rawBuildClosed: report.rawBuildClosed,
    hostedClosed: report.hostedClosed,
    status: report.status,
    checks: report.checks,
    warning: report.warning,
    generatedAt: report.generatedAt
  });
}
