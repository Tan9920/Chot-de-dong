import { NextRequest, NextResponse } from 'next/server';
import { buildAcademicSourceIntakeBoard, evaluateAcademicSourcePack } from '@/lib/academic-source-intake';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildAcademicSourceIntakeBoard(),
    warning: 'Batch104 source intake chỉ đánh giá metadata nguồn/reviewer/license. API này không nâng registry và không bật deep content.'
  });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  return NextResponse.json({
    mode: 'dry_run_evaluation_only',
    evaluation: evaluateAcademicSourcePack(body),
    warning: 'Kết quả POST chỉ là đánh giá source pack đầu vào. Không ghi file, không public học liệu, không đổi sourceStatus/reviewStatus/supportLevel/contentDepthAllowed.'
  });
}
