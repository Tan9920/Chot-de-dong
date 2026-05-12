import { NextResponse } from 'next/server';
import { buildRuntimeDependencyClosureBoard } from '@/lib/runtime-dependency-closure';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildRuntimeDependencyClosureBoard(),
    warning: 'Admin runtime board: dùng để xem blocker dependency/build/runtime; không phải bằng chứng deploy pass.'
  });
}
