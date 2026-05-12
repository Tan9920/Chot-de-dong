import { NextResponse } from 'next/server';
import { buildRuntimeBuildClosureGuardReport } from '@/lib/runtime-build-closure-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const report = buildRuntimeBuildClosureGuardReport();
  return NextResponse.json({
    board: report,
    warning: 'Batch116 board separates guarded build artifacts from raw next build proof. Do not claim production-ready without live/auth/hosted smoke.'
  });
}
