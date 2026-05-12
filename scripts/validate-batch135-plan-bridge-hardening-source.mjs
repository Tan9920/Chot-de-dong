import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) {
  try { return JSON.parse(read(file) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const guard = readJson('data/plan-bridge-ui-guardrails.json');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const docs = read('BATCH135_NOTES.md') + '\n' + read('docs/BATCH135_PLAN_BRIDGE_UI_GUARDRAILS.md');

check('package version must be 0.135.0', pkg.version === '0.135.0', `got ${pkg.version}`);
for (const script of ['batch135:plan-bridge-hardening-validate','smoke:batch135','verify:batch135']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('guardrail data file batch marker', guard.batch === 'Batch135 Plan Bridge UI Guardrails');
check('guardrail data scope must stay source-level only', guard.scope === 'source_level_ui_hardening_only');
check('action contracts must cover 4 areas', Array.isArray(guard.actionContracts) && guard.actionContracts.length >= 4);
for (const marker of [
  'Batch135 Plan Bridge Hardening markers',
  'plan-bridge-hardening',
  'action-notice-contract',
  'dynamic-release-gate-from-api',
  'source-level-action-guard',
  'no-fake-verified-lovable-samples',
  'publicRolloutReadiness?: any',
  "getJson('/api/runtime/public-rollout-readiness')",
  'startFromWeekLesson',
  'handleSourceLevelAction',
  'handleResourceAction',
  'handleModerationAction',
  'dynamicReleaseGateChecks',
  'rolloutReadinessText',
  'reviewState',
  'canInsert',
  'licenseStatus',
  'studentDataRisk',
  'Không chèn',
  'không phải chèn nội dung verified',
  'không dùng số tĩnh để claim'
]) {
  check(`workspace missing marker ${marker}`, workspace.includes(marker));
}
for (const marker of ['Batch135 Plan Bridge Hardening', '.gate-row-note', '.resource-actions button:disabled']) {
  check(`CSS missing marker ${marker}`, css.includes(marker));
}
const docsLower = docs.toLowerCase();
check('notes/docs must describe Batch135 and no AI/payment/fake verified', docs.includes('Batch135') && docsLower.includes('không thêm ai') && docsLower.includes('không thêm thanh toán') && docsLower.includes('không tạo verified giả'));
const sampleWindow = workspace.slice(workspace.indexOf('const weekLessonSamples'), workspace.indexOf('const weekDays')) + workspace.slice(workspace.indexOf('const resourceSamples'), workspace.indexOf('const moderationQueueSamples'));
check('lovable samples must not contain status verified', !/status:\s*['\"]verified['\"]/.test(sampleWindow));
check('resource samples must include canInsert false for unsafe community samples', /canInsert:\s*false/.test(sampleWindow));
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const result = {
  ok: issues.length === 0,
  batch: 'Batch135 Plan Bridge UI Guardrails',
  sourceLevelOnly: true,
  actionContracts: guard.actionContracts?.map((item) => item.id) || [],
  noAiPaymentOrFakeVerifiedAdded: true,
  issues,
  note: 'Validates Batch134 UI hardening only. It does not prove hosted/public/production readiness.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
