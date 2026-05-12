import { NextResponse } from 'next/server';
import { buildP0HostedFinalProofBoard } from '@/lib/runtime-p0-hosted-final-proof';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildP0HostedFinalProofBoard(),
    warning: 'P0 hosted final proof board là evidence gate; không claim production-ready/100% nếu còn missingRequired.'
  });
}
