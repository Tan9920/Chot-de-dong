import { NextResponse } from 'next/server';
import { buildDemoReadinessBoard } from '@/lib/demo-readiness';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const board = await buildDemoReadinessBoard();
    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được demo readiness board.',
      note: 'Không được claim demo-ready nếu readiness API lỗi.'
    }, { status: 500 });
  }
}
