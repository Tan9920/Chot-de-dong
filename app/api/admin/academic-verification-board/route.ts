import { NextResponse } from 'next/server';
import { buildAcademicVerificationBoard } from '@/lib/academic-coverage-audit';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildAcademicVerificationBoard(),
    warning: 'Admin academic verification board là nền nhập-duyệt dữ liệu học thuật. Không được dùng board này để tự nâng verified nếu chưa có nguồn hợp pháp và reviewer thật.'
  });
}
