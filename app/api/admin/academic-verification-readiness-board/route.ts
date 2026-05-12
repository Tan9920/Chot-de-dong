import { NextResponse } from 'next/server';
import { buildAcademicVerificationReadinessBoard } from '@/lib/academic-verification-accelerator';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildAcademicVerificationReadinessBoard(),
    warning: 'Admin board phục vụ nâng Verified học thuật thật theo từng scope nhỏ. không dùng để fake coverage hoặc claim đủ 1–12.'
  });
}
