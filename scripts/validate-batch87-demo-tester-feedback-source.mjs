import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const pack = readJson('data/demo-tester-feedback-pack.json');
const lib = read('lib/demo-tester-pack.ts');
const route = read('app/api/demo/tester-pack/route.ts');
const workspace = read('components/workspace.tsx');
const checklist = read('data/hosted-demo-release-checklist.json');
const smoke = read('scripts/hosted-demo-url-smoke.mjs');
const workflow = read('.github/workflows/demo-runtime-verify.yml');
const notes = read('BATCH87_NOTES.md');
const guide = read('docs/BATCH87_CONTROLLED_TEACHER_TEST_GUIDE.md');
const sourceRegistry = read('scripts/run-source-validators.mjs');

function requireFile(file) {
  if (!fs.existsSync(file)) issues.push(`missing file: ${file}`);
}
function requireMarker(label, text, marker) {
  if (!text.includes(marker)) issues.push(`${label} missing marker: ${marker}`);
}
function requireNotMarker(label, text, marker) {
  if (text.includes(marker)) issues.push(`${label} contains forbidden marker: ${marker}`);
}

for (const file of [
  'data/demo-tester-feedback-pack.json',
  'lib/demo-tester-pack.ts',
  'app/api/demo/tester-pack/route.ts',
  'scripts/validate-batch87-demo-tester-feedback-source.mjs',
  'docs/BATCH87_CONTROLLED_TEACHER_TEST_GUIDE.md',
  'BATCH87_NOTES.md'
]) requireFile(file);

if (!["0.87.0","0.88.0","0.89.0","0.90.0","0.91.0", '0.92.0'].includes(pkg.version)) issues.push(`package.json version must be 0.87.0, 0.88.0, or 0.89.0/0.90.0, got ${pkg.version}`);
for (const scriptName of ['demo:tester-pack-validate', 'smoke:batch87', 'verify:batch87']) {
  if (!pkg.scripts?.[scriptName]) issues.push(`package.json missing script ${scriptName}`);
}
if (!Array.isArray(pack.testerTasks) || pack.testerTasks.length < 6) issues.push('tester pack must include at least 6 testerTasks');
if (!Array.isArray(pack.feedbackQuestions) || pack.feedbackQuestions.length < 8) issues.push('tester pack must include at least 8 feedbackQuestions');
if (!Array.isArray(pack.beforeSharingChecklist) || pack.beforeSharingChecklist.length < 5) issues.push('tester pack must include beforeSharingChecklist');
if (pack.positioning?.nonAiCore !== true || pack.positioning?.teacherFinalReviewRequired !== true) issues.push('tester pack must lock nonAiCore and teacherFinalReviewRequired');

for (const marker of [
  'Controlled teacher testing package',
  'trusted_teacher_small_group',
  'hosted_url_smoke_passed',
  'create_grade1_frame',
  'create_grade5_transition',
  'create_grade10_frame',
  'quality_check_export',
  'save_restore_draft',
  'safeSharingMessage',
  'P0',
  'P1',
  'không phải sản phẩm production-ready'
]) requireMarker('data/demo-tester-feedback-pack.json', JSON.stringify(pack), marker);

for (const marker of ['buildHostedDemoLaunchGate', 'shareRecommendation', 'internal_owner_only', 'trusted_small_group_only', 'Không thay thế build/live smoke']) requireMarker('lib/demo-tester-pack.ts', lib, marker);
for (const marker of ['buildDemoTesterPack', 'NextResponse.json', 'tester pack API lỗi']) requireMarker('app/api/demo/tester-pack/route.ts', route, marker);
for (const marker of ['/api/demo/tester-pack', 'testerPack', 'Gói test giáo viên', 'safeSharingMessage', 'feedbackQuestions']) requireMarker('components/workspace.tsx', workspace, marker);
for (const marker of ['batch87-controlled-demo-feedback-loop', 'demo_tester_feedback_loop', 'data/demo-tester-feedback-pack.json', 'demo:tester-pack-validate', '/api/demo/tester-pack']) requireMarker('data/hosted-demo-release-checklist.json', checklist, marker);
for (const marker of ['/api/demo/tester-pack', 'jsonKey: \'pack\'', 'giao-an-mvp-vn-hosted-url-smoke/0.88']) requireMarker('scripts/hosted-demo-url-smoke.mjs', smoke, marker);
for (const marker of ['npm run smoke:batch87', 'npm run verify:batch87']) requireMarker('.github/workflows/demo-runtime-verify.yml', workflow, marker);
for (const marker of ['validate-batch87-demo-tester-feedback-source.mjs', 'verify:batch87']) requireMarker('scripts/run-source-validators.mjs', sourceRegistry, marker);
for (const marker of ['Batch87', 'Controlled Demo Feedback Loop', 'không thêm AI', 'chưa production-ready']) requireMarker('BATCH87_NOTES.md', notes, marker);
for (const marker of ['BATCH87 CONTROLLED TEACHER TEST GUIDE', 'Tin nhắn mời test', 'P0', '3–10 giáo viên']) requireMarker('docs/BATCH87_CONTROLLED_TEACHER_TEST_GUIDE.md', guide, marker);

requireNotMarker('package.json', JSON.stringify(pkg), 'openai');
requireNotMarker('package.json', JSON.stringify(pkg), '@google/generative-ai');
requireNotMarker('package.json', JSON.stringify(pkg), '@anthropic-ai/sdk');

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    testerTasks: pack.testerTasks?.length || 0,
    feedbackQuestions: pack.feedbackQuestions?.length || 0,
    scripts: ['demo:tester-pack-validate', 'smoke:batch87', 'verify:batch87']
  },
  note: 'Batch87 source validator checks controlled teacher test pack, safe sharing copy, API/UI wiring, hosted URL smoke coverage, and no-AI positioning. It does not prove teacher feedback has been collected.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
