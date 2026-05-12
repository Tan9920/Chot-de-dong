import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const issues = [];

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const api = read('app/api/demo/breakthrough/route.ts');
const lib = read('lib/demo-breakthrough.ts');
const runValidators = read('scripts/run-source-validators.mjs');
const pkgText = JSON.stringify(pkg);

check('package.json version must be 0.102.0', ['0.102.0','0.103.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must be 0.102.0', ['0.102.0','0.103.0'].includes(lock.version), lock.version);
check('package-lock root package version must be 0.102.0', ['0.102.0','0.103.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch102:breakthrough-validate', 'demo:breakthrough-validate', 'smoke:batch102', 'verify:batch102']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
for (const file of [
  'BATCH102_NOTES.md',
  'docs/BATCH102_TEACHER_DEMO_BREAKTHROUGH.md',
  'lib/demo-breakthrough.ts',
  'app/api/demo/breakthrough/route.ts',
  'scripts/validate-batch102-breakthrough-source.mjs'
]) check(`missing ${file}`, fs.existsSync(file));

for (const marker of [
  'buildTeacherDemoBreakthroughReport',
  'source_breakthrough_runtime_blocked',
  'runtimeClosure',
  'forbiddenClaims',
  'teacherPromiseAllowed',
  'academic-data-not-verified-1-12',
  'json-persistence-demo',
  'buildOperatingEntitlementSnapshot',
  'buildHostedDemoLaunchGate'
]) check(`demo breakthrough lib missing marker ${marker}`, lib.includes(marker));

for (const marker of [
  'breakthrough-card',
  'teacher-starter-grid',
  'teacher-starter-card',
  'quota-strip',
  '/api/demo/breakthrough',
  'Không bắt giáo viên phải tự gõ từ đầu',
  'Source {breakthroughSourcePercent',
  'Đăng nhập để lưu/xuất',
  'disableExportUntilContent'
]) check(`workspace missing marker ${marker}`, workspace.includes(marker));

for (const marker of [
  '.breakthrough-card',
  '.teacher-starter-grid',
  '.quota-strip',
  'Batch102 Teacher Demo Breakthrough'
]) check(`CSS missing marker ${marker}`, css.includes(marker));

check('breakthrough API must call report builder', api.includes('buildTeacherDemoBreakthroughReport') && api.includes('getSessionUser'));
check('run-source-validators must register Batch102 validator', runValidators.includes('validate-batch102-breakthrough-source.mjs'));

for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}"`));
}
check('Batch102 docs must not claim production-ready', read('BATCH102_NOTES.md').includes('không claim production-ready') && read('docs/BATCH102_TEACHER_DEMO_BREAKTHROUGH.md').includes('không phải batch production-ready'));

const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  issues,
  checked: {
    api: fs.existsSync('app/api/demo/breakthrough/route.ts'),
    breakthroughCard: workspace.includes('breakthrough-card'),
    starterGrid: workspace.includes('teacher-starter-grid'),
    quotaStrip: workspace.includes('quota-strip')
  },
  note: 'Batch102 validates source-level teacher demo breakthrough and acceptance gate. It does not prove npm install, Next build, live runtime, hosted URL smoke, browser QA, DB persistence, or academic verification.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
