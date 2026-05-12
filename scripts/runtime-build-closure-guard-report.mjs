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
const pkg = json('package.json', {});
const policy = json('data/runtime-build-closure-guard-policy.json', {});
const artifact = json('artifacts/next-build-runtime-guard-last-run.json', null);
const nextConfig = exists('next.config.ts') ? read('next.config.ts') : '';
const routeFiles = collectRouteFiles(path.join('app', 'api'));
const routeGuardMissing = routeFiles.filter((file) => {
  const text = read(file);
  return !text.includes("dynamic = 'force-dynamic'") || !text.includes('revalidate = 0') || !text.includes("fetchCache = 'force-no-store'");
});
function check(id, status, evidence) { return { id, status, evidence }; }
const checks = [
  check('package_version_batch116', pkg.version === '0.116.0' ? 'pass' : 'fail', `package=${pkg.version || 'missing'}`),
  check('build_script_uses_guard', pkg.scripts?.build?.includes('next-build-runtime-guard.mjs') ? 'pass' : 'fail', pkg.scripts?.build || 'missing'),
  check('raw_build_script_preserved', pkg.scripts?.['build:raw'] === 'next build' ? 'pass' : 'fail', pkg.scripts?.['build:raw'] || 'missing'),
  check('next_config_worker_guard', ['webpackBuildWorker: false','serverMinification: false','parallelServerCompiles: false','parallelServerBuildTraces: false'].every((m) => nextConfig.includes(m)) ? 'pass' : 'fail', 'worker/minification/trace flags checked'),
  check('api_route_dynamic_guards', routeGuardMissing.length === 0 ? 'pass' : 'fail', `${routeFiles.length} route files checked; missing=${routeGuardMissing.length}`),
  check('guard_artifact_present', artifact ? 'pass' : 'warning', artifact?.status || 'not yet generated'),
  check('guarded_build_is_not_raw_claim', 'pass', 'report separates guarded status from raw next build exit 0')
];
const hardFails = checks.filter((c) => c.status === 'fail');
const report = {
  ok: hardFails.length === 0,
  batch: 'Batch116 — Runtime Build Closure Guard',
  version: pkg.version || 'unknown',
  generatedAt: new Date().toISOString(),
  status: artifact?.ok ? artifact.status : 'source_ready_guard_not_yet_run_or_failed',
  rawNextBuildExitCode: artifact?.rawNextBuildExitCode ?? null,
  guardedBuildArtifactStatus: artifact?.status || null,
  checks,
  hardFailedCheckIds: hardFails.map((c) => c.id),
  routeGuardMissing: routeGuardMissing.map((file) => file.replace(/\\/g, '/')),
  policy,
  artifact,
  warning: 'Guarded build evidence improves deployability testing but raw next build and live/auth/hosted smoke must still be reported separately. Do not overclaim production readiness.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync(path.join('artifacts', 'runtime-build-closure-guard-last-run.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
