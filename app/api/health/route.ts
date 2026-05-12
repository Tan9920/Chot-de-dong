import { NextResponse } from 'next/server';
import { getStoragePaths } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const storage = getStoragePaths();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.GIAOAN_DEMO_MODE === 'true';
  return NextResponse.json({
    ok: true,
    service: 'giao-an-mvp-vn',
    generatedAt: new Date().toISOString(),
    dataMode: storage.mode,
    storage,
    demoMode,
    safety: {
      aiLessonGeneration: false,
      paidAiApi: false,
      cashPayment: false,
      cashMarketplace: false,
      publicCommunityAutoPublish: false,
      verifiedClaimByDefault: false
    },
    note: 'Health check xác nhận route sống và JSON persistence foundation; không thay thế typecheck/build/live smoke đầy đủ.'
  });
}
