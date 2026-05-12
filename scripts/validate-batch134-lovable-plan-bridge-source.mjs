import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) {
  try { return JSON.parse(read(file) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const notes = read('BATCH134_NOTES.md') + '\n' + read('docs/BATCH134_LOVABLE_PLAN_BRIDGE.md');

for (const script of ['batch134:lovable-plan-bridge-validate','smoke:batch134','verify:batch134']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
for (const marker of [
  'lovable-plan-bridge',
  'weekly teaching workspace',
  "type WorkspaceTab = 'dashboard' | 'compose' | 'editor' | 'drafts' | 'week' | 'resources'",
  'weekLessonSamples',
  'resourceSamples',
  'moderationQueueSamples',
  'legalGateItems',
  'releaseGateChecks',
  "activeTab === 'week'",
  "activeTab === 'resources'",
  "activeTab === 'moderation'",
  "activeTab === 'legal'",
  "activeTab === 'release'",
  'Không cho cộng đồng trở thành kho nội dung công khai',
  'Không thêm AI/API AI, không thêm thanh toán, không nâng dữ liệu seed/scaffold thành verified'
]) {
  check(`workspace missing marker ${marker}`, workspace.includes(marker));
}
for (const marker of [
  'Batch134 Lovable Plan Bridge',
  '.plan-bridge-card',
  '.weekly-grid',
  '.resource-grid',
  '.moderation-list',
  '.gate-list'
]) {
  check(`CSS missing marker ${marker}`, css.includes(marker));
}
check('notes must exist and describe no AI/payment/fake verified', notes.includes('Batch134') && notes.includes('Không thêm AI') && notes.includes('không thêm thanh toán') && notes.includes('không nâng seed/scaffold thành verified'));
const fakeVerified = (registry.records || []).filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch134 must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const result = {
  ok: issues.length === 0,
  batch: 'Batch134 Lovable Plan Bridge',
  tabsAdded: ['week', 'resources', 'moderation', 'legal', 'release'],
  fakeVerifiedRecords: fakeVerified.length,
  noAiPaymentAdded: true,
  issues,
  note: 'Validates source-level UI/feature bridge only. It does not prove production/hosted readiness.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
