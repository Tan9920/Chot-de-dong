import fs from 'fs';
import path from 'path';
import { buildHostedDemoLaunchGate } from '@/lib/hosted-demo-launch-gate';
import { buildDemoFeedbackBoard } from '@/lib/demo-feedback-intake';

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function recommendationFromGate(status: string, blockers: number, mustRunOnHost: number) {
  if (blockers > 0 || status === 'blocked_by_source_issues') {
    return {
      level: 'do_not_share',
      label: 'Chưa chia link',
      reason: 'Launch gate còn source blocker. Phải sửa trước khi mời giáo viên test.'
    };
  }
  if (mustRunOnHost > 0 || status === 'source_ready_host_verification_required') {
    return {
      level: 'internal_owner_only',
      label: 'Chỉ kiểm nội bộ',
      reason: 'Source đã có đường kiểm thử nhưng host thật chưa đủ bằng chứng. Chạy Vercel build, production smoke và hosted:url-smoke trước.'
    };
  }
  if (status === 'hosted_demo_ready_with_warnings') {
    return {
      level: 'trusted_small_group_only',
      label: 'Chỉ nhóm nhỏ tin cậy',
      reason: 'Có thể mời 3–10 giáo viên tin cậy, vẫn phải thu lỗi và không quảng cáo production-ready.'
    };
  }
  return {
    level: 'trusted_small_group_only',
    label: 'Có thể test nhóm nhỏ',
    reason: 'Đủ điều kiện nguồn/runtime cơ bản để mời nhóm nhỏ có kiểm soát; chưa phải production-ready.'
  };
}

export function buildDemoTesterPack() {
  const pack = readJson<any>('data/demo-tester-feedback-pack.json', {});
  const gate = buildHostedDemoLaunchGate();
  const feedbackBoard = buildDemoFeedbackBoard();
  const recommendation = recommendationFromGate(
    gate.status,
    Number(gate.summary?.blockers || 0),
    Number(gate.summary?.mustRunOnHost || 0)
  );
  return {
    generatedAt: new Date().toISOString(),
    pack,
    launchGateSummary: {
      status: gate.status,
      package: gate.package,
      summary: gate.summary,
      blockers: gate.blockers,
      hostVerificationRequired: gate.hostVerificationRequired
    },
    shareRecommendation: recommendation,
    feedbackIntake: feedbackBoard.board,
    copyForTester: pack.safeSharingMessage,
    evidenceToCollect: pack.evidenceToCollect || [],
    feedbackForm: feedbackBoard.formConfig,
    note: 'Demo tester pack giúp chia link có kiểm soát và thu feedback có bằng chứng. Nó Không thay thế build/live smoke, QA thiết bị thật hoặc review học thuật/pháp lý.'
  };
}
