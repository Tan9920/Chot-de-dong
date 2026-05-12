import { NextResponse } from 'next/server';
import { buildAcademicSourceIntakeBoard } from '@/lib/academic-source-intake';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildAcademicSourceIntakeBoard(),
    warning: 'Admin source intake board dùng để xem scope ưu tiên và tình trạng metadata nguồn. Đây chưa phải release/verified board.'
  });
}
