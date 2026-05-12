import { NextRequest, NextResponse } from 'next/server';
import { buildCommunityHubBoard } from '@/lib/community-prestige-hub';
import { assertRuntimeRateLimit } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'community_hub_public_read', { windowMs: 60_000, max: 80 });
  if (!rate.allowed) return rate.response;
  const board = await buildCommunityHubBoard({ admin: false });
  return NextResponse.json({
    board,
    note: 'Community Hub chỉ hiển thị creator/tài nguyên đủ điều kiện public. Seed/demo không được dùng để quảng cáo cộng đồng thật.'
  });
}
