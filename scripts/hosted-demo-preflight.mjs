import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => exists(file) ? fs.readFileSync(path.join(root, file), 'utf8') : '';
const readJson = (file, fallback = {}) => { try { return JSON.parse(read(file)); } catch { return fallback; } };

const pkg = readJson('package.json');
const checklist = readJson('data/hosted-demo-release-checklist.json');
const productFoundation = readJson('data/product-foundation.json');
const checks = [];
function push(id, label, status, detail, evidence = []) { checks.push({ id, label, status, detail, evidence }); }
function fileGate(id, label, files) {
  const missing = files.filter((file) => !exists(file));
  push(`${id}_files`, `${label} — files`, missing.length ? 'blocker' : 'pass', missing.length ? `Thiếu file: ${missing.join(', ')}` : 'Đủ file bắt buộc.', files);
}
function scriptGate(id, label, scripts) {
  const missing = scripts.filter((script) => !pkg?.scripts?.[script]);
  push(`${id}_scripts`, `${label} — scripts`, missing.length ? 'blocker' : 'pass', missing.length ? `Thiếu script: ${missing.join(', ')}` : 'Đủ script bắt buộc.', scripts);
}

for (const gate of Array.isArray(checklist.sourceGates) ? checklist.sourceGates : []) {
  if (gate.requiredFiles?.length) fileGate(gate.id, gate.label, gate.requiredFiles);
  if (gate.requiredScripts?.length) scriptGate(gate.id, gate.label, gate.requiredScripts);
}

const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const aiDeps = ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain'].filter((name) => deps[name]);
push('no_ai_sdk_dependency', 'Không có AI SDK/model dependency.', aiDeps.length ? 'blocker' : 'pass', aiDeps.length ? `Có dependency AI bị cấm: ${aiDeps.join(', ')}` : 'Không phát hiện AI SDK trong package.json.');

const surfaceText = [read('README.md'), read('components/workspace.tsx'), read('app/page.tsx')].join('\n').toLowerCase();
const forbiddenClaims = ['ai tạo giáo án chuẩn 100%', 'chuẩn bộ 100%', 'dùng ngay không cần sửa', 'không vi phạm gì cả', 'đăng tài liệu là có tiền', 'public tự do'];
const claimHits = forbiddenClaims.filter((phrase) => surfaceText.includes(phrase));
push('forbidden_public_claims', 'Không có claim public gây hiểu nhầm.', claimHits.length ? 'blocker' : 'pass', claimHits.length ? `Phát hiện: ${claimHits.join(', ')}` : 'Không thấy claim cấm ở bề mặt public chính.', forbiddenClaims);

push('non_ai_positioning_policy', 'Product foundation vẫn khóa định vị không-AI.', productFoundation?.positioning?.nonAiFirst === true && productFoundation?.positioning?.teacherFinalReviewRequired === true ? 'pass' : 'blocker', 'Kiểm data/product-foundation.json.', ['data/product-foundation.json']);

const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
push('dependency_install_runtime_state', 'Dependency đã cài trên host chưa.', exists(nextBin) ? 'pass' : 'must_run_on_host', exists(nextBin) ? 'Có next binary.' : 'Chưa có node_modules/.bin/next; chạy npm run install:clean trên host/CI thật.', [nextBin]);
push('production_build_runtime_state', 'Production build output đã có chưa.', exists('.next/BUILD_ID') ? 'pass' : 'must_run_on_host', exists('.next/BUILD_ID') ? 'Có .next/BUILD_ID.' : 'Chưa có .next/BUILD_ID; chạy npm run build:clean rồi production live smoke.', ['.next/BUILD_ID']);

const hostedUrlSmoke = readJson('artifacts/hosted-demo-url-smoke-last-run.json', null);
const hostedUrlSmokeStatus = hostedUrlSmoke?.ok === true && hostedUrlSmoke?.skipped !== true
  ? 'pass'
  : hostedUrlSmoke?.ok === false && hostedUrlSmoke?.skipped !== true
    ? 'blocker'
    : 'must_run_on_host';
push(
  'hosted_url_smoke_runtime_state',
  'Domain Vercel/host thật đã pass hosted URL smoke chưa.',
  hostedUrlSmokeStatus,
  hostedUrlSmoke?.ok === true && hostedUrlSmoke?.skipped !== true
    ? `Hosted URL smoke đã pass cho ${hostedUrlSmoke.base || 'domain đã cấu hình'}.`
    : hostedUrlSmoke?.ok === false && hostedUrlSmoke?.skipped !== true
      ? `Hosted URL smoke đã chạy nhưng fail: ${hostedUrlSmoke.message || hostedUrlSmoke.error || 'không rõ lỗi'}.`
      : 'Chưa có artifacts/hosted-demo-url-smoke-last-run.json; chạy GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke sau khi deploy thật.',
  ['artifacts/hosted-demo-url-smoke-last-run.json', 'npm run hosted:url-smoke']
);

const blockers = checks.filter((check) => check.status === 'blocker');
const hostVerificationRequired = checks.filter((check) => check.status === 'must_run_on_host');
const warnings = checks.filter((check) => check.status === 'warning');
const status = blockers.length ? 'blocked_by_source_issues' : hostVerificationRequired.length ? 'source_ready_host_verification_required' : warnings.length ? 'hosted_demo_ready_with_warnings' : 'hosted_demo_ready_source_and_runtime';
const report = {
  generatedAt: new Date().toISOString(),
  status,
  package: { name: pkg.name, version: pkg.version, next: pkg.dependencies?.next, react: pkg.dependencies?.react },
  summary: { totalChecks: checks.length, pass: checks.filter((check) => check.status === 'pass').length, blockers: blockers.length, mustRunOnHost: hostVerificationRequired.length, warnings: warnings.length },
  blockers,
  hostVerificationRequired,
  warnings,
  checks,
  mustPassOnHostBeforeSharing: checklist.mustPassOnHostBeforeSharing || [],
  manualQaRequired: checklist.manualQaRequired || [],
  publicTestRules: checklist.publicTestRules || [],
  note: 'Preflight này không thay thế npm install/build/production live smoke. Nếu status là source_ready_host_verification_required, source đã ổn nhưng host vẫn phải chạy các lệnh runtime.'
};
console.log(JSON.stringify(report, null, 2));
process.exit(blockers.length ? 1 : 0);
