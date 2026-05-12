import { NextRequest, NextResponse } from 'next/server';
import { buildPublicRolloutReadinessBoard } from '@/lib/public-rollout-readiness';
import { requirePermission } from '@/lib/runtime-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem public rollout readiness board.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildPublicRolloutReadinessBoard(),
    adminOnly: true,
    warning: 'Admin board này không tự mở public rollout; chỉ gom bằng chứng và blocker.'
  });
}
