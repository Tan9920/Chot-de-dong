import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function exists(filePath) { return fs.existsSync(path.resolve(process.cwd(), filePath)); }
function readJson(filePath) { return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8')); }
function text(filePath) { try { return fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8').trim(); } catch { return ''; } }
function platformSwcPackage() {
  const platform = os.platform(), arch = os.arch();
  if (platform === 'linux' && arch === 'x64') return '@next/swc-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return '@next/swc-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return '@next/swc-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return '@next/swc-darwin-arm64';
  if (platform === 'win32' && arch === 'x64') return '@next/swc-win32-x64-msvc';
  if (platform === 'win32' && arch === 'arm64') return '@next/swc-win32-arm64-msvc';
  return null;
}
function check(id, status, evidence, impact, nextAction) { return { id, status, evidence, impact, nextAction }; }
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/runtime-dependency-closure-policy.json');
const pkgDeps = pkg.dependencies || {};
const lockDeps = lock.packages?.['']?.dependencies || {};
const mismatches = Object.entries(pkgDeps).filter(([name, version]) => lockDeps[name] !== version).map(([name, version]) => ({ name, packageJson: version, packageLockRoot: lockDeps[name] ?? null }));
const swcName = platformSwcPackage();
const swcPath = swcName ? `node_modules/${swcName}` : '';
const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
const forbiddenNames = ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'langchain', 'ai'];
const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
const forbidden = deps.filter((name) => forbiddenNames.some((needle) => name.toLowerCase() === needle || name.toLowerCase().startsWith(`${needle}/`)));
const nodeVersionFile = text('.node-version');
const nodeMajor = Number((nodeVersionFile.match(/^(\d+)/) || [])[1] || 0);
const checks = [
  check('package_lock_exists', exists('package-lock.json') ? 'pass' : 'fail', exists('package-lock.json') ? 'present' : 'missing', 'npm ci requires a lockfile.', 'Keep package-lock.json.'),
  check('package_lock_root_version_matches', lock.packages?.['']?.version === pkg.version ? 'pass' : 'fail', `package=${pkg.version}; lockRoot=${lock.packages?.['']?.version || 'missing'}`, 'Mismatch makes audits unreliable.', 'Update package-lock root version.'),
  check('package_dependency_root_matches_lock', mismatches.length === 0 ? 'pass' : 'fail', mismatches.length ? JSON.stringify(mismatches) : 'dependencies match', 'npm ci may fail or install stale graph.', 'Regenerate lockfile.'),
  check('node_version_declared', nodeMajor >= 20 ? 'pass' : 'warning', `.node-version=${nodeVersionFile || 'missing'}; engines.node=${pkg.engines?.node || 'missing'}`, 'CI should use Node 20+.', 'Use Node 20+.'),
  check('next_lock_record_present', lock.packages?.['node_modules/next']?.version ? 'pass' : 'fail', `declared=${pkg.dependencies?.next}; locked=${lock.packages?.['node_modules/next']?.version || 'missing'}`, 'Next build requires locked Next package.', 'Regenerate lockfile.'),
  check('platform_swc_lock_record_present', swcName && lock.packages?.[swcPath]?.version ? 'pass' : 'fail', `platform=${os.platform()}/${os.arch()}; swc=${swcName || 'unsupported'}; locked=${swcName ? lock.packages?.[swcPath]?.version || 'missing' : 'unsupported'}`, 'Next build requires platform SWC optional package.', 'Run npm ci with optional dependencies.'),
  check('next_binary_installed_now', exists(nextBin) ? 'pass' : 'fail', exists(nextBin) ? `${nextBin} exists` : `${nextBin} missing`, 'build:clean cannot pass without Next CLI.', 'Run npm run install:clean.'),
  check('platform_swc_installed_now', swcName && exists(swcPath) ? 'pass' : 'fail', swcName ? `${swcPath} ${exists(swcPath) ? 'exists' : 'missing'}` : 'unsupported platform', 'next:swc-ready cannot pass without platform SWC package.', 'Run npm run install:clean.'),
  check('no_forbidden_ai_dependencies', forbidden.length === 0 ? 'pass' : 'fail', forbidden.length ? forbidden.join(', ') : 'none', 'Do not add AI SDK in no-AI stage.', 'Remove forbidden dependencies.'),
  check('hosted_url_required_for_hosted_claim', process.env.GIAOAN_DEMO_URL ? 'pass' : 'warning', process.env.GIAOAN_DEMO_URL ? 'set' : 'missing', 'Hosted claim requires real URL smoke.', 'Set GIAOAN_DEMO_URL and run hosted:url-smoke.'),
];
const hardFails = checks.filter((c) => c.status === 'fail');
const warnings = checks.filter((c) => c.status === 'warning');
const report = {
  ok: true,
  batch: 'Batch114 — Runtime Dependency Closure Board & Build Blocker Evidence',
  version: policy.version,
  generatedAt: new Date().toISOString(),
  runtimeContext: {
    platform: os.platform(), arch: os.arch(), nodeVersion: process.version, packageVersion: pkg.version,
    nodeVersionFile, packageEngine: pkg.engines?.node || null,
    nextDeclared: pkg.dependencies?.next || null,
    nextLocked: lock.packages?.['node_modules/next']?.version || null,
    platformSwcPackage: swcName,
    platformSwcLockedVersion: swcName ? lock.packages?.[swcPath]?.version || null : null
  },
  metrics: {
    checks: checks.length,
    hardFails: hardFails.length,
    warnings: warnings.length,
    dependencyMismatches: mismatches.length,
    forbiddenDependencyHits: forbidden.length,
    nextBinaryInstalledNow: exists(nextBin),
    platformSwcInstalledNow: Boolean(swcName && exists(swcPath)),
    buildClosureClaimAllowed: hardFails.length === 0 && exists(nextBin) && Boolean(swcName && exists(swcPath)),
    hostedUrlProvided: Boolean(process.env.GIAOAN_DEMO_URL)
  },
  status: hardFails.length === 0 && exists(nextBin) && Boolean(swcName && exists(swcPath)) ? 'dependency_closure_ready_for_build_attempt' : 'dependency_closure_blocked_do_not_claim_build_runtime',
  plainLanguageStatus: 'Báo cáo này ghi rõ blocker dependency/build/runtime. Source-level pass không đồng nghĩa build/runtime/hosted pass.',
  checks,
  hardFailedCheckIds: hardFails.map((c) => c.id),
  warningCheckIds: warnings.map((c) => c.id),
  policy,
  nextCommandsToCloseRuntime: policy.requiredCommandsForRuntimeClosure
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/runtime-dependency-closure-last-run.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
