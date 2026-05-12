import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildRuntimeDeployClosureBoard } from './runtime-deploy-closure';

type AnyRecord = Record<string, any>;

type GateState = 'pass' | 'blocked' | 'unverified' | 'warning';

function exists(file: string) {
  return fs.existsSync(path.join(process.cwd(), file));
}

function readText(file: string, fallback = '') {
  try {
    return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  } catch {
    return fallback;
  }
}

function readJson(file: string, fallback: any = null) {
  try {
    return JSON.parse(readText(file, JSON.stringify(fallback)));
  } catch {
    return fallback;
  }
}

function platformSwcPackage() {
  const platform = os.platform();
  const arch = os.arch();
  if (platform === 'linux' && arch === 'x64') return 'node_modules/@next/swc-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return 'node_modules/@next/swc-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return 'node_modules/@next/swc-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return 'node_modules/@next/swc-darwin-arm64';
  if (platform === 'win32' && arch === 'x64') return 'node_modules/@next/swc-win32-x64-msvc';
  if (platform === 'win32' && arch === 'arm64') return 'node_modules/@next/swc-win32-arm64-msvc';
  return null;
}

function nextBinaryPath() {
  return process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
}

function artifactOk(file: string) {
  const artifact = readJson(file, null);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function gate(id: string, label: string, command: string, state: GateState, evidence: string, blocksTeacherTest = true) {
  return { id, label, command, state, ok: state === 'pass', evidence, blocksTeacherTest };
}

export function classifyHostedRuntimeLog(logText = '') {
  const text = String(logText || '');
  const lower = text.toLowerCase();
  const signals = [
    {
      id: 'registry_dns_failure',
      severity: 'blocker',
      match: /eai_again|getaddrinfo|fetch failed|registry\.npmjs\.org/i.test(text),
      teacherMeaning: 'Máy/CI chưa tới được npm registry nên install sạch có thể fail.'
    },
    {
      id: 'npm_timeout_or_cli_exit_handler',
      severity: 'blocker',
      match: /npm_ci_timeout|exit handler never called|timed out|timeout/i.test(text),
      teacherMeaning: 'npm install chưa hoàn tất; không được coi node_modules là đầy đủ.'
    },
    {
      id: 'next_binary_missing',
      severity: 'blocker',
      match: /next: not found|node_modules\/\.bin\/next missing|next_binary.*false/i.test(text),
      teacherMeaning: 'Thiếu Next binary nên build production sẽ fail.'
    },
    {
      id: 'swc_missing_or_optional_omitted',
      severity: 'blocker',
      match: /swc|optional package|without --omit=optional|@next\/swc/i.test(text) && /missing|false|not found|incomplete/i.test(text),
      teacherMeaning: 'Thiếu SWC/native package; cần install không bỏ optional dependencies.'
    },
    {
      id: 'build_failed',
      severity: 'blocker',
      match: /failed to compile|build failed|command "npm run build|next build.*error|exit code: 1/i.test(text),
      teacherMeaning: 'Build production fail; chưa thể mời giáo viên test.'
    },
    {
      id: 'dependencies_missing_runtime_smoke',
      severity: 'blocker',
      match: /dependencies_missing/i.test(text),
      teacherMeaning: 'Runtime smoke bị chặn vì dependency chưa cài đủ.'
    },
    {
      id: 'hosted_smoke_missing_url',
      severity: 'warning',
      match: /giaoan_demo_url|hosted url|skipped/i.test(lower) && /missing|skipped|optional/i.test(lower),
      teacherMeaning: 'Chưa chạy smoke trên URL host thật.'
    },
    {
      id: 'build_success_signal',
      severity: 'evidence',
      match: /compiled successfully|generating static pages|finalizing page optimization|\.next\/build_id/i.test(lower),
      teacherMeaning: 'Log có tín hiệu build thành công, nhưng vẫn cần smoke và artifact.'
    }
  ];
  const matched = signals.filter((signal) => signal.match).map(({ match, ...signal }) => signal);
  return {
    ok: matched.filter((item) => item.severity === 'blocker').length === 0,
    matched,
    blockerCount: matched.filter((item) => item.severity === 'blocker').length,
    warningCount: matched.filter((item) => item.severity === 'warning').length,
    note: 'Batch106 log classifier chỉ phân loại log đã dán vào. Nó không tự build, không deploy, không thay thế smoke thật.'
  };
}

export function evaluateHostedRuntimeEvidence(input: AnyRecord = {}) {
  const plan = readJson('data/runtime-hosted-closure-evidence.json', {});
  const runtimeDeployBoard = buildRuntimeDeployClosureBoard();
  const runtimeReportOk = artifactOk('artifacts/runtime-closure-report-last-run.json');
  const hostedReportOk = artifactOk('artifacts/hosted-demo-url-smoke-last-run.json');
  const deployReportOk = artifactOk('artifacts/runtime-deploy-closure-last-run.json');
  const swcPackage = platformSwcPackage();
  const dependencyState = {
    nodeModules: exists('node_modules'),
    nextBinary: exists(nextBinaryPath()),
    expectedSwcPackage: swcPackage,
    expectedSwcPresent: swcPackage ? exists(swcPackage) : false,
    nextBuildId: exists('.next/BUILD_ID'),
    runtimeClosureArtifactOk: runtimeReportOk,
    hostedUrlSmokeArtifactOk: hostedReportOk,
    runtimeDeployArtifactOk: deployReportOk
  };
  const logAnalysis = classifyHostedRuntimeLog(input.logText || input.vercelLog || input.buildLog || '');
  const gates = [
    gate('registry_diagnose', 'Public npm registry reachable', 'npm run registry:diagnose', input.registryOk === true ? 'pass' : logAnalysis.matched.some((item) => item.id === 'registry_dns_failure') ? 'blocked' : 'unverified', input.registryOk === true ? 'manual/input ok=true' : 'needs fresh registry command output'),
    gate('install_clean', 'Clean dependency install completed', 'npm run install:clean', dependencyState.nodeModules && dependencyState.nextBinary ? 'pass' : logAnalysis.matched.some((item) => ['npm_timeout_or_cli_exit_handler', 'next_binary_missing', 'dependencies_missing_runtime_smoke'].includes(item.id)) ? 'blocked' : 'unverified', dependencyState.nodeModules ? 'node_modules exists; still require Next/SWC check' : 'node_modules missing'),
    gate('next_swc_ready', 'Next binary and SWC package ready', 'npm run next:swc-ready', dependencyState.nextBinary && dependencyState.expectedSwcPresent ? 'pass' : logAnalysis.matched.some((item) => ['next_binary_missing', 'swc_missing_or_optional_omitted'].includes(item.id)) ? 'blocked' : 'unverified', `${nextBinaryPath()}=${dependencyState.nextBinary}; swc=${dependencyState.expectedSwcPresent}`),
    gate('build_clean', 'Production build completed', 'npm run build:clean', dependencyState.nextBuildId ? 'pass' : logAnalysis.matched.some((item) => item.id === 'build_failed' || item.id === 'next_binary_missing') ? 'blocked' : 'unverified', dependencyState.nextBuildId ? '.next/BUILD_ID exists' : '.next/BUILD_ID missing'),
    gate('live_smoke_clean', 'Local production HTTP smoke passed', 'GIAOAN_SMOKE_MODE=production npm run live:smoke:clean', runtimeReportOk ? 'pass' : logAnalysis.matched.some((item) => item.id === 'dependencies_missing_runtime_smoke') ? 'blocked' : 'unverified', runtimeReportOk ? 'runtime closure artifact ok=true' : 'runtime closure artifact not ok=true'),
    gate('auth_invite_runtime_smoke', 'Auth/invite runtime smoke passed', 'npm run auth-invite:runtime-smoke', input.authInviteSmokeOk === true ? 'pass' : logAnalysis.matched.some((item) => item.id === 'dependencies_missing_runtime_smoke') ? 'blocked' : 'unverified', input.authInviteSmokeOk === true ? 'manual/input ok=true' : 'needs auth invite runtime smoke output'),
    gate('hosted_url_smoke', 'Hosted URL smoke passed', 'GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke', hostedReportOk || input.hostedUrlSmokeOk === true ? 'pass' : logAnalysis.matched.some((item) => item.id === 'hosted_smoke_missing_url') ? 'warning' : 'unverified', hostedReportOk ? 'hosted URL artifact ok=true' : 'needs hosted URL smoke for real URL'),
    gate('browser_qa_mobile_desktop', 'Browser QA mobile/desktop captured', 'manual QA screenshots/logs', input.browserQaOk === true ? 'pass' : 'unverified', input.browserQaOk === true ? 'manual/input ok=true' : 'manual QA not attached', false)
  ];
  const hardBlockers = gates.filter((item) => item.blocksTeacherTest && item.state === 'blocked');
  const missingRequired = gates.filter((item) => item.blocksTeacherTest && item.state !== 'pass');
  const passCount = gates.filter((item) => item.ok).length;
  const readinessPercent = gates.length ? Math.round((passCount / gates.length) * 100) : 0;
  const teacherSmallGroupTest = missingRequired.length === 0;
  return {
    planVersion: plan.version || 'batch106-real-hosted-runtime-closure',
    dependencyState,
    gates,
    hardBlockers,
    missingRequired,
    logAnalysis,
    priorBatch105: {
      status: runtimeDeployBoard.status,
      readinessPercent: runtimeDeployBoard.readinessPercent,
      hardBlockers: runtimeDeployBoard.runtime?.hardBlockers || [],
      hostedBlockers: runtimeDeployBoard.runtime?.hostedBlockers || []
    },
    readinessPercent,
    status: teacherSmallGroupTest ? 'teacher_test_candidate_hosted_runtime_guarded' : hardBlockers.length ? 'hosted_runtime_blocked' : 'hosted_runtime_unverified',
    claimAllowed: {
      sourceLevel: true,
      dependencyInstalled: dependencyState.nodeModules && dependencyState.nextBinary,
      buildPass: dependencyState.nextBuildId,
      runtimePass: runtimeReportOk,
      hostedPass: hostedReportOk || input.hostedUrlSmokeOk === true,
      teacherSmallGroupTest,
      productionReady: false
    },
    nextCommands: gates.filter((item) => item.state !== 'pass').map((item) => item.command),
    warning: 'Batch106 không tự sửa môi trường mạng/Vercel. Nó làm rõ log/blocker và chỉ mở claim khi có proof thật.'
  };
}

export function buildHostedRuntimeClosureBoard(input: AnyRecord = {}) {
  const pkg = readJson('package.json', {});
  const plan = readJson('data/runtime-hosted-closure-evidence.json', {});
  const evidence = evaluateHostedRuntimeEvidence(input);
  return {
    batch: 'Batch106 — Real Hosted Runtime Closure / Vercel Log Fix',
    version: pkg.version || 'unknown',
    generatedAt: new Date().toISOString(),
    status: evidence.status,
    plainLanguageStatus: evidence.claimAllowed.teacherSmallGroupTest
      ? 'Có đủ proof tối thiểu để cân nhắc nhóm nhỏ test có kiểm soát; vẫn không production-ready.'
      : 'Batch106 đã tạo hosted-runtime evidence board, nhưng demo vẫn chưa được gọi là chạy thật nếu registry/install/build/smoke/hosted còn blocked hoặc unverified.',
    readinessPercent: evidence.readinessPercent,
    evidence,
    requiredProofChain: Array.isArray(plan.requiredProofChain) ? plan.requiredProofChain : [],
    forbiddenClaims: plan.forbiddenClaims || [],
    allowedClaims: plan.allowedClaims || [],
    nextActions: evidence.nextCommands,
    teacherFacingWarning: 'Không gửi giáo viên test rộng trước khi hosted URL smoke pass và có QA mobile/desktop cơ bản.'
  };
}
