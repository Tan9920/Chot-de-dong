import { NextResponse } from 'next/server';
import { buildRuntimeDeployClosureBoard } from '@/lib/runtime-deploy-closure';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildRuntimeDeployClosureBoard(),
    warning: 'Admin runtime deploy board dùng để xem blocker install/build/hosted. Đây không phải bằng chứng production-ready.'
  });
}
