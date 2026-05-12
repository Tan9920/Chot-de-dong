import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function json(file) { return JSON.parse(read(file)); }
function assert(name, condition, issues) { if (!condition) issues.push(name); }

const issues = [];
const requiredFiles = [
  'data/runtime-dependency-closure-policy.json',
  'lib/runtime-dependency-closure.ts',
  'app/api/runtime/dependency-closure/route.ts',
  'app/api/admin/dependency-closure-board/route.ts',
  'scripts/runtime-dependency-closure-report.mjs',
  'scripts/validate-batch114-runtime-dependency-closure-source.mjs',
  'docs/BATCH114_RUNTIME_DEPENDENCY_CLOSURE.md',
  'BATCH114_NOTES.md'
];
for (const file of requiredFiles) assert(`${file} missing`, fs.existsSync(file), issues);

const pkg = json('package.json');
const lock = json('package-lock.json');
const policy = json('data/runtime-dependency-closure-policy.json');
assert('package version must be 0.114.0', pkg.version === '0.114.0', issues);
assert('package-lock root version must be 0.114.0', lock.packages?.['']?.version === '0.114.0', issues);
for (const script of ['runtime:dependency-closure-report','batch114:runtime-dependency-closure-validate','runtime:dependency-closure-validate','smoke:batch114','verify:batch114']) {
  assert(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]), issues);
}
for (const command of ['npm run registry:diagnose','npm run install:clean','npm run next:swc-ready','npm run build:clean','GIAOAN_SMOKE_MODE=production npm run live:smoke:clean','npm run auth-invite:runtime-smoke']) {
  assert(`policy missing command ${command}`, policy.requiredCommandsForRuntimeClosure?.includes(command), issues);
}
const lib = read('lib/runtime-dependency-closure.ts');
assert('lib must include dependency_closure_blocked status', lib.includes('dependency_closure_blocked_do_not_claim_build_runtime'), issues);
assert('lib must check node_modules/.bin/next', lib.includes('node_modules/.bin/next'), issues);
assert('lib must check no forbidden AI dependencies', lib.includes('no_forbidden_ai_dependencies'), issues);
const route = read('app/api/runtime/dependency-closure/route.ts');
assert('runtime route must call report builder', route.includes('buildRuntimeDependencyClosureReport'), issues);
const adminRoute = read('app/api/admin/dependency-closure-board/route.ts');
assert('admin route must call board builder', adminRoute.includes('buildRuntimeDependencyClosureBoard'), issues);
const sourceValidators = read('scripts/run-source-validators.mjs');
for (const file of requiredFiles.slice(0, -1)) assert(`source validators missing ${file}`, sourceValidators.includes(file), issues);
const forbiddenPkg = JSON.stringify({ dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {} }).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','langchain']) assert(`forbidden dependency ${forbidden}`, !forbiddenPkg.includes(`"${forbidden}"`), issues);
const registry = json('data/subject-data-registry.json');
const fake = (registry.records || []).filter((r) => ['verified','approved_for_release'].includes(r.sourceStatus) || r.contentDepthAllowed === true);
assert('Batch114 must not create verified/approved/contentDepthAllowed records', fake.length === 0, issues);
const run = spawnSync(process.execPath, ['scripts/runtime-dependency-closure-report.mjs'], { encoding: 'utf8' });
assert('runtime dependency closure report must exit 0', run.status === 0, issues);
if (run.status === 0) {
  const report = JSON.parse(run.stdout);
  assert('report version must be 0.114.0', report.version === '0.114.0', issues);
  assert('report must include checks', Array.isArray(report.checks) && report.checks.length >= 8, issues);
  assert('report must not claim build closure without installed next', report.status === 'dependency_closure_blocked_do_not_claim_build_runtime' || report.metrics.buildClosureClaimAllowed === true, issues);
}
const result = { ok: issues.length === 0, packageVersion: pkg.version, issues, note: 'Batch114 validates source-level dependency closure board and anti-overclaim guardrails. It does not prove npm ci, Next build, live HTTP, auth runtime, or hosted demo pass.' };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
