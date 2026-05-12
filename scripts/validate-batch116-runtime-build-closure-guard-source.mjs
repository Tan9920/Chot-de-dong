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
  'data/runtime-build-closure-guard-policy.json',
  'lib/runtime-build-closure-guard.ts',
  'app/api/runtime/build-closure-guard/route.ts',
  'app/api/admin/build-closure-guard-board/route.ts',
  'scripts/next-build-runtime-guard.mjs',
  'scripts/runtime-build-closure-guard-report.mjs',
  'scripts/validate-batch116-runtime-build-closure-guard-source.mjs',
  'docs/BATCH116_RUNTIME_BUILD_CLOSURE_GUARD.md',
  'BATCH116_NOTES.md'
];
for (const file of requiredFiles) assert(`${file} missing`, fs.existsSync(file), issues);
const pkg = json('package.json');
const lock = json('package-lock.json');
const policy = json('data/runtime-build-closure-guard-policy.json');
assert('package version must be 0.116.0', pkg.version === '0.116.0', issues);
assert('package-lock root version must be 0.116.0', lock.packages?.['']?.version === '0.116.0', issues);
for (const script of ['build:raw','build:guarded','runtime:build-closure-guard-report','batch116:runtime-build-closure-guard-validate','runtime:build-closure-guard-validate','smoke:batch116','verify:batch116']) {
  assert(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]), issues);
}
assert('build script must use next-build-runtime-guard', pkg.scripts?.build?.includes('next-build-runtime-guard.mjs'), issues);
assert('build:raw must preserve raw next build', pkg.scripts?.['build:raw'] === 'next build', issues);
const nextConfig = read('next.config.ts');
for (const marker of ['webpackBuildWorker: false','serverMinification: false','parallelServerCompiles: false','parallelServerBuildTraces: false','cpus: 1','workerThreads: false']) {
  assert(`next.config.ts missing ${marker}`, nextConfig.includes(marker), issues);
}
const routeFiles = collectRouteFiles(path.join('app','api'));
assert('expected many route files for route guard audit', routeFiles.length >= 100, issues);
const missingRouteGuards = routeFiles.filter((file) => {
  const text = read(file);
  return !text.includes("dynamic = 'force-dynamic'") || !text.includes('revalidate = 0') || !text.includes("fetchCache = 'force-no-store'");
});
assert(`all API routes must have force dynamic/no-store guards; missing=${missingRouteGuards.slice(0,5).join(',')}`, missingRouteGuards.length === 0, issues);
const guardScript = read('scripts/next-build-runtime-guard.mjs');
for (const marker of ['controlled_trace_timeout_with_startable_artifacts','requiredArtifactsReady','ensureFallback500','GIAOAN_BUILD_GUARD_STRICT_RAW','noAiPaymentVerifiedFakeAdded']) {
  assert(`guard script missing ${marker}`, guardScript.includes(marker), issues);
}
const cleanCommand = read('scripts/clean-npm-command.mjs');
assert('clean-npm-command must use detached kill tree on Unix', cleanCommand.includes('detached: process.platform !==') && cleanCommand.includes('process.kill(-child.pid'), issues);
const forbiddenPkg = JSON.stringify({ dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {} }).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','langchain']) assert(`forbidden dependency ${forbidden}`, !forbiddenPkg.includes(`"${forbidden}"`), issues);
const sourceValidators = read('scripts/run-source-validators.mjs');
for (const file of requiredFiles.slice(0, -1)) assert(`source validators missing ${file}`, sourceValidators.includes(file), issues);
for (const claim of policy.forbiddenClaims || []) assert(`policy forbidden claim too short: ${claim}`, String(claim).length > 20, issues);
const reportRun = spawnSync(process.execPath, ['scripts/runtime-build-closure-guard-report.mjs'], { encoding: 'utf8' });
assert('runtime build closure guard report must exit 0', reportRun.status === 0, issues);
if (reportRun.status === 0) {
  const report = JSON.parse(reportRun.stdout);
  assert('report version must be 0.116.0', report.version === '0.116.0', issues);
  assert('report must include guarded/raw separation warning', String(report.warning || '').includes('raw next build'), issues);
}
const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  routeFilesChecked: routeFiles.length,
  missingRouteGuards: missingRouteGuards.map((file) => file.replace(/\\/g,'/')),
  issues,
  note: 'Batch116 validates guarded build closure source. Guarded build success is not the same as raw next build exit 0; report both.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
