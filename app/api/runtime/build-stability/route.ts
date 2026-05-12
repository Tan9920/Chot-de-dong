import { NextResponse } from 'next/server';
import { buildRuntimeBuildStabilityReport } from '@/lib/runtime-build-stability';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json(buildRuntimeBuildStabilityReport());
}
