// Batch137 admin route: /api/admin/p0-hosted-evidence-capture-board
import { NextRequest, NextResponse } from 'next/server';
import { buildP0HostedEvidenceCaptureBoard } from '@/lib/p0-hosted-evidence-capture';
import { requirePermission } from '@/lib/runtime-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem P0 hosted evidence capture board.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildP0HostedEvidenceCaptureBoard(),
    adminOnly: true,
    warning: 'Admin board này chỉ gom bằng chứng cần capture; không tự mở public rollout hoặc production-ready.'
  });
}
