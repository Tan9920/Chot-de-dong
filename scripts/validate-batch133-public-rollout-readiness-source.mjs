import fs from 'node:fs';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/public-rollout-readiness-policy.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const lib = read('lib/public-rollout-readiness.ts');
const route = read('app/api/runtime/public-rollout-readiness/route.ts');
const adminRoute = read('app/api/admin/public-rollout-readiness-board/route.ts');
const report = read('scripts/public-rollout-readiness-report.mjs');
const dossier = read('scripts/public-rollout-dossier-template.mjs');
const runValidators = read('scripts/run-source-validators.mjs');
const notes = read('BATCH133_NOTES.md') + '\n' + read('docs/BATCH133_PUBLIC_ROLLOUT_READINESS.md');
check('package.json version must be 0.133.0', pkg.version === '0.133.0', pkg.version);
check('package-lock version must be 0.133.0', lock.version === '0.133.0', lock.version);
check('package-lock root version must be 0.133.0', lock.packages?.['']?.version === '0.133.0', lock.packages?.['']?.version);
check('node engine must stay pinned to 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
for (const script of ['public-rollout:readiness-validate','public-rollout:readiness-report','public-rollout:dossier-template','smoke:batch133','verify:batch133']) check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
for (const file of [
  'data/public-rollout-readiness-policy.json',
  'lib/public-rollout-readiness.ts',
  'app/api/runtime/public-rollout-readiness/route.ts',
  'app/api/admin/public-rollout-readiness-board/route.ts',
  'scripts/public-rollout-readiness-report.mjs',
  'scripts/public-rollout-dossier-template.mjs',
  'scripts/validate-batch133-public-rollout-readiness-source.mjs',
  'docs/BATCH133_PUBLIC_ROLLOUT_READINESS.md',
  'BATCH133_NOTES.md'
]) check(`missing ${file}`, fs.existsSync(file));
check('policy must be Batch133', String(policy.batch || '').includes('Batch133'), policy.batch);
check('policy version must be 0.133.0', policy.version === '0.133.0', policy.version);
check('policy must keep public rollout blocked by default', policy.publicRolloutAllowed === false && policy.productionReady === false);
check('policy must choose public rollout readiness as current best area', policy.canImproveNow === 'public_rollout_readiness_source_level', policy.canImproveNow);
check('policy must require hosted/visual/security/dossier proof', JSON.stringify(policy).includes('batch132_ci_report') && JSON.stringify(policy).includes('visual_smoke_evidence') && JSON.stringify(policy).includes('security_data_protection_report') && JSON.stringify(policy).includes('public_rollout_dossier') && JSON.stringify(policy).includes('hosted_p0_100_release'));
check('policy must include no-user/safe mode/rollback controls', JSON.stringify(policy).includes('no_user_validation') && JSON.stringify(policy).includes('rollbackPlan') && JSON.stringify(policy).includes('safeModePlan'));
for (const marker of ['buildPublicRolloutReadinessBoard','public_rollout_blocked_by_hosted_or_node24','sourceLevelReadinessPercent','evidenceReadinessPercent','publicRolloutAllowed','productionReady: false','rolloutBlockers']) check(`lib missing marker ${marker}`, lib.includes(marker));
for (const marker of ['buildPublicRolloutReadinessBoard','hard gate']) check(`public route missing marker ${marker}`, route.includes(marker));
for (const marker of ['requirePermission','security:read','buildPublicRolloutReadinessBoard']) check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
for (const marker of ['public-rollout-readiness-report-last-run.json','sourceLevelReadinessPercent','publicRolloutAllowed','noAiPaymentVerifiedFakeAdded']) check(`report missing marker ${marker}`, report.includes(marker));
for (const marker of ['public-rollout-dossier-template.json','targetUsersAndScope','rollbackPlan','safeModePlan','noAiPaymentVerifiedFakeStatement']) check(`dossier template missing marker ${marker}`, dossier.includes(marker));
check('run-source-validators must register Batch133 validator', runValidators.includes('validate-batch133-public-rollout-readiness-source.mjs'));
check('run-source-validators must know Batch133 markers', runValidators.includes('public-rollout:readiness-validate') && runValidators.includes('Batch133') && runValidators.includes('public_rollout_readiness_source_level'));
check('notes must state no production ready and rollout blocked', notes.includes('không production-ready') && notes.includes('public rollout vẫn bị chặn') && notes.includes('Không thêm AI'));
check('notes must state why this batch was chosen', notes.includes('phần có thể làm tốt nhất hiện tại') && notes.includes('không có APP_URL') && notes.includes('Node24'));
const fakeVerified = (registry.records || []).filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch133 must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
const result = { ok: issues.length === 0, packageVersion: pkg.version, gates: Array.isArray(policy.requiredGates) ? policy.requiredGates.length : 0, fakeVerifiedRecords: fakeVerified.length, issues, note: 'Batch133 validates source-level public rollout readiness controls. It does not prove hosted/public/production readiness.' };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
