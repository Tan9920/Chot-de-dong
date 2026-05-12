import { NextResponse } from 'next/server';
import { buildStrategyRiskAudit } from '@/lib/strategy-risk-audit';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const audit = await buildStrategyRiskAudit();
    return NextResponse.json({ audit });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được strategy risk audit.',
      note: 'Không được coi product strategy alignment là ổn nếu endpoint audit này lỗi.'
    }, { status: 500 });
  }
}
