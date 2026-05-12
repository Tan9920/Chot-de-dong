import policy from '@/data/runtime-dependency-closure-policy.json';
import pkg from '@/package.json';
import lock from '@/package-lock.json';

type Severity = 'pass' | 'warning' | 'fail';

type ClosureCheck = {
  id: string;
  status: Severity;
  evidence: string;
  impact: string;
  nextAction: string;
};

function check(id: string, status: Severity, evidence: string, impact: string, nextAction: string): ClosureCheck {
  return { id, status, evidence, impact, nextAction };
}

function runtimePlatform() {
  const runtimeProcess = (globalThis as any).process;
  return {
    platform: String(runtimeProcess?.platform || 'unknown'),
    arch: String(runtimeProcess?.arch || 'unknown'),
    nodeVersion: String(runtimeProcess?.version || 'unknown'),
    hostedUrlProvided: Boolean(runtimeProcess?.env?.GIAOAN_DEMO_URL)
  };
}

function platformSwcPackage(platform: string, arch: string) {
  if (platform === 'linux' && arch === 'x64') return '@next/swc-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return '@next/swc-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return '@next/swc-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return '@next/swc-darwin-arm64';
  if (platform === 'win32' && arch === 'x64') return '@next/swc-win32-x64-msvc';
  if (platform === 'win32' && arch === 'arm64') return '@next/swc-win32-arm64-msvc';
  return null;
}

function dependencyMismatches() {
  const pkgDeps = (pkg as any)?.dependencies || {};
  const lockDeps = (lock as any)?.packages?.['']?.dependencies || {};
  return Object.entries(pkgDeps)
    .filter(([name, version]) => lockDeps[name] !== version)
    .map(([name, version]) => ({ name, packageJson: version, packageLockRoot: lockDeps[name] ?? null }));
}

function forbiddenDependencyHits() {
  const forbidden = ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'langchain', 'ai'];
  const names = Object.keys({ ...((pkg as any)?.dependencies || {}), ...((pkg as any)?.devDependencies || {}) });
  return names.filter((name) => forbidden.some((needle) => name.toLowerCase() === needle || name.toLowerCase().startsWith(`${needle}/`)));
}

