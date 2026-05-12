// Batch138 admin route: /api/admin/p0-hosted-proof-execution-gate-board
import { NextRequest, NextResponse } from 'next/server';
import { buildP0HostedProofExecutionGateBoard } from '@/lib/p0-hosted-proof-execution-gate';
import { requirePermission } from '@/lib/runtime-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem P0 hosted proof execution gate.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildP0HostedProofExecutionGateBoard(),
    adminOnly: true,
    warning: 'Admin board này chỉ đọc bằng chứng và blocker; không tự mở production-ready hoặc bỏ qua public rollout gate.'
  });
}
