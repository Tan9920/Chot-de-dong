import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const workspace = read('components/workspace.tsx');
const csrfRoute = read('app/api/auth/csrf/route.ts');
const auth = read('lib/auth.ts');
const storage = read('lib/storage.ts');
const audit = read('lib/security-audit-log.ts');
const feedback = read('lib/demo-feedback-intake.ts');
const css = read('app/globals.css');
const notes = read('BATCH89_NOTES.md');
const guide = read('docs/BATCH89_CORE_FLOW_UIUX_GUARD.md');
const sourceRegistry = read('scripts/run-source-validators.mjs');

function requireFile(file) { if (!fs.existsSync(file)) issues.push(`missing file: ${file}`); }
function requireMarker(label, text, marker) { if (!text.includes(marker)) issues.push(`${label} missing marker: ${marker}`); }
function requireNotMarker(label, text, marker) { if (text.includes(marker)) issues.push(`${label} contains forbidden marker: ${marker}`); }

for (const file of [
  'scripts/validate-batch89-core-flow-uiux-source.mjs',
  'docs/BATCH89_CORE_FLOW_UIUX_GUARD.md',
  'BATCH89_NOTES.md',
  'components/workspace.tsx',
  'app/api/auth/csrf/route.ts',
  'lib/auth.ts',
  'lib/storage.ts',
  'lib/security-audit-log.ts',
  'lib/demo-feedback-intake.ts'
]) requireFile(file);

if (!['0.89.0', '0.90.0', '0.91.0', '0.92.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version)) issues.push(`package.json version must be 0.89.0 or 0.90.0, got ${pkg.version}`);
for (const scriptName of ['core-flow-uiux:validate', 'smoke:batch89', 'verify:batch89']) {
  if (!pkg.scripts?.[scriptName]) issues.push(`package.json missing script ${scriptName}`);
}

for (const marker of [
  'friendlyErrorMessage',
  'Không tạo được bài dạy do lỗi phiên làm việc',
  'teacherDataLabel',
  'currentDataLabel',
  'subjectOptions',
  'bookOptions',
  'topicOptions',
  'templateOptions',
  'showTechnicalPanels',
  'fixed inset-x-0 bottom-0',
  'xl:fixed xl:left-6',
  'editorRef.current?.scrollIntoView',
  'Tự nhập chủ đề khác',
  'Gửi góp ý demo',
  'Dễ dùng',
  'Tiêu chuẩn',
  'Nâng cao'
]) requireMarker('components/workspace.tsx', workspace, marker);

for (const marker of [
  'anonymous_demo_cookie_fallback',
  'csrfTokenIssued',
  'Audit persistence must not block',
  'Không để lỗi ghi JSON/session trên host demo làm chết CSRF token'
]) requireMarker('app/api/auth/csrf/route.ts', csrfRoute, marker);

for (const marker of ['demoUserFromSessionCookie', 'GIAOAN_DISABLE_DEMO_SESSION_FALLBACK', 'anonymous_demo_cookie_fallback', 'demo:feedback']) requireMarker('lib/auth.ts', auth, marker);
for (const marker of ['memory_fallback_when_json_file_is_read_only', 'không được làm chết luồng chính', 'writeFallback']) requireMarker('lib/storage.ts', storage, marker);
for (const marker of ['must not break CSRF/bootstrap', 'memory_unpersisted']) requireMarker('lib/security-audit-log.ts', audit, marker);
for (const marker of ['memoryFeedbackStore', 'memory_fallback', 'Vercel/serverless may not allow writing bundled data/*.json']) requireMarker('lib/demo-feedback-intake.ts', feedback, marker);
for (const marker of ['Batch89 teacher-friendly UI polish', 'scroll-behavior: smooth', 'radial-gradient']) requireMarker('app/globals.css', css, marker);
for (const marker of ['Batch89', 'Core Flow', 'CSRF', 'teacher-friendly', 'không thêm AI', 'không production-ready']) requireMarker('BATCH89_NOTES.md', notes, marker);
for (const marker of ['BATCH89 CORE FLOW UIUX GUARD', 'mobile bottom tabs', 'dropdown', 'CSRF fallback', 'serverless']) requireMarker('docs/BATCH89_CORE_FLOW_UIUX_GUARD.md', guide, marker);
for (const marker of ['validate-batch89-core-flow-uiux-source.mjs', 'verify:batch89', 'core-flow-uiux:validate']) requireMarker('scripts/run-source-validators.mjs', sourceRegistry, marker);

requireNotMarker('package.json', JSON.stringify(pkg), 'openai');
requireNotMarker('package.json', JSON.stringify(pkg), '@google/generative-ai');
requireNotMarker('package.json', JSON.stringify(pkg), '@anthropic-ai/sdk');
requireNotMarker('package.json', JSON.stringify(pkg), 'langchain');

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    hasCsrfFallback: csrfRoute.includes('anonymous_demo_cookie_fallback'),
    hasTeacherCatalog: workspace.includes('subjectOptions') && workspace.includes('bookOptions') && workspace.includes('topicOptions'),
    hidesTechnicalPanels: workspace.includes('showTechnicalPanels'),
    hasBottomTabs: workspace.includes('fixed inset-x-0 bottom-0')
  },
  note: 'Batch89 source validator checks core demo flow UX guard and serverless write fallback at source level. It does not prove Vercel hosted runtime, mobile browser QA, DOCX/PDF export, or teacher feedback has passed.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
