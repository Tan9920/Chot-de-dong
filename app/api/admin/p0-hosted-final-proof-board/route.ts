import { NextRequest, NextResponse } from 'next/server';
import { buildP0HostedFinalProofBoard } from '@/lib/runtime-p0-hosted-final-proof';
import { requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem P0 hosted final proof board.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildP0HostedFinalProofBoard(),
    adminOnly: true,
    warning: 'Admin board này vẫn không thay thế Vercel/Node24/visual proof thật.'
  });
}
