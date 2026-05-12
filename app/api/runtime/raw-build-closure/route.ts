import { NextResponse } from 'next/server';
import { buildRuntimeRawBuildClosureReport } from '@/lib/runtime-raw-build-closure';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json(buildRuntimeRawBuildClosureReport());
}
