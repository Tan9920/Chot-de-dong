import fs from 'node:fs';
import path from 'node:path';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function json(file) { return JSON.parse(read(file)); }
function exists(file) { return fs.existsSync(file); }
function check(id, status, evidence, impact, nextAction) { return { id, status, evidence, impact, nextAction }; }
function hasAll(text, markers) { return markers.every((marker) => text.includes(marker)); }

const policy = json('data/runtime-build-stability-policy.json');
const pkg = json('package.json');
const lock = json('package-lock.json');
const nextConfig = exists('next.config.ts') ? read('next.config.ts') : '';
const page = exists('app/page.tsx') ? read('app/page.tsx') : '';
const hostedUrlProvided = Boolean(process.env.GIAOAN_DEMO_URL);
const nodeModulesExists = exists('node_modules');
const nextBuildOutputExists = exists('.next');

const nextConfigMarkers = ['ignoreBuildErrors: true', 'cpus: 1', 'workerThreads: false', 'staticGenerationRetryCount: 0', 'staticGenerationMaxConcurrency: 1'];
const pageMarkers = ["dynamic = 'force-dynamic'", 'revalidate = 0', "fetchCache = 'force-no-store'"];
const forbiddenDeps = ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'langchain', 'ai'];
const depNames = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
const forbiddenHits = depNames.filter((name) => forbiddenDeps.some((forbidden) => name.toLowerCase() === forbidden || name.toLowerCase().startsWith(`${forbidden}/`)));

const checks = [
  check('package_version_at_least_batch115', ['0.115.0','0.116.0'].includes(pkg.version) ? 'pass' : 'fail', `package=${pkg.version}`, 'Later batches may advance package version, but Batch115 source markers must remain.', 'Keep Batch115 markers while allowing newer package versions.'),
  check('package_lock_root_version_matches', lock.packages?.['']?.version === pkg.version ? 'pass' : 'fail', `package=${pkg.version}; lockRoot=${lock.packages?.['']?.version || 'missing'}`, 'npm ci/audit can hide stale root metadata if lock root differs.', 'Update package-lock root version.'),
  check('runtime_build_stability_policy_exists', exists('data/runtime-build-stability-policy.json') ? 'pass' : 'fail', exists('data/runtime-build-stability-policy.json') ? 'present' : 'missing', 'The build stability gate needs a durable policy.', 'Restore policy JSON.'),
  check('next_config_low_worker_guard', hasAll(nextConfig, nextConfigMarkers) ? 'pass' : 'fail', nextConfigMarkers.filter((marker) => nextConfig.includes(marker)).join(', ') || 'markers missing', 'Next build timed out while collecting page data; separate typecheck plus constrained workers reduce risk in low-resource CI.', 'Keep experimental.cpus=1, workerThreads=false, and static generation concurrency limits.'),
  check('home_page_dynamic_guard', hasAll(page, pageMarkers) ? 'pass' : 'fail', pageMarkers.filter((marker) => page.includes(marker)).join(', ') || 'markers missing', 'The demo shell should not rely on static prerender proof before runtime smoke.', 'Keep force-dynamic, revalidate=0, and force-no-store on app/page.tsx.'),
  check('no_forbidden_ai_dependencies', forbiddenHits.length === 0 ? 'pass' : 'fail', forbiddenHits.length ? forbiddenHits.join(', ') : 'none', 'No-AI stage must not quietly add model dependencies.', 'Remove forbidden AI/model dependencies.'),
  check('node_modules_not_for_final_zip', nodeModulesExists ? 'warning' : 'pass', nodeModulesExists ? 'node_modules exists locally from verification; must be removed before ZIP' : 'node_modules absent', 'node_modules is allowed locally but must not ship in final artifact.', 'Remove node_modules before zipping.'),
  check('next_build_output_not_for_final_zip', nextBuildOutputExists ? 'warning' : 'pass', nextBuildOutputExists ? '.next exists locally from build attempt; must be removed before ZIP' : '.next absent', '.next is allowed locally but must not ship in final artifact.', 'Remove .next before zipping.'),
  check('hosted_url_required_for_hosted_claim', hostedUrlProvided ? 'pass' : 'warning', hostedUrlProvided ? 'GIAOAN_DEMO_URL set' : 'GIAOAN_DEMO_URL missing', 'Hosted proof requires a real URL smoke test.', 'Set GIAOAN_DEMO_URL and run hosted:url-smoke.')
];
const hardFails = checks.filter((item) => item.status === 'fail');
const warnings = checks.filter((item) => item.status === 'warning');
const report = {
  ok: hardFails.length === 0,
  batch: policy.batch,
  version: pkg.version,
  generatedAt: new Date().toISOString(),
  runtimeContext: {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    packageVersion: pkg.version,
    nextDeclared: pkg.dependencies?.next || 'missing',
    nextLocked: lock.packages?.['node_modules/next']?.version || 'missing',
    hostedUrlProvided
  },
  metrics: {
    checks: checks.length,
    hardFails: hardFails.length,
    warnings: warnings.length,
    forbiddenDependencyHits: forbiddenHits.length,
    buildClosureClaimAllowed: false,
    hostedUrlProvided
  },
  status: hardFails.length ? 'build_stability_source_blocked' : 'build_stability_source_ready_for_build_attempt',
  plainLanguageStatus: 'Source-level guardrails are present, but build/runtime/hosted readiness still requires real clean build/live/auth/hosted smoke commands to exit 0.',
  checks,
  hardFailedCheckIds: hardFails.map((item) => item.id),
  warningCheckIds: warnings.map((item) => item.id),
  policy,
  nextCommandsToCloseBuildRuntime: policy.requiredCommandsForBuildClosure
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync(path.join('artifacts', 'runtime-build-stability-last-run.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
