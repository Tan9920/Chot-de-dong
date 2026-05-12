// Batch136 route: /api/runtime/p0-p1-stability
import { NextResponse } from 'next/server';
import { buildP0P1StabilityBoard } from '@/lib/p0-p1-stability-gate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildP0P1StabilityBoard(),
    warning: 'P0/P1 stability board is informational and does not unlock public rollout.'
  });
}
