// Batch138 route: /api/runtime/p0-hosted-proof-execution-gate
import { NextResponse } from 'next/server';
import { buildP0HostedProofExecutionGateBoard } from '@/lib/p0-hosted-proof-execution-gate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildP0HostedProofExecutionGateBoard(),
    warning: 'P0 hosted proof execution gate is informational and evidence-based. It does not mark production-ready.'
  });
}
