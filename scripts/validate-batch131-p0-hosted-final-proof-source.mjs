import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
function minorAtLeast(version, min) { return Number(String(version || '0.0.0').split('.')[1] || 0) >= min; }

const issues = [];
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/runtime-p0-hosted-final-proof-policy.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const lib = read('lib/runtime-p0-hosted-final-proof.ts');
const route = read('app/api/runtime/p0-hosted-final-proof/route.ts');
const adminRoute = read('app/api/admin/p0-hosted-final-proof-board/route.ts');
const report = read('scripts/runtime-p0-hosted-final-proof-report.mjs');
const visualTemplate = read('scripts/visual-smoke-evidence-template.mjs');
const visualValidate = read('scripts/visual-smoke-evidence-validate.mjs');
const verifyRelease = read('scripts/verify-release.mjs');
const verifyFinal = read('scripts/verify-p0-hosted-final-proof.mjs');
const runValidators = read('scripts/run-source-validators.mjs');
const notes = read('BATCH131_NOTES.md') + '\n' + read('docs/BATCH131_P0_HOSTED_FINAL_PROOF.md');

check('package.json version must be 0.131.0 or later Batch150 compatible', minorAtLeast(pkg.version, 131), pkg.version);
check('package-lock version must be 0.131.0 or later Batch150 compatible', minorAtLeast(lock.version, 131), lock.version);
check('package-lock root version must be 0.131.0 or later Batch150 compatible', minorAtLeast(lock.packages?.['']?.version, 131), lock.packages?.['']?.version);
check('node engine must stay pinned to 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);

for (const script of ['runtime:p0-hosted-final-proof-validate','runtime:p0-hosted-final-proof-report','visual:smoke:evidence-template','visual:smoke:evidence-validate','verify:p0-hosted-final-proof','smoke:batch131','verify:batch131']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}

check('verify:p0-100-release must require visual smoke', String(pkg.scripts?.['verify:p0-100-release'] || '').includes('GIAOAN_REQUIRE_VISUAL_SMOKE=1'));

for (const file of [
  'data/runtime-p0-hosted-final-proof-policy.json',
  'lib/runtime-p0-hosted-final-proof.ts',
  'app/api/runtime/p0-hosted-final-proof/route.ts',
  'app/api/admin/p0-hosted-final-proof-board/route.ts',
  'scripts/runtime-p0-hosted-final-proof-report.mjs',
  'scripts/visual-smoke-evidence-template.mjs',
  'scripts/visual-smoke-evidence-validate.mjs',
  'scripts/verify-p0-hosted-final-proof.mjs',
  'scripts/validate-batch131-p0-hosted-final-proof-source.mjs',
  'docs/BATCH131_P0_HOSTED_FINAL_PROOF.md',
  'BATCH131_NOTES.md'
]) check(`missing ${file}`, fs.existsSync(file));

check(
  'policy must be Batch131 or later compatible hosted final proof policy',
  String(policy.batch || '').includes('Batch131') || String(policy.batch || '').includes('Batch143'),
  policy.batch
);

check('policy must keep public rollout blocked by default', policy.publicRolloutAllowed === false);
check('policy must require Node24, hosted APP_URL, visual smoke, final release', JSON.stringify(policy).includes('node24_ci') && JSON.stringify(policy).includes('hosted_app_url_strict_smoke') && JSON.stringify(policy).includes('visual_smoke_breakpoints') && JSON.stringify(policy).includes('release_final_chain'));
check('visual policy must include 6 breakpoints and governance flow', (policy.visualSmoke?.requiredViewports || []).length >= 6 && JSON.stringify(policy.visualSmoke || {}).includes('governance_labels_visible'));

for (const marker of ['buildP0HostedFinalProofBoard','p0_hosted_public_blocked','visualSmoke','productionReady: false','missingRequired']) check(`lib missing marker ${marker}`, lib.includes(marker));
for (const marker of ['buildP0HostedFinalProofBoard','evidence gate']) check(`public route missing marker ${marker}`, route.includes(marker));
for (const marker of ['requirePermission','security:read','buildP0HostedFinalProofBoard']) check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
for (const marker of ['runtime-p0-hosted-final-proof-report-last-run.json','publicRolloutAllowed','productionReady: false','noAiPaymentVerifiedFakeAdded']) check(`report missing marker ${marker}`, report.includes(marker));
for (const marker of ['visual-smoke-evidence-template','not_captured','noAiPaymentVerifiedFakeAdded']) check(`visual template missing marker ${marker}`, visualTemplate.includes(marker));
for (const marker of ['missing_visual_smoke_evidence','governance_labels_visible','evidence.ok must be true']) check(`visual validator missing marker ${marker}`, visualValidate.includes(marker));
for (const marker of ['GIAOAN_REQUIRE_VISUAL_SMOKE','visual:smoke:evidence-validate','missing required visual smoke evidence']) check(`verify-release missing marker ${marker}`, verifyRelease.includes(marker));
for (const marker of ['verify:p0-deepest-node24-ci','verify:release:strict','visual:smoke:evidence-validate','verify:p0-100-release']) check(`strict final verifier missing marker ${marker}`, verifyFinal.includes(marker));

check('run-source-validators must register Batch131 files', runValidators.includes('validate-batch131-p0-hosted-final-proof-source.mjs') && runValidators.includes('runtime-p0-hosted-final-proof-policy.json'));
check('run-source-validators must know batch131 scripts', runValidators.includes('smoke:batch131') && runValidators.includes('verify:batch131'));
check('notes must state no production-ready and no AI/payment/verified fake', notes.includes('không production-ready') && notes.includes('Không thêm AI') && notes.includes('Không tạo verified giả'));

const fakeVerified = (registry.records || []).filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch131 must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);

const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}

const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  requiredGates: Array.isArray(policy.requiredGates) ? policy.requiredGates.length : 0,
  fakeVerifiedRecords: fakeVerified.length,
  issues,
  note: 'Batch131 validates source-level hosted final proof gate and evidence tooling. It does not prove hosted/visual pass without real artifacts.'
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
