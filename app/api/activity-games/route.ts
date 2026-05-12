import { NextRequest, NextResponse } from 'next/server';
import { searchActivityGameLibrary } from '@/lib/activity-game-library';
import { assertRuntimeRateLimit } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'activity_game_library_read', { windowMs: 60_000, max: 120 });
  if (!rate.allowed) return rate.response;
  const { searchParams } = new URL(request.url);
  const result = await searchActivityGameLibrary({
    grade: searchParams.get('grade') || '',
    subject: searchParams.get('subject') || '',
    topic: searchParams.get('topic') || '',
    q: searchParams.get('q') || '',
    kind: searchParams.get('kind') || ''
  });
  return NextResponse.json({
    ...result,
    note: 'Activity/Game Library là kho hoạt động không-AI. Seed/scaffold chỉ là khung gợi ý an toàn, không phải nội dung đã verified.'
  });
}
