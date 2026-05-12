import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) {
  try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; }
}
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const policy = readJson('data/p0-p1-stability-gate-policy.json');
const lib = read('lib/p0-p1-stability-gate.ts');
const runtimeRoute = read('app/api/runtime/p0-p1-stability/route.ts');
const adminRoute = read('app/api/admin/p0-p1-stability-board/route.ts');
const report = read('scripts/p0-p1-stability-report.mjs');
const runner = read('scripts/run-source-validators.mjs');
const docs = read('BATCH136_NOTES.md') + '\n' + read('docs/BATCH136_P0_P1_STABILITY_GATE.md') + '\n' + read('README.md');

check('package version must be 0.136.0 or later Batch137 compatible', ['0.136.0','0.137.0'].includes(pkg.version), `got ${pkg.version}`);
for (const script of ['p0-p1:stability-validate','p0-p1:stability-report','smoke:batch136','verify:batch136']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('policy marker', policy.batch === 'Batch136 — P0/P1 Stability Gate' && policy.version === '0.136.0');
check('policy must be source-level only', policy.sourceLevelOnly === true);
check('policy local gates enough', Array.isArray(policy.localP0RequiredEvidence) && policy.localP0RequiredEvidence.length >= 6);
check('policy hosted gates enough', Array.isArray(policy.hostedPublicRequiredEvidence) && policy.hostedPublicRequiredEvidence.some((g) => g.id === 'visual_smoke_evidence'));
for (const marker of [
  'buildP0P1StabilityBoard',
  'p1FeatureExpansionBlocked',
  'publicP1RolloutAllowed',
  'productionReady: false',
  'publicRolloutAllowed: false',
  'Batch136 is a P0/P1 stability gate',
  'visualEvidenceOk',
  'authInviteOk',
  'loopbackOk',
  'guardedBuildOk'
]) check(`lib missing marker ${marker}`, lib.includes(marker));
for (const marker of ['/api/runtime/p0-p1-stability', 'buildP0P1StabilityBoard', 'does not unlock public rollout']) {
  const haystack = `${runtimeRoute}\n${adminRoute}`;
  check(`route missing marker ${marker}`, haystack.includes(marker));
}
for (const marker of ['p0-p1-stability-report-last-run.json', 'localP0Stable', 'p1FoundationSourceReady', 'public rollout remains blocked']) {
  check(`report missing marker ${marker}`, report.toLowerCase().includes(marker.toLowerCase()));
}
for (const marker of ['validate-batch136-p0-p1-stability-source.mjs', 'p0-p1-stability-gate-policy.json', 'BATCH136_P0_P1_STABILITY_GATE']) {
  check(`source validator registry missing marker ${marker}`, runner.includes(marker));
}
const docsLower = docs.toLowerCase();
for (const marker of ['batch136', 'p0/p1', 'không thêm ai', 'không thêm thanh toán', 'không tạo verified giả', 'public rollout remains blocked']) {
  check(`docs/readme missing marker ${marker}`, docsLower.includes(marker.toLowerCase()));
}
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const sourceText = `${policy.batch}\n${lib}\n${runtimeRoute}\n${adminRoute}\n${report}`.toLowerCase();
check('batch source must not unlock production', !sourceText.includes('productionready: true') && !sourceText.includes('publicrolloutallowed: true'));
const result = {
  ok: issues.length === 0,
  batch: 'Batch136 P0/P1 Stability Gate',
  sourceLevelOnly: true,
  noAiPaymentOrFakeVerifiedAdded: true,
  publicRolloutStillBlocked: true,
  issues,
  note: 'Validates P0/P1 stability source contract only. It does not prove hosted/public/production readiness.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
