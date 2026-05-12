import { NextResponse } from 'next/server';
import { buildOperatingFoundationBoard } from '@/lib/product-operating';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const board = await buildOperatingFoundationBoard();
    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không dựng được operating foundation board.' }, { status: 500 });
  }
}
