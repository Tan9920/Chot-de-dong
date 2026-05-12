import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { buildTeacherDemoBreakthroughReport } from '@/lib/demo-breakthrough';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const user = await getSessionUser();
    const report = await buildTeacherDemoBreakthroughReport(user);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Không dựng được breakthrough report.',
      note: 'Nếu API này lỗi thì không được claim demo đã sẵn sàng.'
    }, { status: 500 });
  }
}
