import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const feedbackStore = readJson('data/demo-feedback-submissions.json');
const checklist = readJson('data/hosted-demo-release-checklist.json');
const lib = read('lib/demo-feedback-intake.ts');
const route = read('app/api/demo/feedback/route.ts');
const adminRoute = read('app/api/admin/demo/feedback/route.ts');
const testerPack = read('lib/demo-tester-pack.ts');
const launchGate = read('lib/hosted-demo-launch-gate.ts');
const workspace = read('components/workspace.tsx');
const smoke = read('scripts/hosted-demo-url-smoke.mjs');
const sourceRegistry = read('scripts/run-source-validators.mjs');
const notes = read('BATCH88_NOTES.md');
const guide = read('docs/BATCH88_DEMO_FEEDBACK_EVIDENCE_DOSSIER.md');

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
  'data/demo-feedback-submissions.json',
  'lib/demo-feedback-intake.ts',
  'app/api/demo/feedback/route.ts',
  'app/api/admin/demo/feedback/route.ts',
  'scripts/validate-batch88-demo-feedback-evidence-source.mjs',
  'docs/BATCH88_DEMO_FEEDBACK_EVIDENCE_DOSSIER.md',
  'BATCH88_NOTES.md'
]) requireFile(file);

if (!["0.88.0", "0.89.0", "0.90.0", "0.91.0", '0.92.0'].includes(pkg.version)) issues.push(`package.json version must be 0.88.0/0.89.0/0.90.0, got ${pkg.version}`);
for (const scriptName of ['demo:feedback-validate', 'smoke:batch88', 'verify:batch88']) {
  if (!pkg.scripts?.[scriptName]) issues.push(`package.json missing script ${scriptName}`);
}
if (feedbackStore.policy?.publicRawFeedback !== false) issues.push('feedback store must keep publicRawFeedback=false');
if (feedbackStore.policy?.studentPersonalDataAllowed !== false) issues.push('feedback store must keep studentPersonalDataAllowed=false');
if (!Array.isArray(feedbackStore.submissions)) issues.push('feedback store submissions must be an array');

for (const marker of [
  'createDemoFeedbackSubmission',
  'buildDemoFeedbackBoard',
  'student_personal_data',
  'copyright_or_license_risk',
  'academic_accuracy_risk',
  'export_runtime_risk',
  'mobile_ux_risk',
  'can_continue_controlled_test',
  'requiredBeforeExpanding',
  'Không gửi dữ liệu cá nhân học sinh',
  'redactSubmission'
]) requireMarker('lib/demo-feedback-intake.ts', lib, marker);

for (const marker of ['POST', 'assertWriteProtection', 'requireActiveSession', 'createDemoFeedbackSubmission', 'recordSecurityAuditEvent', 'buildDemoFeedbackBoard']) requireMarker('app/api/demo/feedback/route.ts', route, marker);
for (const marker of ['requirePermission', 'demo_feedback:review', 'listDemoFeedbackSubmissions']) requireMarker('app/api/admin/demo/feedback/route.ts', adminRoute, marker);
for (const marker of ['feedbackIntake', 'feedbackForm', 'buildDemoFeedbackBoard']) requireMarker('lib/demo-tester-pack.ts', testerPack, marker);
for (const marker of ['feedbackEvidenceState', 'demo_feedback_evidence_dossier', 'openP0', 'openP1', 'Chưa có feedback giáo viên thật']) requireMarker('lib/hosted-demo-launch-gate.ts', launchGate, marker);
for (const marker of ['demo_feedback_evidence_dossier', 'data/demo-feedback-submissions.json', 'demo:feedback-validate', 'verify:batch88', 'P0/P1']) requireMarker('data/hosted-demo-release-checklist.json', JSON.stringify(checklist), marker);
for (const marker of ['/api/demo/feedback', "jsonKey: 'board'", "jsonKey: 'submission'", 'giao-an-mvp-vn-hosted-url-smoke/0.88']) requireMarker('scripts/hosted-demo-url-smoke.mjs', smoke, marker);
for (const marker of ['validate-batch88-demo-feedback-evidence-source.mjs', 'verify:batch88', '/api/demo/feedback']) requireMarker('scripts/run-source-validators.mjs', sourceRegistry, marker);
for (const marker of ['Batch88', 'Feedback Evidence Dossier', 'không thêm AI', 'P0/P1', 'chưa production-ready']) requireMarker('BATCH88_NOTES.md', notes, marker);
for (const marker of ['BATCH88 DEMO FEEDBACK EVIDENCE DOSSIER', '/api/demo/feedback', 'P0', 'không gửi dữ liệu cá nhân học sinh']) requireMarker('docs/BATCH88_DEMO_FEEDBACK_EVIDENCE_DOSSIER.md', guide, marker);

requireNotMarker('package.json', JSON.stringify(pkg), 'openai');
requireNotMarker('package.json', JSON.stringify(pkg), '@google/generative-ai');
requireNotMarker('package.json', JSON.stringify(pkg), '@anthropic-ai/sdk');

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    feedbackSubmissions: Array.isArray(feedbackStore.submissions) ? feedbackStore.submissions.length : -1,
    policy: feedbackStore.policy,
    scripts: ['demo:feedback-validate', 'smoke:batch88', 'verify:batch88']
  },
  note: 'Batch88 source validator checks feedback intake, privacy gates, launch/share blocking logic, hosted smoke coverage, and no-AI positioning. It does not prove real teachers submitted feedback.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