export function buildRuntimeDependencyClosureReport() {
  const runtime = runtimePlatform();
  const pkgVersion = String((pkg as any).version || 'unknown');
  const lockRoot = (lock as any).packages?.[''] || {};
  const packageEngine = String((pkg as any).engines?.node || '');
  const nodeVersionFile = '22.16.0';
  const nextDeclared = String((pkg as any).dependencies?.next || 'missing');
  const nextLocked = String((lock as any).packages?.['node_modules/next']?.version || 'missing');
  const swcName = platformSwcPackage(runtime.platform, runtime.arch);
  const swcLockPath = swcName ? `node_modules/${swcName}` : '';
  const swcLocked = swcLockPath ? String((lock as any).packages?.[swcLockPath]?.version || 'missing') : 'unsupported-platform';
  const swcOptionalDeclared = swcName ? String((lock as any).packages?.['node_modules/next']?.optionalDependencies?.[swcName] || 'missing') : 'unsupported-platform';
  const mismatches = dependencyMismatches();
  const forbidden = forbiddenDependencyHits();

  // The API route cannot safely inspect local node_modules in all Next runtimes.
  // The CLI script `scripts/runtime-dependency-closure-report.mjs` performs the real file-presence check.
  const nextBinary = runtime.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
  const installedPresenceMode = 'cli_required_for_file_presence';

  const checks: ClosureCheck[] = [
    check('package_lock_exists', 'pass', 'package-lock.json imported by source report', 'npm ci requires a lockfile.', 'Keep a clean public-registry lockfile.'),
    check('package_lock_root_version_matches', lockRoot.version === pkgVersion ? 'pass' : 'fail', `package=${pkgVersion}; lockRoot=${lockRoot.version || 'missing'}`, 'Version mismatch confuses handoff/audit and can hide stale lockfile state.', 'Regenerate or update lock root version.'),
    check('package_dependency_root_matches_lock', mismatches.length === 0 ? 'pass' : 'fail', mismatches.length ? JSON.stringify(mismatches) : 'package.json dependencies match package-lock root dependencies', 'npm ci may fail or install stale dependency graph.', 'Regenerate lockfile on a machine with registry access.'),
    check('node_version_declared', packageEngine.length > 0 ? 'pass' : 'warning', `.node-version=${nodeVersionFile}; engines.node=${packageEngine || 'missing'}`, 'Vercel/CI should run a modern Node compatible with Next 15.', 'Use Node 20+; keep engines and .node-version consistent.'),
    check('next_lock_record_present', nextLocked !== 'missing' ? 'pass' : 'fail', `package next=${nextDeclared}; lock next=${nextLocked}`, 'Next build cannot run without locked Next package.', 'Regenerate lockfile and run npm ci.'),
    check('platform_swc_lock_record_present', swcLocked !== 'missing' ? 'pass' : 'fail', `platform=${runtime.platform}/${runtime.arch}; swc=${swcName || 'unsupported'}; lock=${swcLocked}; nextOptional=${swcOptionalDeclared}`, 'Next production build commonly needs the platform SWC optional dependency.', 'Run npm ci without omitting optional dependencies.'),
    check('next_binary_installed_now', 'fail', `${nextBinary} not verified by API report; run CLI report`, 'build:clean cannot be claimed until the Next CLI is installed and verified.', 'Run npm run install:clean, then npm run runtime:dependency-closure-report.'),
    check('platform_swc_installed_now', 'fail', `${swcLockPath || 'platform SWC'} not verified by API report; run CLI report`, 'next:swc-ready cannot be claimed until the platform SWC package is installed.', 'Run npm run install:clean and then npm run next:swc-ready.'),
    check('no_forbidden_ai_dependencies', forbidden.length === 0 ? 'pass' : 'fail', forbidden.length ? forbidden.join(', ') : 'no AI SDK dependency detected', 'Stage-1 product must not quietly add AI/model dependencies.', 'Remove forbidden AI/model dependencies.'),
    check('hosted_url_required_for_hosted_claim', runtime.hostedUrlProvided ? 'pass' : 'warning', runtime.hostedUrlProvided ? 'GIAOAN_DEMO_URL set' : 'GIAOAN_DEMO_URL missing', 'Hosted smoke cannot be claimed without a real URL.', 'Set GIAOAN_DEMO_URL and run hosted:url-smoke.'),
  ];

  const hardFails = checks.filter((item) => item.status === 'fail');
  const warnings = checks.filter((item) => item.status === 'warning');
  const buildClosureClaimAllowed = false;

  return {
    ok: true,
    batch: 'Batch114 — Runtime Dependency Closure Board & Build Blocker Evidence',
    version: (policy as any).version,
    generatedAt: new Date().toISOString(),
    runtimeContext: {
      platform: runtime.platform,
      arch: runtime.arch,
      nodeVersion: runtime.nodeVersion,
      packageVersion: pkgVersion,
      nodeVersionFile,
      packageEngine,
      nextDeclared,
      nextLocked,
      platformSwcPackage: swcName,
      platformSwcLockedVersion: swcLocked,
      platformSwcDeclaredByNext: swcOptionalDeclared,
      installedPresenceMode
    },
    metrics: {
      checks: checks.length,
      hardFails: hardFails.length,
      warnings: warnings.length,
      dependencyMismatches: mismatches.length,
      forbiddenDependencyHits: forbidden.length,
      nextBinaryInstalledNow: false,
      platformSwcInstalledNow: false,
      buildClosureClaimAllowed,
      hostedUrlProvided: runtime.hostedUrlProvided,
    },
    status: 'dependency_closure_blocked_do_not_claim_build_runtime',
    plainLanguageStatus: 'API board is conservative: file-presence/build/runtime closure must be proven by CLI commands, not by source imports.',
    checks,
    hardFailedCheckIds: hardFails.map((item) => item.id),
    warningCheckIds: warnings.map((item) => item.id),
    policy,
    allowedClaims: (policy as any).allowedClaimsWhenOnlySourcePasses,
    forbiddenClaims: (policy as any).forbiddenClaimsWhenCommandsFail,
    nextCommandsToCloseRuntime: (policy as any).requiredCommandsForRuntimeClosure,
  };
}

export function buildRuntimeDependencyClosureBoard() {
  const report = buildRuntimeDependencyClosureReport();
  return {
    report,
    adminWarning: 'Board này không thay thế npm ci/build/live smoke. Nó chỉ làm rõ blocker và điều kiện được claim runtime.',
    teacherWarning: 'Nếu build/runtime/hosted chưa pass, chỉ nên coi đây là source demo/audit artifact, không phải bản triển khai ổn định.',
    decision: report.metrics.buildClosureClaimAllowed ? 'run_build_and_live_smoke_next' : 'fix_dependency_install_before_build_claim',
  };
}
