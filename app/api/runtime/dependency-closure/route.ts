import { NextResponse } from 'next/server';
import { buildRuntimeDependencyClosureReport } from '@/lib/runtime-dependency-closure';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    report: buildRuntimeDependencyClosureReport(),
    warning: 'Batch114 dependency closure report: không claim build/runtime/hosted nếu npm ci, next:swc-ready, build và live smoke chưa pass thật.'
  });
}
