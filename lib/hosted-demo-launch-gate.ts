import fs from 'fs';
import path from 'path';

type Severity = 'pass' | 'warning' | 'blocker' | 'must_run_on_host';

type GateCheck = {
  id: string;
  label: string;
  status: Severity;
  detail?: string;
  evidence?: string[];
};

function exists(root: string, file: string) {
  return fs.existsSync(path.join(root, file));
}

function readText(root: string, file: string) {
  try { return fs.readFileSync(path.join(root, file), 'utf8'); } catch { return ''; }
}

function readJson<T>(root: string, file: string, fallback: T): T {
  try { return JSON.parse(readText(root, file)) as T; } catch { return fallback; }
}

function hasScript(pkg: any, script: string) {
  return Boolean(pkg?.scripts?.[script]);
}

function fileCheck(root: string, id: string, label: string, files: string[]): GateCheck {
  const missing = files.filter((file) => !exists(root, file));
  return {
    id,
    label,
    status: missing.length ? 'blocker' : 'pass',
    detail: missing.length ? `Thiếu file: ${missing.join(', ')}` : 'Đủ file bắt buộc.',
    evidence: files
  };
}

function scriptCheck(root: string, pkg: any, id: string, label: string, scripts: string[]): GateCheck {
  const missing = scripts.filter((script) => !hasScript(pkg, script));
  return {
    id,
    label,
    status: missing.length ? 'blocker' : 'pass',
    detail: missing.length ? `Thiếu npm script: ${missing.join(', ')}` : 'Đủ npm scripts bắt buộc.',
    evidence: scripts
  };
}

function textClaimCheck(root: string): GateCheck {
  const text = [
    readText(root, 'README.md'),
    readText(root, 'components/workspace.tsx'),
    readText(root, 'app/page.tsx')
  ].join('\n').toLowerCase();
  const forbidden = [
    'ai tạo giáo án chuẩn 100%',
    'chuẩn bộ 100%',
    'dùng ngay không cần sửa',
    'không vi phạm gì cả',
    'đăng tài liệu là có tiền',
    'public tự do'
  ];
  const hits = forbidden.filter((phrase) => text.includes(phrase));
  return {
    id: 'forbidden_public_claims',
    label: 'Không có claim public gây hiểu nhầm trong README/workspace/foundation.',
    status: hits.length ? 'blocker' : 'pass',
    detail: hits.length ? `Phát hiện claim cần sửa: ${hits.join(', ')}` : 'Không thấy claim cấm ở bề mặt public chính.',
    evidence: forbidden
  };
}

function noAiSdkCheck(pkg: any): GateCheck {
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const forbidden = ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain'];
  const hits = forbidden.filter((name) => deps[name]);
  return {
    id: 'no_ai_sdk_dependency',
    label: 'Không có AI SDK/model dependency trong giai đoạn đầu.',
    status: hits.length ? 'blocker' : 'pass',
    detail: hits.length ? `Có dependency AI bị cấm: ${hits.join(', ')}` : 'Không phát hiện AI SDK trong package.json.',
    evidence: forbidden
  };
}

function runtimeHostState(root: string): GateCheck[] {
  const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
  const hasNext = exists(root, nextBin);
  const hasBuild = exists(root, '.next/BUILD_ID');
  const hasNodeModules = exists(root, 'node_modules');
  const hostedUrlSmokePath = 'artifacts/hosted-demo-url-smoke-last-run.json';
  const hostedUrlSmoke = readJson<any>(root, hostedUrlSmokePath, null);
  const hostedUrlSmokeStatus: Severity = hostedUrlSmoke?.ok === true && hostedUrlSmoke?.skipped !== true
    ? 'pass'
    : hostedUrlSmoke?.ok === false && hostedUrlSmoke?.skipped !== true
      ? 'blocker'
      : 'must_run_on_host';

  return [
    {
      id: 'dependency_install_runtime_state',
      label: 'Dependency đã cài trên máy/CI đang chạy chưa.',
      status: hasNext ? 'pass' : 'must_run_on_host',
      detail: hasNext ? 'Có next binary.' : 'Chưa có node_modules/.bin/next trong artifact/source hiện tại; phải chạy npm run install:clean trên host thật.',
      evidence: [nextBin, hasNodeModules ? 'node_modules_present' : 'node_modules_absent']
    },
    {
      id: 'production_build_runtime_state',
      label: 'Production build output đã có chưa.',
      status: hasBuild ? 'pass' : 'must_run_on_host',
      detail: hasBuild ? 'Có .next/BUILD_ID.' : 'Chưa có .next/BUILD_ID trong artifact/source; phải chạy npm run build:clean rồi production live smoke trên host thật.',
      evidence: ['.next/BUILD_ID']
    },
    {
      id: 'hosted_url_smoke_runtime_state',
      label: 'Domain Vercel/host thật đã pass hosted URL smoke chưa.',
      status: hostedUrlSmokeStatus,
      detail: hostedUrlSmoke?.ok === true && hostedUrlSmoke?.skipped !== true
        ? `Hosted URL smoke đã pass cho ${hostedUrlSmoke.base || 'domain đã cấu hình'}.`
        : hostedUrlSmoke?.ok === false && hostedUrlSmoke?.skipped !== true
          ? `Hosted URL smoke đã chạy nhưng fail: ${hostedUrlSmoke.message || hostedUrlSmoke.error || 'không rõ lỗi'}.`
          : 'Chưa có artifacts/hosted-demo-url-smoke-last-run.json; phải chạy GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke sau khi deploy thật.',
      evidence: [hostedUrlSmokePath, 'npm run hosted:url-smoke']
    }
  ];
}

