// Batch136 route: /api/runtime/p0-p1-stability
import { NextRequest, NextResponse } from 'next/server';
import { buildP0P1StabilityBoard } from '@/lib/p0-p1-stability-gate';
import { requirePermission } from '@/lib/runtime-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem P0/P1 stability board.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildP0P1StabilityBoard(),
    adminOnly: true,
    warning: 'Admin board này không mở P1/public rollout; chỉ gom blocker P0/P1 và bằng chứng cần chạy lại.'
  });
}
