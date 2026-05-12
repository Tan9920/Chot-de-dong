import fs from 'fs';
import path from 'path';

function readJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8')) as T; } catch { return fallback; }
}
function fileExists(file: string) { return fs.existsSync(path.join(process.cwd(), file)); }

export function buildRuntimeBuildClosureGuardReport() {
  const pkg = readJson<any>('package.json', {});
  const policy = readJson<any>('data/runtime-build-closure-guard-policy.json', {});
  const artifact = readJson<any>('artifacts/next-build-runtime-guard-last-run.json', null);
  const routeFiles = collectRouteFiles(path.join(process.cwd(), 'app', 'api'));
  const routeGuardMissing = routeFiles.filter((file) => {
    const text = fs.readFileSync(file, 'utf8');
    return !text.includes("dynamic = 'force-dynamic'") || !text.includes('revalidate = 0') || !text.includes("fetchCache = 'force-no-store'");
  });
  const nextConfig = safeRead('next.config.ts');
  const checks = [
    { id: 'package_version_batch116', status: pkg.version === '0.116.0' ? 'pass' : 'fail', evidence: `package=${pkg.version || 'missing'}` },
    { id: 'build_script_uses_guard', status: pkg.scripts?.build?.includes('next-build-runtime-guard.mjs') ? 'pass' : 'fail', evidence: pkg.scripts?.build || 'missing' },
    { id: 'raw_build_script_preserved', status: pkg.scripts?.['build:raw'] === 'next build' ? 'pass' : 'fail', evidence: pkg.scripts?.['build:raw'] || 'missing' },
    { id: 'next_config_worker_guard', status: ['webpackBuildWorker: false','serverMinification: false','parallelServerCompiles: false','parallelServerBuildTraces: false'].every((m) => nextConfig.includes(m)) ? 'pass' : 'fail', evidence: 'worker/minification/trace flags checked' },
    { id: 'api_route_dynamic_guards', status: routeGuardMissing.length === 0 ? 'pass' : 'fail', evidence: `${routeFiles.length} route files checked; missing=${routeGuardMissing.length}` },
    { id: 'guard_artifact_present', status: artifact ? 'pass' : 'warning', evidence: artifact?.status || 'not yet generated' },
    { id: 'guarded_build_is_not_raw_claim', status: 'pass', evidence: 'report separates guarded status from raw next build exit 0' }
  ];
  const hardFails = checks.filter((c) => c.status === 'fail');
  return {
    ok: hardFails.length === 0,
    batch: 'Batch116 — Runtime Build Closure Guard',
    version: pkg.version || 'unknown',
    generatedAt: new Date().toISOString(),
    status: artifact?.ok ? artifact.status : 'source_ready_guard_not_yet_run_or_failed',
    rawNextBuildExitCode: artifact?.rawNextBuildExitCode ?? null,
    guardedBuildArtifactStatus: artifact?.status || null,
    checks,
    hardFailedCheckIds: hardFails.map((c) => c.id),
    routeGuardMissing: routeGuardMissing.map((file) => path.relative(process.cwd(), file)),
    policy,
    artifact,
    warning: 'Guarded build evidence improves deployability testing but raw next build and live/auth/hosted smoke must still be reported separately. Do not overclaim production readiness.'
  };
}

function safeRead(file: string) { try { return fs.readFileSync(path.join(process.cwd(), file), 'utf8'); } catch { return ''; } }
function collectRouteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) out.push(...collectRouteFiles(file));
    else if (name === 'route.ts') out.push(file);
  }
  return out.sort();
}
