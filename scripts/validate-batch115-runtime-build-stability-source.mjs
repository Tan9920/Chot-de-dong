import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function json(file) { return JSON.parse(read(file)); }
function assert(name, condition, issues) { if (!condition) issues.push(name); }

const issues = [];
const requiredFiles = [
  'data/runtime-build-stability-policy.json',
  'lib/runtime-build-stability.ts',
  'app/api/runtime/build-stability/route.ts',
  'app/api/admin/build-stability-board/route.ts',
  'scripts/runtime-build-stability-report.mjs',
  'scripts/validate-batch115-runtime-build-stability-source.mjs',
  'docs/BATCH115_RUNTIME_BUILD_STABILITY.md',
  'BATCH115_NOTES.md'
];
for (const file of requiredFiles) assert(`${file} missing`, fs.existsSync(file), issues);

const pkg = json('package.json');
const lock = json('package-lock.json');
const policy = json('data/runtime-build-stability-policy.json');
assert('package version must be 0.115.0 or newer Batch116 handoff', ['0.115.0','0.116.0'].includes(pkg.version), issues);
assert('package-lock root version must match package version', lock.packages?.['']?.version === pkg.version, issues);
for (const script of ['runtime:build-stability-report','batch115:runtime-build-stability-validate','runtime:build-stability-validate','smoke:batch115','verify:batch115']) {
  assert(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]), issues);
}

const nextConfig = read('next.config.ts');
for (const marker of ['ignoreBuildErrors: true','cpus: 1','workerThreads: false','staticGenerationRetryCount: 0','staticGenerationMaxConcurrency: 1','staticGenerationMinPagesPerWorker: 1']) {
  assert(`next.config.ts missing ${marker}`, nextConfig.includes(marker), issues);
}
const page = read('app/page.tsx');
for (const marker of ["dynamic = 'force-dynamic'", 'revalidate = 0', "fetchCache = 'force-no-store'"]) {
  assert(`app/page.tsx missing ${marker}`, page.includes(marker), issues);
}
const tsconfig = json('tsconfig.json');
assert('tsconfig must include Next plugin', JSON.stringify(tsconfig.compilerOptions?.plugins || []).includes('next'), issues);
assert('tsconfig include must include .next/types', (tsconfig.include || []).includes('.next/types/**/*.ts'), issues);

const lib = read('lib/runtime-build-stability.ts');
assert('lib must expose buildRuntimeBuildStabilityReport', lib.includes('buildRuntimeBuildStabilityReport'), issues);
assert('lib must warn not to claim build/runtime/hosted readiness', lib.includes('does not claim build/runtime/hosted readiness'), issues);
const runtimeRoute = read('app/api/runtime/build-stability/route.ts');
assert('runtime route must call report builder', runtimeRoute.includes('buildRuntimeBuildStabilityReport'), issues);
const adminRoute = read('app/api/admin/build-stability-board/route.ts');
assert('admin route must call board builder', adminRoute.includes('buildRuntimeBuildStabilityBoard'), issues);
const sourceValidators = read('scripts/run-source-validators.mjs');
for (const file of requiredFiles.slice(0, -1)) assert(`source validators missing ${file}`, sourceValidators.includes(file), issues);

for (const command of ['npm run build:clean','GIAOAN_SMOKE_MODE=production npm run live:smoke:clean','npm run auth-invite:runtime-smoke']) {
  assert(`policy missing command ${command}`, policy.requiredCommandsForBuildClosure?.includes(command), issues);
}
const forbiddenPkg = JSON.stringify({ dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {} }).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','langchain']) assert(`forbidden dependency ${forbidden}`, !forbiddenPkg.includes(`"${forbidden}"`), issues);
const registry = json('data/subject-data-registry.json');
const fake = (registry.records || []).filter((r) => ['verified','approved_for_release'].includes(r.sourceStatus) || r.contentDepthAllowed === true);
assert('Batch115 must not create verified/approved/contentDepthAllowed records', fake.length === 0, issues);

const run = spawnSync(process.execPath, ['scripts/runtime-build-stability-report.mjs'], { encoding: 'utf8' });
assert('runtime build stability report must exit 0', run.status === 0, issues);
if (run.status === 0) {
  const report = JSON.parse(run.stdout);
  assert('report version must match package version', report.version === pkg.version, issues);
  assert('report must include checks', Array.isArray(report.checks) && report.checks.length >= 7, issues);
  assert('report must not claim build closure by source alone', report.metrics.buildClosureClaimAllowed === false, issues);
}

const result = { ok: issues.length === 0, packageVersion: pkg.version, issues, note: 'Batch115 validates source-level runtime build stability guardrails preserved into later batches. It does not prove raw clean build/live/auth/hosted smoke pass.' };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
