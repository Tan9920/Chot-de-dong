import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const issues = [];

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const plan = readJson('data/runtime-hosted-closure-evidence.json');
const vercel = readJson('vercel.json');
const hostedLib = read('lib/runtime-hosted-closure.ts');
const runtimeDeployLib = read('lib/runtime-deploy-closure.ts');
const report = read('scripts/runtime-hosted-closure-report.mjs');
const demoBreakthrough = read('lib/demo-breakthrough.ts');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const runValidators = read('scripts/run-source-validators.mjs');
const notes = read('BATCH106_NOTES.md') + '\n' + read('docs/BATCH106_REAL_HOSTED_RUNTIME_CLOSURE.md');

check('package.json version must preserve Batch106+ lineage', ['0.106.0', '0.107.0', '0.108.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must preserve Batch106+ lineage', ['0.106.0', '0.107.0', '0.108.0'].includes(lock.version), lock.version);
check('package-lock root package version must preserve Batch106+ lineage', ['0.106.0', '0.107.0', '0.108.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
check('node engine must stay pinned to 22.x', pkg.engines?.node === '22.x', pkg.engines?.node);
for (const script of ['batch106:runtime-hosted-closure-validate','runtime:hosted-closure-validate','runtime:hosted-closure-report','smoke:batch106','verify:batch106']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
for (const file of [
  'BATCH106_NOTES.md',
  'docs/BATCH106_REAL_HOSTED_RUNTIME_CLOSURE.md',
  'data/runtime-hosted-closure-evidence.json',
  'lib/runtime-hosted-closure.ts',
  'app/api/runtime/hosted-closure/route.ts',
  'app/api/admin/hosted-runtime-board/route.ts',
  'scripts/runtime-hosted-closure-report.mjs',
  'scripts/validate-batch106-runtime-hosted-closure-source.mjs'
]) check(`missing ${file}`, fs.existsSync(file));

check('vercel installCommand must keep clean install', vercel.installCommand === 'npm run install:clean', vercel.installCommand);
check('vercel buildCommand must keep clean build', vercel.buildCommand === 'npm run build:clean', vercel.buildCommand);
check('vercel must mark Batch106 hosted runtime gate', vercel.env?.GIAOAN_BATCH106_HOSTED_RUNTIME_GATE === 'real_hosted_runtime_proof_required', JSON.stringify(vercel.env || {}));
check('runtime hosted plan must be Batch106', String(plan.version || '').includes('batch106'), plan.version);
check('runtime hosted plan must include browser QA and hosted URL smoke', JSON.stringify(plan).includes('browser_qa_mobile_desktop') && JSON.stringify(plan).includes('hosted_url_smoke'));
check('runtime hosted plan must forbid production-ready claim', JSON.stringify(plan).includes('production-ready'));

const fakeVerified = (registry.records || []).filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch106 must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);

for (const marker of [
  'buildHostedRuntimeClosureBoard',
  'evaluateHostedRuntimeEvidence',
  'classifyHostedRuntimeLog',
  'teacher_test_candidate_hosted_runtime_guarded',
  'hosted_runtime_blocked',
  'productionReady: false'
]) check(`runtime hosted closure lib missing marker ${marker}`, hostedLib.includes(marker));
for (const marker of ['Batch106 — Real Hosted Runtime Closure / Vercel Log Fix','runtime-hosted-closure-last-run.json','teacherSmallGroupTest','productionReady']) {
  check(`runtime hosted closure report missing marker ${marker}`, report.includes(marker));
}
for (const marker of ['buildRuntimeDeployClosureBoard','productionReady: false']) {
  check(`Batch105 runtime deploy closure lib marker still present ${marker}`, runtimeDeployLib.includes(marker));
}
for (const marker of ['buildHostedRuntimeClosureBoard','runtimeHostedClosure','Batch106','hosted_runtime_unverified_or_blocked']) {
  check(`demo breakthrough missing marker ${marker}`, demoBreakthrough.includes(marker));
}
for (const marker of ['runtimeHostedClosure','runtime-hosted-closure-card','/api/runtime/hosted-closure','Batch106 · Hosted runtime proof','runtimeHostedMissingRequired']) {
  check(`workspace missing marker ${marker}`, workspace.includes(marker));
}
for (const marker of ['.runtime-hosted-closure-card','.runtime-hosted-closure-grid','Batch106 Real Hosted Runtime Closure']) {
  check(`CSS missing marker ${marker}`, css.includes(marker));
}
check('run-source-validators must register Batch106 validator', runValidators.includes('validate-batch106-runtime-hosted-closure-source.mjs'));
check('run-source-validators must know smoke/verify batch106 scripts', runValidators.includes('smoke:batch106') && runValidators.includes('verify:batch106'));
check('notes must state no fake verified/no AI/no production-ready', notes.includes('không tạo verified giả') && notes.includes('không thêm AI') && notes.includes('Không claim production-ready'));

const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}

const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  fakeVerifiedRecords: fakeVerified.length,
  runtimeHostedProofSteps: Array.isArray(plan.requiredProofChain) ? plan.requiredProofChain.length : 0,
  issues,
  note: 'Batch106 validates hosted runtime closure source-level. It does not prove install/build/hosted pass unless runtime commands pass on a real machine/host.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
