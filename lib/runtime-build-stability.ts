import policy from '@/data/runtime-build-stability-policy.json';
import pkg from '@/package.json';

type StabilityStatus = 'pass' | 'warning' | 'fail';

type StabilityCheck = {
  id: string;
  status: StabilityStatus;
  evidence: string;
  impact: string;
  nextAction: string;
};

function check(id: string, status: StabilityStatus, evidence: string, impact: string, nextAction: string): StabilityCheck {
  return { id, status, evidence, impact, nextAction };
}

function runtimeContext() {
  const runtimeProcess = (globalThis as any).process;
  return {
    platform: String(runtimeProcess?.platform || 'unknown'),
    arch: String(runtimeProcess?.arch || 'unknown'),
    nodeVersion: String(runtimeProcess?.version || 'unknown'),
    hostedUrlProvided: Boolean(runtimeProcess?.env?.GIAOAN_DEMO_URL),
    smokeMode: String(runtimeProcess?.env?.GIAOAN_SMOKE_MODE || 'not_set')
  };
}

export function buildRuntimeBuildStabilityReport() {
  const runtime = runtimeContext();
  const packageVersion = String((pkg as any).version || 'unknown');
  const checks: StabilityCheck[] = [
    check(
      'package_version_matches_batch115',
      packageVersion === '0.115.0' ? 'pass' : 'fail',
      `package=${packageVersion}; policy=${(policy as any).version}`,
      'Batch handoff and validators become unreliable if the package and policy versions drift.',
      'Keep package.json, package-lock.json, policy, docs, and validator versions aligned.'
    ),
    check(
      'build_worker_pressure_guard_declared',
      'pass',
      'next.config.ts should declare experimental.cpus=1, workerThreads=false, and static generation concurrency limits; CLI validator checks file markers.',
      'Build attempts in constrained environments can hang or spawn too many workers without this guard.',
      'Run npm run batch115:runtime-build-stability-validate before claiming source-level closure.'
    ),
    check(
      'demo_shell_static_generation_guard_declared',
      'pass',
      'app/page.tsx should declare dynamic=force-dynamic, revalidate=0, and fetchCache=force-no-store; CLI validator checks file markers.',
      'The demo shell should not be treated as a prerendered/static proof while runtime smoke is still pending.',
      'Run npm run build:clean and live smoke after this source-level guard.'
    ),
    check(
      'build_timeout_not_closed_by_source',
      'warning',
      (policy as any).observedBlocker?.status || 'timeout_in_audit_environment',
      'Source changes lower risk but do not prove the build exits 0.',
      'Run npm run build:clean; if it times out, keep build-ready claim blocked.'
    ),
    check(
      'hosted_url_required_for_hosted_claim',
      runtime.hostedUrlProvided ? 'pass' : 'warning',
      runtime.hostedUrlProvided ? 'GIAOAN_DEMO_URL set' : 'GIAOAN_DEMO_URL missing',
      'Hosted readiness requires a real hosted URL smoke test, not a source-level board.',
      'Deploy to a URL and run GIAOAN_DEMO_URL=https://<hosted-url> npm run hosted:url-smoke.'
    )
  ];

  const hardFails = checks.filter((item) => item.status === 'fail');
  const warnings = checks.filter((item) => item.status === 'warning');

  return {
    ok: hardFails.length === 0,
    batch: (policy as any).batch,
    version: (policy as any).version,
    generatedAt: new Date().toISOString(),
    runtimeContext: runtime,
    metrics: {
      checks: checks.length,
      hardFails: hardFails.length,
      warnings: warnings.length,
      buildClosureClaimAllowed: false,
      hostedUrlProvided: runtime.hostedUrlProvided
    },
    status: hardFails.length ? 'build_stability_source_blocked' : 'build_stability_source_ready_for_build_attempt',
    plainLanguageStatus: 'Batch115 lowers build-timeout risk at source/config level. It still does not claim build/runtime/hosted readiness unless real commands exit 0.',
    checks,
    hardFailedCheckIds: hardFails.map((item) => item.id),
    warningCheckIds: warnings.map((item) => item.id),
    policy,
    nextCommandsToCloseBuildRuntime: (policy as any).requiredCommandsForBuildClosure
  };
}

export function buildRuntimeBuildStabilityBoard() {
  const report = buildRuntimeBuildStabilityReport();
  return {
    report,
    adminWarning: 'Board này chỉ xác nhận guardrail source-level cho build stability. Nó không thay thế npm run build:clean/live smoke/auth smoke/hosted smoke.',
    teacherWarning: 'Nếu build/runtime chưa pass, đây vẫn là demo source artifact; chưa phải bản triển khai ổn định cho giáo viên.',
    decision: 'run_clean_build_and_live_smoke_next_before_any_feature_batch'
  };
}
