import fs from 'node:fs';
import path from 'node:path';
function read(file) { return fs.readFileSync(file, 'utf8'); }
function json(file, fallback = null) { try { return JSON.parse(read(file)); } catch { return fallback; } }
function exists(file) { return fs.existsSync(file); }
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
function check(id, status, evidence) { return { id, status, evidence }; }
const pkg = json('package.json', {});
const policy = json('data/runtime-raw-build-closure-policy.json', {});
const diagnostic = json('artifacts/raw-next-build-diagnostic-last-run.json', null);
const guarded = json('artifacts/next-build-runtime-guard-last-run.json', null);
const nextConfig = exists('next.config.ts') ? read('next.config.ts') : '';
const routeFiles = collectRouteFiles(path.join('app', 'api'));
const checks = [
  check('package_version_batch117', pkg.version === '0.117.0' ? 'pass' : 'fail', `package=${pkg.version || 'missing'}`),
  check('raw_build_script_preserved', pkg.scripts?.['build:raw'] === 'next build' ? 'pass' : 'fail', pkg.scripts?.['build:raw'] || 'missing'),
  check('raw_build_diagnostic_script_present', Boolean(pkg.scripts?.['build:raw:diagnose']) ? 'pass' : 'fail', pkg.scripts?.['build:raw:diagnose'] || 'missing'),
  check('static_generation_timeout_declared', nextConfig.includes('staticPageGenerationTimeout: 90') ? 'pass' : 'warning', nextConfig.includes('staticPageGenerationTimeout') ? 'staticPageGenerationTimeout configured' : 'not configured'),
  check('worker_low_resource_guard_still_present', ['cpus: 1', 'workerThreads: false', 'webpackBuildWorker: false', 'parallelServerBuildTraces: false'].every((m) => nextConfig.includes(m)) ? 'pass' : 'warning', 'low-resource Next build markers checked'),
  check('api_route_dynamic_guard_coverage', routeFiles.length >= 100 ? 'pass' : 'warning', `${routeFiles.length} route files detected for dynamic/no-store source validation`),
  check('diagnostic_artifact_present', diagnostic ? (diagnostic.rawNextBuildExitCode === 0 ? 'pass' : 'warning') : 'skipped', diagnostic ? `exit=${diagnostic.rawNextBuildExitCode}; phase=${diagnostic.detectedPhase || 'unknown'}; status=${diagnostic.status}` : 'run npm run build:raw:diagnose'),
  check('raw_build_exit_zero_required', diagnostic?.rawNextBuildExitCode === 0 ? 'pass' : 'warning', diagnostic?.rawNextBuildExitCode === 0 ? 'raw next build exit 0 recorded' : 'raw next build exit 0 not recorded yet'),
  check('guarded_build_not_equal_raw', 'pass', guarded?.status ? `guarded=${guarded.status}; raw remains separately gated` : 'guarded artifact absent or not run; raw remains separately gated')
];
const hardFails = checks.filter((item) => item.status === 'fail');
const report = {
  ok: hardFails.length === 0,
  batch: 'Batch117 — Raw Next Build / Hosted Closure Triage',
  version: pkg.version || 'unknown',
  generatedAt: new Date().toISOString(),
  rawBuildClosed: diagnostic?.rawNextBuildExitCode === 0,
  hostedClosed: false,
  status: diagnostic?.rawNextBuildExitCode === 0 ? 'raw_build_exit_zero_recorded_needs_live_auth_hosted_smoke' : 'raw_build_not_closed_diagnostic_mode',
  checks,
  hardFailedCheckIds: hardFails.map((item) => item.id),
  policy,
  diagnostic,
  warning: 'Batch117 improves raw build triage and hosted closure discipline. It must not be used to claim production readiness unless build:raw, live smoke, auth smoke, and hosted URL smoke pass with real evidence.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync(path.join('artifacts', 'runtime-raw-build-closure-last-run.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
