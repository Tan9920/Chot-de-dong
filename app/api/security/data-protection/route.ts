import { NextResponse } from 'next/server';
import { buildSecurityDataProtectionBoard } from '@/lib/security-data-protection';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildSecurityDataProtectionBoard(),
    note: 'Public safety board chỉ hiển thị trạng thái guardrail. Không chứa dữ liệu cá nhân, session, email hoặc audit event chi tiết.'
  });
}
