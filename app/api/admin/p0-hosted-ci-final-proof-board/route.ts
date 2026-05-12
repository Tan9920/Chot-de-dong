import { NextRequest, NextResponse } from 'next/server';
import { buildP0HostedCiFinalProofBoard } from '@/lib/runtime-p0-hosted-ci-final-proof';
import { requirePermission } from '@/lib/runtime-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem P0 hosted CI final proof board.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildP0HostedCiFinalProofBoard(),
    adminOnly: true,
    warning: 'Admin board này không thay thế GitHub Actions/Vercel/Node24/visual proof thật.'
  });
}
