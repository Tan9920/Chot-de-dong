import { NextResponse } from 'next/server';
import { buildHostedRuntimeClosureBoard } from '@/lib/runtime-hosted-closure';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildHostedRuntimeClosureBoard(),
    warning: 'Admin hosted runtime board dùng để xem blocker registry/install/Next/SWC/build/smoke/hosted. Đây không phải bằng chứng production-ready.'
  });
}
