import { NextRequest, NextResponse } from 'next/server';
import { listActivityGameModerationBoard } from '@/lib/activity-game-moderation';
import { assertRuntimeRateLimit, requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('content:review', 'Bạn cần quyền review nội dung để xem Activity/Game Library board.');
  if (!gate.ok) return gate.response;
  const rate = assertRuntimeRateLimit(request, 'admin_activity_game_library_read', { windowMs: 60_000, max: 60 });
  if (!rate.allowed) return rate.response;
  const board = await listActivityGameModerationBoard();
  return NextResponse.json(board);
}
