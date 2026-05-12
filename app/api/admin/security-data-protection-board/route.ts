import { NextRequest, NextResponse } from 'next/server';
import { buildSecurityDataProtectionBoard } from '@/lib/security-data-protection';
import { requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('security:read', 'Bạn cần quyền admin/security để xem security data protection board.', request);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    board: buildSecurityDataProtectionBoard(),
    adminOnly: true,
    warning: 'Board admin này vẫn không được dùng để claim production-ready; hosted/Node24/visual/legal gates vẫn đang block public rollout.'
  });
}
