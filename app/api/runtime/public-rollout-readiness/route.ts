import { NextResponse } from 'next/server';
import { buildPublicRolloutReadinessBoard } from '@/lib/public-rollout-readiness';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildPublicRolloutReadinessBoard(),
    warning: 'Public rollout readiness board is a hard gate. Missing hosted/visual/Node24 evidence keeps rollout blocked.'
  });
}
