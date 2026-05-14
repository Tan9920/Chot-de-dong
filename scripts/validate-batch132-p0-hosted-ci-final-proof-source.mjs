import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const issues = [];
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/runtime-p0-hosted-ci-final-proof-policy.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const lib = read('lib/runtime-p0-hosted-ci-final-proof.ts');
const route = read('app/api/runtime/p0-hosted-ci-final-proof/route.ts');
const adminRoute = read('app/api/admin/p0-hosted-ci-final-proof-board/route.ts');
const report = read('scripts/runtime-p0-hosted-ci-final-proof-report.mjs');
const runner = read('scripts/p0-hosted-ci-final-proof-runner.mjs');
const release = read('scripts/verify-release.mjs');
const workflow = read('.github/workflows/p0-hosted-final-proof.yml');
const runValidators = read('scripts/run-source-validators.mjs');
const notes = read('BATCH132_NOTES.md') + '\n' + read('docs/BATCH132_P0_HOSTED_CI_FINAL_PROOF.md');
const compatibleVersions = Array.from({ length: 19 }, (_, i) => `0.${132 + i}.0`);

check('package.json version must be hosted-proof compatible', compatibleVersions.includes(pkg.version), pkg.version);
check('package-lock version must be hosted-proof compatible', compatibleVersions.includes(lock.version), lock.version);
check('package-lock root version must be hosted-proof compatible', compatibleVersions.includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
check('node engine must stay pinned to 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);

for (const script of ['runtime:p0-hosted-ci-proof-validate','runtime:p0-hosted-ci-proof-report','runtime:p0-hosted-ci-proof-runner','verify:p0-hosted-ci-proof','smoke:batch132','verify:batch132','verify:release:strict','verify:p0-100-release']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}

for (const file of [
  'data/runtime-p0-hosted-ci-final-proof-policy.json',
  'lib/runtime-p0-hosted-ci-final-proof.ts',
  'app/api/runtime/p0-hosted-ci-final-proof/route.ts',
  'app/api/admin/p0-hosted-ci-final-proof-board/route.ts',
  'scripts/runtime-p0-hosted-ci-final-proof-report.mjs',
  'scripts/p0-hosted-ci-final-proof-runner.mjs',
  'scripts/validate-batch132-p0-hosted-ci-final-proof-source.mjs',
  '.github/workflows/p0-hosted-final-proof.yml',
  'docs/BATCH132_P0_HOSTED_CI_FINAL_PROOF.md',
  'BATCH132_NOTES.md'
]) check(`missing ${file}`, fs.existsSync(file));

check('policy must remain hosted final proof policy', String(policy.batch || '').includes('Batch132') || String(policy.batch || '').includes('Batch141') || String(policy.batch || '').includes('Batch146'), policy.batch);check('policy version must be hosted-proof compatible', compatibleVersions.includes(policy.version), policy.version);
check('policy must block public rollout by default', policy.publicRolloutAllowed === false && policy.productionReady === false);
check('policy must require all final hosted evidence', JSON.stringify(policy).includes('node24_ci_deepest') && JSON.stringify(policy).includes('hosted_release_strict') && JSON.stringify(policy).includes('hosted_url_save_export') && JSON.stringify(policy).includes('visual_smoke_evidence') && JSON.stringify(policy).includes('p0_100_release'));
check('policy must include GitHub workflow contract', policy.workflow?.file === '.github/workflows/p0-hosted-final-proof.yml' && policy.workflow?.nodeVersion === '24');
check('Batch141 policy must disambiguate hosted strict and P0-100 artifacts', JSON.stringify(policy).includes('verify-release-strict-last-run.json') && JSON.stringify(policy).includes('verify-p0-100-release-last-run.json') && JSON.stringify(policy).includes('artifactContract'));
for (const marker of ['buildP0HostedCiFinalProofBoard','p0_hosted_ci_blocked','publicRolloutAllowed','productionReady: false','nextCommands','artifactContractIssues','releaseArtifactOk']) check(`lib missing marker ${marker}`, lib.includes(marker));
for (const marker of ['buildP0HostedCiFinalProofBoard','evidence runner']) check(`public route missing marker ${marker}`, route.includes(marker));
for (const marker of ['requirePermission','security:read','buildP0HostedCiFinalProofBoard']) check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
for (const marker of ['runtime-p0-hosted-ci-final-proof-report-last-run.json','publicRolloutAllowed','productionReady: false','noAiPaymentVerifiedFakeAdded','artifactContractIssues','releaseArtifactOk']) check(`report missing marker ${marker}`, report.includes(marker));
for (const marker of ['--strict','GIAOAN_STRICT_HOSTED_CI_PROOF','verify:batch131','verify:p0-deepest-node24-ci','verify:release:strict','hosted:url-smoke','visual:smoke:evidence-validate','verify:p0-100-release']) check(`runner missing marker ${marker}`, runner.includes(marker));
for (const marker of ['GIAOAN_VERIFY_RELEASE_ARTIFACT','proofProfile','p0_100_release','hosted_release_strict','requireNode24','artifactContract']) check(`verify-release missing marker ${marker}`, release.includes(marker));
for (const marker of ['name: P0 Hosted Final Proof','node-version: "24"','GIAOAN_DEMO_URL','VERCEL_AUTOMATION_BYPASS_SECRET','runtime:p0-hosted-ci-proof-runner','verify:p0-hosted-ci-proof','actions/upload-artifact@v4']) check(`workflow missing marker ${marker}`, workflow.includes(marker));
check('run-source-validators must register Batch132 validator', runValidators.includes('validate-batch132-p0-hosted-ci-final-proof-source.mjs'));
check('notes must state no production ready and no AI/payment/fake verified', notes.includes('không production-ready') && notes.includes('Không thêm AI') && notes.includes('Không tạo verified giả'));
check('notes must preserve hosted proof honesty', notes.includes('không đóng hosted proof thật') && notes.includes('Node24') && notes.includes('APP_URL'));

const fakeVerified = (registry.records || []).filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('hosted proof batches must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));

const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  policyBatch: policy.batch,
  requiredEvidence: Array.isArray(policy.requiredEvidence) ? policy.requiredEvidence.length : 0,
  workflowPresent: Boolean(workflow),
  fakeVerifiedRecords: fakeVerified.length,
  issues,
  note: 'Validates hosted CI final proof source contract, including Batch141 artifact disambiguation. It does not prove hosted/visual pass without real artifacts.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
