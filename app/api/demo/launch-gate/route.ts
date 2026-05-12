import { NextResponse } from 'next/server';
import { buildHostedDemoLaunchGate } from '@/lib/hosted-demo-launch-gate';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const gate = buildHostedDemoLaunchGate();
    return NextResponse.json({ gate });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được hosted demo launch gate.',
      note: 'Không được chia link demo công khai nếu launch gate API lỗi.'
    }, { status: 500 });
  }
}
