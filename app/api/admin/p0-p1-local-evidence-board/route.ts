// Batch139 route: /api/admin/p0-p1-local-evidence-board
import { NextRequest, NextResponse } from 'next/server';
import { buildP0P1LocalEvidenceBoard } from '@/lib/p0-p1-local-evidence';
import { requirePermission } from '@/lib/runtime-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem Local P0/P1 Evidence board.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildP0P1LocalEvidenceBoard(),
    adminOnly: true,
    warning: 'Board này chỉ gom bằng chứng local hiện tại; không tự mở production-ready hoặc public rollout.'
  });
}
