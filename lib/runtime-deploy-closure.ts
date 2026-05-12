
import fs from 'fs';
import path from 'path';

function readJson(file: string, fallback: any = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function exists(file: string) {
  return fs.existsSync(path.join(process.cwd(), file));
}

function expectedSwcPackage() {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === 'linux' && arch === 'x64') return 'node_modules/@next/swc-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return 'node_modules/@next/swc-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return 'node_modules/@next/swc-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return 'node_modules/@next/swc-darwin-arm64';
  if (platform === 'win32' && arch === 'x64') return 'node_modules/@next/swc-win32-x64-msvc';
  if (platform === 'win32' && arch === 'arm64') return 'node_modules/@next/swc-win32-arm64-msvc';
  return null;
}

function commandFromArtifact(report: any, label: string) {
  const commands = Array.isArray(report?.commands) ? report.commands : [];
  return commands.find((item: any) => item?.label === label) || null;
}

export function evaluateRuntimeDeployEvidence(input: any = {}) {
  const artifact = input?.artifact || readJson('artifacts/runtime-closure-report-last-run.json', null);
  const hosted = input?.hosted || readJson('artifacts/hosted-demo-url-smoke-last-run.json', null);
  const swc = expectedSwcPackage();
  const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
  const dependencyState = {
    nodeModules: exists('node_modules'),
    nextBinary: exists(nextBin),
    expectedSwcPackage: swc,
    expectedSwcPresent: swc ? exists(swc) : false,
    nextBuildId: exists('.next/BUILD_ID')
  };
  const registry = commandFromArtifact(artifact, 'registry_diagnose');
  const nextReady = commandFromArtifact(artifact, 'next_swc_ready');
  const sourceValidate = commandFromArtifact(artifact, 'source_validate') || commandFromArtifact(artifact, 'source_smoke_batch105');
  const hostedOk = Boolean(hosted?.ok && !hosted?.skipped) || Boolean(hosted?.status === 'pass');
  const dependencyInstalled = dependencyState.nextBinary && dependencyState.expectedSwcPresent;
  const buildOutputPresent = dependencyState.nextBuildId;
  const runtimeReportOk = Boolean(artifact?.ok);
  const sourcePass = Boolean(sourceValidate?.ok) || Boolean(input?.sourcePass);
  const evidenceSteps = [
    { id: 'registry_diagnose', label: 'Public npm registry reachable', command: 'npm run registry:diagnose', ok: Boolean(registry?.ok), status: registry?.ok ? 'pass' : 'blocked_or_unverified' },
    { id: 'install_clean', label: 'Dependencies installed with optional Next SWC', command: 'npm run install:clean', ok: dependencyInstalled, status: dependencyInstalled ? 'pass' : 'blocked_or_unverified' },
    { id: 'next_swc_ready', label: 'Next binary and platform SWC present', command: 'npm run next:swc-ready', ok: Boolean(nextReady?.ok) || dependencyInstalled, status: (Boolean(nextReady?.ok) || dependencyInstalled) ? 'pass' : 'blocked_or_unverified' },
    { id: 'build_clean', label: 'Next build output exists', command: 'npm run build:clean', ok: buildOutputPresent, status: buildOutputPresent ? 'pass' : 'blocked_or_unverified' },
    { id: 'runtime_closure_report', label: 'Runtime closure artifact ok=true', command: 'npm run runtime:closure-report', ok: runtimeReportOk, status: runtimeReportOk ? 'pass' : 'blocked_or_unverified' },
    { id: 'source_smoke_batch105', label: 'Batch105 source smoke passes', command: 'npm run smoke:batch105', ok: sourcePass, status: sourcePass ? 'pass' : 'blocked_or_unverified' },
    { id: 'hosted_url_smoke', label: 'Hosted URL smoke passes', command: 'GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke', ok: hostedOk, status: hostedOk ? 'pass' : 'required_before_public_test' }
  ];
  const hardBlockers = evidenceSteps.filter((step) => !step.ok && step.id !== 'hosted_url_smoke');
  const hostedBlockers = evidenceSteps.filter((step) => !step.ok && step.id === 'hosted_url_smoke');
  let status = 'source_level_runtime_gate_ready';
  if (!dependencyInstalled) status = 'dependency_blocked';
  else if (!buildOutputPresent) status = 'build_blocked';
  else if (!hostedOk) status = 'hosted_smoke_required';
  else status = 'teacher_test_candidate';
  return {
    status,
    dependencyState,
    evidenceSteps,
    hardBlockers,
    hostedBlockers,
    claimAllowed: {
      sourceLevel: true,
      buildPass: buildOutputPresent,
      runtimePass: runtimeReportOk,
      hostedPass: hostedOk,
      teacherSmallGroupTest: hardBlockers.length === 0 && hostedOk,
      productionReady: false
    },
    warnings: [
      'Batch105 runtimeDeployClosureBoard là evidence gate, không phải bằng chứng hosted nếu chưa chạy hosted URL smoke.',
      'Không được claim production-ready vì vẫn thiếu DB production, browser QA rộng, security hardening thật và dữ liệu học thuật verified.',
      'Không được nâng seed/scaffold thành reviewed/verified chỉ vì runtime đã pass.'
    ]
  };
}

export function buildRuntimeDeployClosureBoard() {
  const pkg = readJson('package.json', {});
  const plan = readJson('data/runtime-deploy-closure-plan.json', {});
  const runtime = evaluateRuntimeDeployEvidence();
  const requiredProofChain = Array.isArray(plan.requiredProofChain) ? plan.requiredProofChain : [];
  const passedSteps = runtime.evidenceSteps.filter((step) => step.ok).length;
  const totalSteps = runtime.evidenceSteps.length;
  const readinessPercent = totalSteps ? Math.round((passedSteps / totalSteps) * 100) : 0;
  return {
    batch: 'Batch105 — Runtime/Hosted Closure Breakthrough',
    version: pkg.version || 'unknown',
    generatedAt: new Date().toISOString(),
    status: runtime.status,
    plainLanguageStatus: runtime.claimAllowed.teacherSmallGroupTest
      ? 'Có thể cân nhắc mời nhóm nhỏ test có kiểm soát sau khi hosted smoke pass, nhưng vẫn không production-ready.'
      : 'Đã có bảng khóa runtime/deploy rõ ràng, nhưng chưa được gọi là demo chạy thật cho giáo viên nếu install/build/hosted smoke chưa pass.',
    readinessPercent,
    requiredProofChain,
    runtime,
    nextActions: requiredProofChain.map((item: any) => ({ id: item.id, command: item.command, teacherMeaning: item.teacherMeaning })),
    forbiddenClaims: [
      'Không nói production-ready.',
      'Không nói đã deploy thành công nếu chưa có hosted URL smoke pass.',
      'Không nói build pass nếu chưa có .next/BUILD_ID sau npm run build:clean.',
      'Không nói dữ liệu 1–12 đã verified vì Batch105 không động vào verified data.',
      'Không nói app là AI tạo giáo án chuẩn.'
    ],
    allowedClaims: [
      'Có thể nói Batch105 bổ sung runtime/deploy evidence gate ở source-level.',
      'Có thể nói đã có lệnh và board để nhìn rõ blocker install/build/hosted.',
      'Có thể nói batch này không thêm AI, không thêm payment, không tạo verified giả.'
    ]
  };
}
