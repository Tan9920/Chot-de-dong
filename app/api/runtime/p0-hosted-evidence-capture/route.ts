// Batch137 route: /api/runtime/p0-hosted-evidence-capture
import { NextResponse } from 'next/server';
import { buildP0HostedEvidenceCaptureBoard } from '@/lib/p0-hosted-evidence-capture';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildP0HostedEvidenceCaptureBoard(),
    warning: 'P0 hosted evidence capture board is informational and does not unlock public rollout.'
  });
}
