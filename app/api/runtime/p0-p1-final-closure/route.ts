import { NextResponse } from 'next/server';
import { buildP0P1FinalClosureBoard } from '@/lib/p0-p1-final-closure';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json(buildP0P1FinalClosureBoard());
}
