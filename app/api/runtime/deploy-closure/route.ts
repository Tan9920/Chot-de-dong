import { NextRequest, NextResponse } from 'next/server';
import { buildRuntimeDeployClosureBoard, evaluateRuntimeDeployEvidence } from '@/lib/runtime-deploy-closure';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildRuntimeDeployClosureBoard(),
    warning: 'Batch105 runtime deploy closure là evidence gate. Không claim demo chạy thật nếu install/build/live/hosted smoke chưa pass.'
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
    mode: 'dry_run_runtime_evidence_evaluation_only',
    evaluation: evaluateRuntimeDeployEvidence(body),
    warning: 'POST chỉ đánh giá bằng chứng runtime/deploy đầu vào; không chạy build, không deploy, không thay dữ liệu học thuật.'
  });
}