function feedbackEvidenceState(root: string): GateCheck {
  const file = 'data/demo-feedback-submissions.json';
  const store = readJson<any>(root, file, null);
  const submissions = Array.isArray(store?.submissions) ? store.submissions : [];
  const open = submissions.filter((item: any) => !['resolved', 'wont_fix', 'duplicate'].includes(item?.status));
  const openP0 = open.filter((item: any) => item?.severity === 'P0').length;
  const openP1 = open.filter((item: any) => item?.severity === 'P1').length;
  if (!exists(root, file)) {
    return { id: 'demo_feedback_evidence_dossier', label: 'Có feedback evidence dossier để kiểm soát vòng test giáo viên.', status: 'blocker', detail: 'Thiếu data/demo-feedback-submissions.json.', evidence: [file, '/api/demo/feedback'] };
  }
  if (openP0 > 0 || openP1 > 0) {
    return { id: 'demo_feedback_evidence_dossier', label: 'Không có P0/P1 mở trong feedback giáo viên.', status: 'blocker', detail: `Đang có P0/P1 mở: P0=${openP0}, P1=${openP1}. Không mở rộng demo.`, evidence: [file, '/api/demo/feedback'] };
  }
  if (submissions.length === 0) {
    return { id: 'demo_feedback_evidence_dossier', label: 'Có feedback evidence dossier để kiểm soát vòng test giáo viên.', status: 'warning', detail: 'Chưa có feedback giáo viên thật; chỉ được mời nhóm nhỏ tin cậy, chưa mở rộng.', evidence: [file, '/api/demo/feedback'] };
  }
  return { id: 'demo_feedback_evidence_dossier', label: 'Feedback evidence dossier không có P0/P1 mở.', status: 'pass', detail: `Có ${submissions.length} feedback đã ghi, không có P0/P1 mở.`, evidence: [file, '/api/demo/feedback'] };
}

export function buildHostedDemoLaunchGate() {
  const root = process.cwd();
  const pkg = readJson<any>(root, 'package.json', {});
  const checklist = readJson<any>(root, 'data/hosted-demo-release-checklist.json', {});
  const productFoundation = readJson<any>(root, 'data/product-foundation.json', {});
  const sourceGates: any[] = Array.isArray(checklist?.sourceGates) ? checklist.sourceGates : [];
  const checks: GateCheck[] = [];

  for (const gate of sourceGates) {
    if (Array.isArray(gate.requiredFiles) && gate.requiredFiles.length) {
      checks.push(fileCheck(root, `${gate.id}_files`, `${gate.label} — files`, gate.requiredFiles));
    }
    if (Array.isArray(gate.requiredScripts) && gate.requiredScripts.length) {
      checks.push(scriptCheck(root, pkg, `${gate.id}_scripts`, `${gate.label} — scripts`, gate.requiredScripts));
    }
  }

  checks.push(noAiSdkCheck(pkg));
  checks.push(textClaimCheck(root));
  checks.push({
    id: 'non_ai_positioning_policy',
    label: 'Product foundation vẫn khóa định vị không-AI giai đoạn đầu.',
    status: productFoundation?.positioning?.nonAiFirst === true && productFoundation?.positioning?.teacherFinalReviewRequired === true ? 'pass' : 'blocker',
    detail: productFoundation?.positioning?.nonAiFirst === true ? 'nonAiFirst=true và yêu cầu giáo viên kiểm tra cuối.' : 'Product foundation chưa khóa nonAiFirst/teacherFinalReviewRequired.',
    evidence: ['data/product-foundation.json']
  });
  checks.push(...runtimeHostState(root));
  checks.push(feedbackEvidenceState(root));

  const blockers = checks.filter((check) => check.status === 'blocker');
  const hostRequired = checks.filter((check) => check.status === 'must_run_on_host');
  const warnings = checks.filter((check) => check.status === 'warning');
  const status = blockers.length
    ? 'blocked_by_source_issues'
    : hostRequired.length
      ? 'source_ready_host_verification_required'
      : warnings.length
        ? 'hosted_demo_ready_with_warnings'
        : 'hosted_demo_ready_source_and_runtime';

  return {
    generatedAt: new Date().toISOString(),
    status,
    package: { name: pkg.name, version: pkg.version, next: pkg.dependencies?.next, react: pkg.dependencies?.react },
    summary: {
      totalChecks: checks.length,
      pass: checks.filter((check) => check.status === 'pass').length,
      blockers: blockers.length,
      mustRunOnHost: hostRequired.length,
      warnings: warnings.length
    },
    blockers,
    hostVerificationRequired: hostRequired,
    warnings,
    checks,
    mustPassOnHostBeforeSharing: checklist?.mustPassOnHostBeforeSharing || [],
    manualQaRequired: checklist?.manualQaRequired || [],
    publicTestRules: checklist?.publicTestRules || [],
    note: 'Launch gate này là source/runtime state board để quyết định có nên chia link demo test hay chưa. Nó không thay thế việc chạy npm install, build, production live smoke và QA bằng thiết bị thật.'
  };
}
