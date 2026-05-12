import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

function run(cmd, args, options = {}) {
  const started = Date.now();
  const res = spawnSync(cmd, args, { encoding: 'utf8', timeout: options.timeoutMs || 30_000, shell: false });
  return {
    command: [cmd, ...args].join(' '),
    ok: res.status === 0,
    status: res.status,
    signal: res.signal,
    durationMs: Date.now() - started,
    stdout: String(res.stdout || '').slice(0, options.stdoutLimit || 4000),
    stderr: String(res.stderr || '').slice(0, options.stderrLimit || 2000)
  };
}

function parseJsonMaybe(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function exists(p) { return fs.existsSync(p); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function parseVersion(version) {
  const match = String(version || '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}
function isAtLeast(version, floor) {
  const a = parseVersion(version);
  const b = parseVersion(floor);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

const pkg = readJson('package.json');
const lock = exists('package-lock.json') ? fs.readFileSync('package-lock.json', 'utf8') : '';
const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
const platform = os.platform();
const arch = os.arch();
const swcCandidates = [
  `node_modules/@next/swc-${platform}-${arch}-gnu`,
  `node_modules/@next/swc-${platform}-${arch}-musl`,
  `node_modules/@next/swc-${platform}-${arch}-msvc`,
  `node_modules/@next/swc-darwin-${arch}`
];
const blockers = [];
const warnings = [];

const versionMajor = Number(process.versions.node.split('.')[0]);
if (versionMajor < 20) blockers.push({ code: 'node_version_too_old', detail: process.version });
if (!isAtLeast(pkg.version, '0.83.0')) blockers.push({ code: 'unexpected_package_version_floor', detail: pkg.version, expectedAtLeast: '0.83.0' });
if (!lock) blockers.push({ code: 'missing_package_lock' });
if (/packages\.applied-caas-gateway1\.internal\.api\.openai\.org/i.test(lock)) blockers.push({ code: 'lockfile_internal_registry' });
if (/https:\/\/[^/\s"']+:[^@\s"']+@/i.test(lock)) blockers.push({ code: 'lockfile_credentialed_registry' });

const cleanScriptsPresent = Boolean(pkg.scripts?.['install:clean'] && pkg.scripts?.['build:clean'] && pkg.scripts?.['live:smoke:clean']);
const regEnv = process.env.NPM_CONFIG_REGISTRY || process.env.npm_config_registry || '';
if (regEnv && /@/.test(regEnv)) {
  if (cleanScriptsPresent) warnings.push({ code: 'credentialed_registry_env_sanitized_by_clean_scripts', detail: 'NPM_CONFIG_REGISTRY is credentialed/protected in this shell; clean scripts remove it for install/build/smoke.' });
  else blockers.push({ code: 'credentialed_registry_env', detail: 'NPM_CONFIG_REGISTRY is credentialed/protected and clean scripts are missing' });
} else if (regEnv) warnings.push({ code: 'registry_env_present', detail: regEnv });

if (!exists(nextBin)) blockers.push({ code: 'missing_next_binary', detail: nextBin });
if (!swcCandidates.some(exists)) blockers.push({ code: 'missing_next_swc_optional_package', candidates: swcCandidates });
if (!exists('.next')) warnings.push({ code: 'missing_next_build_output', detail: 'Run npm run build:clean before production live smoke.' });

const commands = [];
for (const args of [
  ['node', ['scripts/validate-batch83-route-contract-source.mjs']],
  ['node', ['scripts/assert-artifact-hygiene.mjs']],
  ['node', ['scripts/run-source-validators.mjs']]
]) {
  const result = run(args[0], args[1], { timeoutMs: 30_000 });
  commands.push({ ...result, parsed: parseJsonMaybe(result.stdout) });
  if (!result.ok) blockers.push({ code: 'preflight_subcheck_failed', command: result.command, status: result.status });
}

const ok = blockers.length === 0;
const report = {
  ok,
  package: { name: pkg.name, version: pkg.version, next: pkg.dependencies?.next, react: pkg.dependencies?.react, typescript: pkg.dependencies?.typescript },
  environment: { node: process.version, platform, arch, registryEnvKind: regEnv ? (/@/.test(regEnv) ? 'credentialed_or_protected' : 'plain') : 'absent' },
  dependencyState: { nextBinary: exists(nextBin), swcReady: swcCandidates.some(exists), nextBuildOutput: exists('.next') },
  blockers,
  warnings,
  commands,
  nextSteps: ok
    ? ['Run npm run build:clean', 'Run GIAOAN_SMOKE_MODE=production npm run live:smoke:clean', 'Run browser/mobile QA manually before public test.']
    : ['Fix blockers above first.', 'Usually: npm run lockfile:public-registry && npm run registry:diagnose && npm run install:clean && npm run next:swc-ready.']
};
console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);
