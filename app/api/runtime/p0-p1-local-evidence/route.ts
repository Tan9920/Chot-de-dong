// Batch139 route: /api/runtime/p0-p1-local-evidence
import { NextResponse } from 'next/server';
import { buildP0P1LocalEvidenceBoard } from '@/lib/p0-p1-local-evidence';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildP0P1LocalEvidenceBoard(),
    warning: 'Local P0/P1 evidence board is informational. It does not unlock hosted/public rollout.'
  });
}
