import { NextResponse } from 'next/server';
import { buildBasicWebFlowBoard } from '@/lib/demo-basic-flow';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const board = await buildBasicWebFlowBoard();
    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được basic flow board.',
      note: 'Không được claim demo usable nếu basic flow API lỗi.'
    }, { status: 500 });
  }
}
