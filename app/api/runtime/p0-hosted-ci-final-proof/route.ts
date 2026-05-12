import { NextResponse } from 'next/server';
import { buildP0HostedCiFinalProofBoard } from '@/lib/runtime-p0-hosted-ci-final-proof';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildP0HostedCiFinalProofBoard(),
    warning: 'P0 hosted CI final proof board is an evidence runner. Missing Node24/APP_URL/visual artifacts means public rollout remains blocked.'
  });
}
