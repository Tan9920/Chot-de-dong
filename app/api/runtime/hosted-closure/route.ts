import { NextRequest, NextResponse } from 'next/server';
import { buildHostedRuntimeClosureBoard, classifyHostedRuntimeLog, evaluateHostedRuntimeEvidence } from '@/lib/runtime-hosted-closure';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({
    board: buildHostedRuntimeClosureBoard(),
    warning: 'Batch106 hosted runtime closure là evidence gate. Không claim build/deploy/hosted pass nếu chưa có proof thật.'
  });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const logText = body.logText || body.vercelLog || body.buildLog || '';
  return NextResponse.json({
    mode: 'dry_run_hosted_runtime_log_and_evidence_evaluation_only',
    logAnalysis: classifyHostedRuntimeLog(logText),
    evaluation: evaluateHostedRuntimeEvidence(body),
    board: buildHostedRuntimeClosureBoard(body),
    warning: 'POST chỉ phân loại log/evidence đã gửi vào; không chạy npm install, không build, không deploy và không đổi dữ liệu học thuật.'
  });
}
