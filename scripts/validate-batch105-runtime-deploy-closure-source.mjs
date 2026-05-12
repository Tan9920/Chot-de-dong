import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const issues = [];

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const plan = readJson('data/runtime-deploy-closure-plan.json');
const vercel = readJson('vercel.json');
const lib = read('lib/runtime-deploy-closure.ts');
const runtimeReport = read('scripts/runtime-deploy-closure-report.mjs');
const runtimeClosureReport = read('scripts/runtime-closure-report.mjs');
const demoBreakthrough = read('lib/demo-breakthrough.ts');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const runValidators = read('scripts/run-source-validators.mjs');
const notes = read('BATCH105_NOTES.md') + '\n' + read('docs/BATCH105_RUNTIME_HOSTED_CLOSURE_BREAKTHROUGH.md');

check('package.json version must preserve Batch105+ lineage', ['0.105.0', '0.106.0', '0.107.0', '0.108.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must preserve Batch105+ lineage', ['0.105.0', '0.106.0', '0.107.0', '0.108.0'].includes(lock.version), lock.version);
check('package-lock root package version must preserve Batch105+ lineage', ['0.105.0', '0.106.0', '0.107.0', '0.108.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
check('node engine must stay pinned to 22.x', pkg.engines?.node === '22.x', pkg.engines?.node);
check('.node-version must exist', fs.existsSync('.node-version'));
for (const script of ['batch105:runtime-deploy-closure-validate','runtime:deploy-closure-validate','runtime:deploy-closure-report','smoke:batch105','verify:batch105']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
for (const file of [
  'BATCH105_NOTES.md',
  'docs/BATCH105_RUNTIME_HOSTED_CLOSURE_BREAKTHROUGH.md',
  'data/runtime-deploy-closure-plan.json',
  'lib/runtime-deploy-closure.ts',
  'app/api/runtime/deploy-closure/route.ts',
  'app/api/admin/runtime-deploy-board/route.ts',
  'scripts/runtime-deploy-closure-report.mjs',
  'scripts/validate-batch105-runtime-deploy-closure-source.mjs'
]) check(`missing ${file}`, fs.existsSync(file));

check('vercel installCommand must use install:clean', vercel.installCommand === 'npm run install:clean', vercel.installCommand);
check('vercel buildCommand must use build:clean', vercel.buildCommand === 'npm run build:clean', vercel.buildCommand);
check('vercel must mark Batch105 runtime gate', vercel.env?.GIAOAN_BATCH105_RUNTIME_GATE === 'source_level_runtime_proof_required', JSON.stringify(vercel.env || {}));
check('runtime plan must be Batch105', String(plan.version || '').includes('batch105'), plan.version);
check('runtime plan must include hosted URL smoke proof', JSON.stringify(plan).includes('hosted_url_smoke'));
check('runtime plan must forbid production-ready claim', JSON.stringify(plan).includes('Không claim demo chạy thật') || JSON.stringify(plan).includes('production-ready'));

const fakeVerified = (registry.records || []).filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch105 must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);

for (const marker of [
  'buildRuntimeDeployClosureBoard',
  'evaluateRuntimeDeployEvidence',
  'source_level_runtime_gate_ready',
  'dependency_blocked',
  'hosted_smoke_required',
  'teacher_test_candidate',
  'productionReady: false'
]) check(`runtime deploy closure lib missing marker ${marker}`, lib.includes(marker));
for (const marker of ['Batch105 — Runtime/Hosted Closure Breakthrough','hardBlockers','hostedBlockers','teacherSmallGroupTest','productionReady: false']) {
  check(`runtime deploy closure report missing marker ${marker}`, runtimeReport.includes(marker));
}
check('runtime closure report must use Batch105 smoke, not stale Batch102 source validate only', runtimeClosureReport.includes('smoke:batch105') || runtimeClosureReport.includes('source_smoke_batch105'));
for (const marker of ['buildRuntimeDeployClosureBoard','runtimeDeployClosure','runtime_hosted_closure_source_ready_runtime_blocked','Batch105']) {
  check(`demo breakthrough missing marker ${marker}`, demoBreakthrough.includes(marker));
}
for (const marker of ['runtimeDeployClosure','runtime-deploy-closure-card','/api/runtime/deploy-closure','Batch105 · Runtime/Hosted Closure','runtimeDeployHardBlockers']) {
  check(`workspace missing marker ${marker}`, workspace.includes(marker));
}
for (const marker of ['.runtime-deploy-closure-card','.runtime-deploy-closure-grid','Batch105 Runtime/Hosted Closure']) {
  check(`CSS missing marker ${marker}`, css.includes(marker));
}
check('run-source-validators must register Batch105 validator', runValidators.includes('validate-batch105-runtime-deploy-closure-source.mjs'));
check('run-source-validators must know smoke/verify batch105 scripts', runValidators.includes('smoke:batch105') && runValidators.includes('verify:batch105'));
check('notes must state no fake verified/no AI/no production-ready', notes.includes('không tạo verified giả') && notes.includes('không thêm AI') && notes.includes('Không claim production-ready'));

const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}

const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  fakeVerifiedRecords: fakeVerified.length,
  runtimePlanSteps: Array.isArray(plan.requiredProofChain) ? plan.requiredProofChain.length : 0,
  issues,
  note: 'Batch105 validates runtime/hosted closure gate source-level. It does not prove install/build/hosted pass unless runtime commands pass on a real machine/host.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
