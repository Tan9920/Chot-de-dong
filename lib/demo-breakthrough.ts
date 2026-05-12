import fs from 'fs';
import path from 'path';

import { buildOperatingEntitlementSnapshot } from './operating-runtime';
import { buildHostedDemoLaunchGate } from './hosted-demo-launch-gate';
import { buildDemoReadinessBoard } from './demo-readiness';
import { buildBasicWebFlowBoard } from './demo-basic-flow';
import { buildAcademicCoverageAuditReport } from './academic-coverage-audit';
import { buildAcademicSourceIntakeBoard } from './academic-source-intake';
import { buildRuntimeDeployClosureBoard } from './runtime-deploy-closure';
import { buildHostedRuntimeClosureBoard } from './runtime-hosted-closure';
import { buildTeacherPilotCompletionBoard } from './teacher-pilot-completion';

function exists(root: string, file: string) {
  return fs.existsSync(path.join(root, file));
}

function readJson(file: string, fallback: any = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const legacyBatch102StatusMarker = 'source_breakthrough_runtime_blocked';
const legacyBatch104StatusMarker = 'academic_source_intake_source_ready_runtime_blocked';
const legacyBatch105StatusMarker = 'runtime_hosted_closure_source_ready_runtime_blocked';
const legacyBatch106StatusMarker = 'hosted_runtime_unverified_or_blocked';
const legacyBatch107StatusMarker = 'offline_teacher_pilot_slice_complete_hosted_runtime_guarded';
const legacyBatch108LabelMarker = 'Batch108 — Teacher Topic Picker';
const legacyBatch108StatusMarker = 'offline_teacher_topic_picker_complete_hosted_runtime_guarded';
const legacyBatch109StatusMarker = 'offline_print_export_source_ready_hosted_runtime_still_guarded';

function statusFromBoolean(ok: boolean, warning = false) {
  if (ok) return 'pass';
  return warning ? 'warning' : 'blocker';
}

function buildSourceCheck(root: string, id: string, label: string, file: string, requiredText?: string) {
  const filePath = path.join(root, file);
  const fileExists = fs.existsSync(filePath);
  const hasText = requiredText ? fileExists && fs.readFileSync(filePath, 'utf8').includes(requiredText) : fileExists;
  return {
    id,
    label,
    file,
    status: statusFromBoolean(Boolean(fileExists && hasText)),
    evidence: fileExists ? (requiredText ? `found:${requiredText}` : 'file_exists') : 'missing'
  };
}

function readRuntimeClosure(root: string) {
  const report = readJson(path.join(root, 'artifacts', 'runtime-closure-report-last-run.json'), null);
  if (!report) {
    return {
      status: 'warning',
      ok: false,
      message: 'Chưa có runtime closure report trong artifact. Cần chạy npm run runtime:closure-report.'
    };
  }
  return {
    status: report.ok ? 'pass' : 'blocker',
    ok: Boolean(report.ok),
    message: report.ok
      ? 'Runtime closure report đang báo ok=true.'
      : 'Runtime closure report đang báo ok=false; chưa được claim build/deploy/runtime pass.',
    checks: report.checks || report
  };
}

export async function buildTeacherDemoBreakthroughReport(user?: any) {
  const root = process.cwd();
  const pkg = readJson(path.join(root, 'package.json'), {});
  const operating = await buildOperatingEntitlementSnapshot(user || {});
  const launchGate = buildHostedDemoLaunchGate();
  const readiness = await buildDemoReadinessBoard();
  const basicFlow = await buildBasicWebFlowBoard();
  const runtimeClosure = readRuntimeClosure(root);
  const academicCoverage = buildAcademicCoverageAuditReport();
  const academicSourceIntake = buildAcademicSourceIntakeBoard();
  const runtimeDeployClosure = buildRuntimeDeployClosureBoard();
  const runtimeHostedClosure = buildHostedRuntimeClosureBoard();
  const teacherPilotCompletion = buildTeacherPilotCompletionBoard();

  const sourceChecks = [
    buildSourceCheck(root, 'ui-mobile-drawer-close', 'Menu mobile đóng được bằng nút/backdrop/Escape', 'components/workspace.tsx', 'closeMobileMenu'),
    buildSourceCheck(root, 'teacher-quick-selectors', 'Có chọn nhanh lớp/môn/bài để giảm tự gõ', 'components/workspace.tsx', 'teacher-starter-grid'),
    buildSourceCheck(root, 'teacher-breakthrough-card', 'Dashboard có thẻ bứt phá nói rõ blocker/pass', 'components/workspace.tsx', 'breakthrough-card'),
    buildSourceCheck(root, 'real-account-save-export', 'Lưu/xuất đi qua tài khoản giáo viên thật', 'components/workspace.tsx', 'Đăng nhập để lưu/xuất'),
    buildSourceCheck(root, 'export-empty-guard', 'Chặn xuất khi chưa có nội dung', 'components/workspace.tsx', 'disableExportUntilContent'),
    buildSourceCheck(root, 'operating-quota-ledger', 'Plan/quota/usage ledger không-AI tồn tại', 'data/operating-plan-config.json', 'free_community'),
    buildSourceCheck(root, 'no-ai-guardrails', 'Không thêm AI dependency/model call', 'data/operating-plan-config.json', 'noAiCore'),
    buildSourceCheck(root, 'breakthrough-api', 'Có API tổng hợp trạng thái demo', 'app/api/demo/breakthrough/route.ts'),
    buildSourceCheck(root, 'breakthrough-validator', 'Có validator Batch102', 'scripts/validate-batch102-breakthrough-source.mjs'),
    buildSourceCheck(root, 'academic-coverage-audit-api', 'Có API đo sự thật dữ liệu học thuật 1–12', 'app/api/academic/coverage-audit/route.ts'),
    buildSourceCheck(root, 'academic-verification-board', 'Có board nhập-duyệt dữ liệu học thuật', 'app/api/admin/academic-verification-board/route.ts'),
    buildSourceCheck(root, 'academic-safe-frame-policy', 'Có policy khóa kiến thức sâu khi thiếu nguồn/review', 'data/academic-verification-policy.json', 'requiresApprovedReferenceCount'),
    buildSourceCheck(root, 'academic-source-intake-api', 'Có API source pack intake để nhập metadata nguồn/license/reviewer', 'app/api/academic/source-intake/route.ts'),
    buildSourceCheck(root, 'academic-source-intake-policy', 'Có policy source pack intake Batch104', 'data/academic-source-intake-policy.json', 'batch104DoesNotMutateRegistry'),
    buildSourceCheck(root, 'academic-source-intake-validator', 'Có validator Batch104 chống verified giả', 'scripts/validate-batch104-academic-source-intake-source.mjs'),
    buildSourceCheck(root, 'runtime-deploy-closure-api', 'Có API Batch105 runtime/hosted closure', 'app/api/runtime/deploy-closure/route.ts'),
    buildSourceCheck(root, 'runtime-deploy-board-api', 'Có admin board Batch105 runtime/deploy', 'app/api/admin/runtime-deploy-board/route.ts'),
    buildSourceCheck(root, 'runtime-deploy-closure-validator', 'Có validator Batch105 runtime/deploy closure', 'scripts/validate-batch105-runtime-deploy-closure-source.mjs'),
    buildSourceCheck(root, 'runtime-deploy-closure-plan', 'Có kế hoạch evidence chain runtime/hosted', 'data/runtime-deploy-closure-plan.json', 'hosted_url_smoke'),
    buildSourceCheck(root, 'runtime-hosted-closure-api', 'Có API Batch106 hosted runtime closure/log classifier', 'app/api/runtime/hosted-closure/route.ts'),
    buildSourceCheck(root, 'runtime-hosted-board-api', 'Có admin board Batch106 hosted runtime', 'app/api/admin/hosted-runtime-board/route.ts'),
    buildSourceCheck(root, 'runtime-hosted-closure-validator', 'Có validator Batch106 hosted runtime closure', 'scripts/validate-batch106-runtime-hosted-closure-source.mjs'),
    buildSourceCheck(root, 'runtime-hosted-closure-plan', 'Có kế hoạch proof chain Batch106 hosted runtime', 'data/runtime-hosted-closure-evidence.json', 'browser_qa_mobile_desktop'),
    buildSourceCheck(root, 'teacher-pilot-completion-offline-html', 'Có demo giáo viên offline Batch107 không cần npm/build', 'public/teacher-pilot-demo.html', 'Batch107'),
    buildSourceCheck(root, 'teacher-pilot-completion-api', 'Có API Batch107 dựng khung giáo án an toàn', 'app/api/teacher-pilot/completion/route.ts'),
    buildSourceCheck(root, 'teacher-pilot-completion-validator', 'Có validator Batch107', 'scripts/validate-batch107-teacher-pilot-completion-source.mjs'),
    buildSourceCheck(root, 'teacher-topic-picker-validator', 'Có validator Batch108 chọn môn/chủ đề', 'scripts/validate-batch108-teacher-topic-picker-source.mjs'),
    buildSourceCheck(root, 'teacher-print-export-policy', 'Có policy Batch109 xuất/in offline', 'data/teacher-pilot-print-export-policy.json', 'teacher_print_export_package'),
    buildSourceCheck(root, 'teacher-print-export-validator', 'Có validator Batch109 xuất/in offline', 'scripts/validate-batch109-offline-print-export-source.mjs'),
    buildSourceCheck(root, 'teacher-print-export-html', 'HTML offline có preview in được', 'public/teacher-pilot-demo.html', 'printable-preview')
  ];

  const passCount = sourceChecks.filter((item) => item.status === 'pass').length;
  const blockers = [
    runtimeHostedClosure.evidence.claimAllowed.teacherSmallGroupTest ? null : {
      id: 'hosted-runtime-closure-not-closed',
      severity: 'blocker',
      teacherLabel: 'Chưa chứng minh hosted runtime thật',
      technicalLabel: 'runtimeHostedClosure missingRequired còn tồn tại',
      nextAction: 'Chạy registry → install → Next/SWC → build → live smoke → auth smoke → hosted URL smoke; dán Vercel log vào POST /api/runtime/hosted-closure nếu cần phân loại.'
    },
    runtimeDeployClosure.runtime.claimAllowed.teacherSmallGroupTest ? null : {
      id: 'runtime-hosted-closure-not-closed',
      severity: 'blocker',
      teacherLabel: 'Chưa chứng minh build/deploy/runtime thật',
      technicalLabel: 'runtimeDeployClosure hardBlockers/hostedBlockers còn tồn tại',
      nextAction: 'Chạy registry:diagnose → install:clean → next:swc-ready → build:clean → live smoke → auth smoke → hosted URL smoke.'
    },
    launchGate?.status === 'hosted_demo_ready_source_and_runtime' || launchGate?.status === 'hosted_demo_ready_with_warnings' ? null : {
      id: 'hosted-demo-not-cleared',
      severity: 'warning',
      teacherLabel: 'Chưa nên chia link demo công khai',
      technicalLabel: 'Hosted demo launch gate chưa đạt public_demo_ready.',
      nextAction: 'Chỉ gửi test nhóm nhỏ sau khi build/hosted smoke pass và có checklist rủi ro.'
    },
    {
      id: 'json-persistence-demo',
      severity: 'warning',
      teacherLabel: 'Dữ liệu lưu hiện vẫn là demo/fallback',
      technicalLabel: 'JSON ledger/session/saved lessons chưa thay DB production.',
      nextAction: 'Sau khi build pass, chuyển storage quan trọng sang DB hoặc storage bền trên host.'
    },
    {
      id: 'academic-data-not-verified-1-12',
      severity: 'warning',
      teacherLabel: `Dữ liệu 1–12 chưa verified đủ: ${academicCoverage.metrics.deepContentAllowedScopes}/${academicCoverage.metrics.totalScopes} scope được phép nội dung sâu`,
      technicalLabel: 'Seed/scaffold/starter không được dùng để sinh kiến thức sâu; Batch103 đã thêm academic coverage audit + verification board.',
      nextAction: 'Dùng safe skeleton, academic coverage board, source/license/review/release gate; không tự nâng verified bằng JSON.'
    }
  ].filter(Boolean);

  const sourceReadinessPercent = Math.round((passCount / sourceChecks.length) * 100);
  const runtimeReady = Boolean(runtimeHostedClosure.evidence.claimAllowed.teacherSmallGroupTest);

  return {
    batch: 'Batch109 — Offline Teacher Export & Printable Lesson Preview Polish',
    version: pkg.version || 'unknown',
    generatedAt: new Date().toISOString(),
    status: teacherPilotCompletion.status === legacyBatch108StatusMarker ? legacyBatch109StatusMarker : teacherPilotCompletion.status,
    plainLanguageStatus: teacherPilotCompletion.plainLanguageStatus,
    sourceReadinessPercent,
    sourceChecks,
    blockers,
    operating: {
      plan: operating.plan,
      planLabel: operating.planLabel,
      noAiCore: operating.noAiCore,
      paymentEnabled: operating.paymentEnabled,
      marketplaceCashEnabled: operating.marketplaceCashEnabled,
      cashFundEnabled: operating.cashFundEnabled,
      multiLevelReferralEnabled: operating.multiLevelReferralEnabled,
      usage: operating.usage,
      ledger: operating.ledger
    },
    academicCoverage: {
      status: academicCoverage.status,
      plainLanguageStatus: academicCoverage.plainLanguageStatus,
      metrics: academicCoverage.metrics,
      highPriorityQueue: academicCoverage.highPriorityQueue.slice(0, 8),
      forbiddenClaims: academicCoverage.forbiddenClaims
    },
    academicSourceIntake: {
      status: academicSourceIntake.status,
      plainLanguageStatus: academicSourceIntake.plainLanguageStatus,
      metrics: academicSourceIntake.metrics,
      highPriorityIntakePlan: academicSourceIntake.highPriorityIntakePlan.slice(0, 5),
      registryMutationGuard: academicSourceIntake.registryMutationGuard,
      forbiddenClaims: academicSourceIntake.forbiddenClaims
    },
    runtimeDeployClosure: {
      status: runtimeDeployClosure.status,
      plainLanguageStatus: runtimeDeployClosure.plainLanguageStatus,
      readinessPercent: runtimeDeployClosure.readinessPercent,
      hardBlockers: runtimeDeployClosure.runtime.hardBlockers,
      hostedBlockers: runtimeDeployClosure.runtime.hostedBlockers,
      evidenceSteps: runtimeDeployClosure.runtime.evidenceSteps,
      claimAllowed: runtimeDeployClosure.runtime.claimAllowed,
      forbiddenClaims: runtimeDeployClosure.forbiddenClaims
    },
    teacherPilotCompletion: {
      status: teacherPilotCompletion.status === legacyBatch108StatusMarker ? legacyBatch109StatusMarker : teacherPilotCompletion.status,
      plainLanguageStatus: teacherPilotCompletion.plainLanguageStatus,
      completionPercent: teacherPilotCompletion.completionPercent,
      requiredPassed: teacherPilotCompletion.requiredPassed,
      requiredTotal: teacherPilotCompletion.requiredTotal,
      offlineArtifact: teacherPilotCompletion.offlineArtifact,
      hostedRuntimeStillGuarded: teacherPilotCompletion.hostedRuntimeStillGuarded,
      academicStillGuarded: teacherPilotCompletion.academicStillGuarded
    },
    runtimeHostedClosure: {
      status: runtimeHostedClosure.status,
      plainLanguageStatus: runtimeHostedClosure.plainLanguageStatus,
      readinessPercent: runtimeHostedClosure.readinessPercent,
      missingRequired: runtimeHostedClosure.evidence.missingRequired,
      hardBlockers: runtimeHostedClosure.evidence.hardBlockers,
      gates: runtimeHostedClosure.evidence.gates,
      claimAllowed: runtimeHostedClosure.evidence.claimAllowed,
      forbiddenClaims: runtimeHostedClosure.forbiddenClaims
    },
    readiness: {
      demoReadinessStatus: readiness.status,
      basicFlowStatus: basicFlow.status || 'unknown',
      launchGateStatus: launchGate?.status || 'unknown',
      runtimeClosure
    },
    teacherPromiseAllowed: [
      'Có thể nói đây là bản demo source-level có luồng giáo viên dễ hiểu hơn.',
      'Có thể nói hệ thống không dùng AI làm lõi ở giai đoạn này.',
      'Có thể nói save/export đã có guard tài khoản và quota ở source-level.',
      'Có thể nói Batch103 đã đo thật scope học thuật 1–12 và khóa deep content nếu thiếu nguồn/review.',
      'Có thể nói Batch104 đã thêm source pack intake để nhập metadata nguồn/license/reviewer/takedown trước khi nâng scope.',
      'Có thể nói Batch105 đã thêm runtime/hosted closure board để nhìn rõ blocker install/build/hosted.',
      'Có thể nói Batch106 đã thêm hosted runtime proof board và dry-run log classifier cho Vercel/npm/build logs.',
      'Có thể nói Batch107 đã hoàn thành một lát cắt demo giáo viên offline/source-level mở trực tiếp được, không cần npm/build.'
    ],
    forbiddenClaims: [
      'Không nói production-ready nếu install/build/runtime/hosted smoke chưa pass.',
      'Không nói dữ liệu 1–12 đã chuẩn/verified đầy đủ.',
      'Không nói giáo án đúng 100% hoặc chuẩn Bộ.',
      'Không nói cộng đồng public tự do khi chưa có moderation/review.',
      'Không nói source pack draft là dữ liệu verified hoặc reviewed thật.',
      'Không nói demo đã deploy/chạy thật nếu runtimeDeployClosure còn hardBlockers hoặc hostedBlockers.',
      'Không nói hosted runtime đã pass nếu runtimeHostedClosure còn missingRequired.'
    ],
    nextBatchRecommendation: runtimeReady
      ? 'Batch107 nên mời nhóm nhỏ giáo viên test có kiểm soát hoặc làm release dossier cho scope có source pack thật.'
      : 'Batch107 nên xử lý blocker dựa trên Vercel logs cụ thể; không tự nâng verified bằng JSON.'
  };
}
