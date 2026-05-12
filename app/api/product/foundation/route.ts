import { NextResponse } from 'next/server';
import { buildProductFoundationBoard } from '@/lib/product-foundation';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const board = await buildProductFoundationBoard();
    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được product foundation board.',
      note: 'Không được claim nền móng sản phẩm ổn nếu /api/product/foundation lỗi.'
    }, { status: 500 });
  }
}
