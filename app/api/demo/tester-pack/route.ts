import { NextResponse } from 'next/server';
import { buildDemoTesterPack } from '@/lib/demo-tester-pack';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    return NextResponse.json(buildDemoTesterPack());
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được demo tester pack.',
      note: 'Không nên chia link demo nếu tester pack API lỗi hoặc thiếu hướng dẫn thu feedback.'
    }, { status: 500 });
  }
}
