import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
function read(file) { return fs.readFileSync(file, 'utf8'); }
function json(file) { return JSON.parse(read(file)); }
function assert(name, condition, issues) { if (!condition) issues.push(name); }
function collectRouteFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) out.push(...collectRouteFiles(file));
    else if (name === 'route.ts') out.push(file);
  }
  return out.sort();
}
const issues = [];
const requiredFiles = [
  'data/runtime-raw-build-closure-policy.json',
  'lib/runtime-raw-build-closure.ts',
  'app/api/runtime/raw-build-closure/route.ts',
  'app/api/admin/raw-build-closure-board/route.ts',
  'scripts/raw-next-build-diagnostic.mjs',
  'scripts/runtime-raw-build-closure-report.mjs',
  'scripts/validate-batch117-raw-build-closure-source.mjs',
  'docs/BATCH117_RAW_NEXT_BUILD_HOSTED_CLOSURE.md',
  'BATCH117_NOTES.md'
];
for (const file of requiredFiles) assert(`${file} missing`, fs.existsSync(file), issues);
const pkg = json('package.json');
const lock = json('package-lock.json');
const policy = json('data/runtime-raw-build-closure-policy.json');
assert('package version must be 0.117.0', pkg.version === '0.117.0', issues);
assert('package-lock root version must be 0.117.0', lock.packages?.['']?.version === '0.117.0', issues);
for (const script of ['build:raw','build:raw:diagnose','runtime:raw-build-closure-report','batch117:raw-build-closure-validate','runtime:raw-build-closure-validate','smoke:batch117','verify:batch117']) {
  assert(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]), issues);
}
assert('build:raw must preserve raw next build truth', pkg.scripts?.['build:raw'] === 'next build', issues);
assert('build:raw:diagnose must run raw-next-build-diagnostic', String(pkg.scripts?.['build:raw:diagnose'] || '').includes('raw-next-build-diagnostic.mjs'), issues);
const nextConfig = read('next.config.ts');
for (const marker of ['staticPageGenerationTimeout: 90','cpus: 1','workerThreads: false','webpackBuildWorker: false','parallelServerBuildTraces: false']) assert(`next.config.ts missing ${marker}`, nextConfig.includes(marker), issues);
const diag = read('scripts/raw-next-build-diagnostic.mjs');
for (const marker of ['Collecting page data','timeout_before_raw_build_exit_zero','noProductionReadyClaim','raw-next-build-diagnostic-last-run.json','NEXT_TELEMETRY_DISABLED']) assert(`diagnostic script missing ${marker}`, diag.includes(marker), issues);
const lib = read('lib/runtime-raw-build-closure.ts');
for (const marker of ['rawBuildClosed','hostedClosed: false','guarded_build_not_equal_raw','build:raw:diagnose']) assert(`lib report missing ${marker}`, lib.includes(marker), issues);
const runtimeRoute = read('app/api/runtime/raw-build-closure/route.ts');
const adminRoute = read('app/api/admin/raw-build-closure-board/route.ts');
for (const routeText of [runtimeRoute, adminRoute]) {
  assert('Batch117 route missing dynamic force-dynamic', routeText.includes("dynamic = 'force-dynamic'"), issues);
  assert('Batch117 route missing revalidate 0', routeText.includes('revalidate = 0'), issues);
  assert('Batch117 route missing fetch no-store', routeText.includes("fetchCache = 'force-no-store'"), issues);
}
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','langchain','stripe']) {
  const deps = JSON.stringify({ dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {} }).toLowerCase();
  assert(`forbidden dependency ${forbidden}`, !deps.includes(`"${forbidden}"`), issues);
}
const routeFiles = collectRouteFiles(path.join('app','api'));
const missingRouteGuards = routeFiles.filter((file) => {
  const text = read(file);
  return !text.includes("dynamic = 'force-dynamic'") || !text.includes('revalidate = 0') || !text.includes("fetchCache = 'force-no-store'");
});
assert(`all API routes must retain dynamic/no-store guards; missing=${missingRouteGuards.slice(0,5).join(',')}`, missingRouteGuards.length === 0, issues);
assert('policy must keep BMAD inspired rules', Array.isArray(policy.bmAdInspiredOperatingRules) && policy.bmAdInspiredOperatingRules.length >= 5, issues);
assert('policy must forbid overclaim', Array.isArray(policy.noOverclaimRules) && policy.noOverclaimRules.some((item) => String(item).includes('production-ready')), issues);
const sourceValidators = read('scripts/run-source-validators.mjs');
for (const file of requiredFiles.slice(0, -1)) assert(`source validators missing ${file}`, sourceValidators.includes(file), issues);
const reportRun = spawnSync(process.execPath, ['scripts/runtime-raw-build-closure-report.mjs'], { encoding: 'utf8' });
assert('runtime raw build closure report must exit 0', reportRun.status === 0, issues);
if (reportRun.status === 0) {
  const report = JSON.parse(reportRun.stdout);
  assert('report version must be 0.117.0', report.version === '0.117.0', issues);
  assert('report must not claim hosted closure', report.hostedClosed === false, issues);
  assert('report must warn against production readiness', String(report.warning || '').includes('production readiness'), issues);
}
const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  routeFilesChecked: routeFiles.length,
  missingRouteGuards: missingRouteGuards.map((file) => file.replace(/\\/g,'/')),
  issues,
  note: 'Batch117 validates source-level raw build/hosted closure triage. It does not prove raw build exit 0; run build:raw and hosted smoke separately.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
