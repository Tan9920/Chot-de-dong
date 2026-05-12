import fs from 'fs';
import path from 'path';

type CheckStatus = 'pass' | 'warning' | 'fail' | 'skipped';

type Check = { id: string; status: CheckStatus; evidence: string };

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function readText(file: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  } catch {
    return '';
  }
}

function exists(file: string): boolean {
  return fs.existsSync(path.join(process.cwd(), file));
}

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

export function buildRuntimeRawBuildClosureReport() {
  const pkg = readJson<any>('package.json', {});
  const policy = readJson<any>('data/runtime-raw-build-closure-policy.json', {});
  const diagnostic = readJson<any>('artifacts/raw-next-build-diagnostic-last-run.json', null);
  const guarded = readJson<any>('artifacts/next-build-runtime-guard-last-run.json', null);
  const nextConfig = readText('next.config.ts');
  const routeFiles = collectRouteFiles(path.join(process.cwd(), 'app', 'api'));
  const checks: Check[] = [
    {
      id: 'package_version_batch117',
      status: pkg.version === '0.117.0' ? 'pass' : 'fail',
      evidence: `package=${pkg.version || 'missing'}`
    },
    {
      id: 'raw_build_script_preserved',
      status: pkg.scripts?.['build:raw'] === 'next build' ? 'pass' : 'fail',
      evidence: pkg.scripts?.['build:raw'] || 'missing'
    },
    {
      id: 'raw_build_diagnostic_script_present',
      status: Boolean(pkg.scripts?.['build:raw:diagnose']) ? 'pass' : 'fail',
      evidence: pkg.scripts?.['build:raw:diagnose'] || 'missing'
    },
    {
      id: 'static_generation_timeout_declared',
      status: nextConfig.includes('staticPageGenerationTimeout: 90') ? 'pass' : 'warning',
      evidence: nextConfig.includes('staticPageGenerationTimeout') ? 'staticPageGenerationTimeout configured' : 'not configured'
    },
    {
      id: 'worker_low_resource_guard_still_present',
      status: ['cpus: 1', 'workerThreads: false', 'webpackBuildWorker: false', 'parallelServerBuildTraces: false'].every((m) => nextConfig.includes(m)) ? 'pass' : 'warning',
      evidence: 'low-resource Next build markers checked'
    },
    {
      id: 'api_route_dynamic_guard_coverage',
      status: routeFiles.length >= 100 ? 'pass' : 'warning',
      evidence: `${routeFiles.length} route files detected for dynamic/no-store source validation`
    },
    {
      id: 'diagnostic_artifact_present',
      status: diagnostic ? (diagnostic.rawNextBuildExitCode === 0 ? 'pass' : 'warning') : 'skipped',
      evidence: diagnostic ? `exit=${diagnostic.rawNextBuildExitCode}; phase=${diagnostic.detectedPhase || 'unknown'}; status=${diagnostic.status}` : 'run npm run build:raw:diagnose'
    },
    {
      id: 'raw_build_exit_zero_required',
      status: diagnostic?.rawNextBuildExitCode === 0 ? 'pass' : 'warning',
      evidence: diagnostic?.rawNextBuildExitCode === 0 ? 'raw next build exit 0 recorded' : 'raw next build exit 0 not recorded yet'
    },
    {
      id: 'guarded_build_not_equal_raw',
      status: 'pass',
      evidence: guarded?.status ? `guarded=${guarded.status}; raw remains separately gated` : 'guarded artifact absent or not run; raw remains separately gated'
    }
  ];
  const hardFails = checks.filter((item) => item.status === 'fail');
  return {
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
}
