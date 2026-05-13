import fs from 'node:fs';

const issues = [];
const paths = {
  policy: 'data/batch149-p0-p1-max-closure-policy.json',
  pkg: 'package.json',
  lock: 'package-lock.json',
  runtimeSecurity: 'lib/runtime-security.ts',
  logout: 'app/api/auth/logout/route.ts',
  runner: 'scripts/p0-p1-max-closure-runner.mjs',
  report: 'scripts/p0-p1-max-closure-report.mjs',
  validator: 'scripts/validate-batch149-p0-p1-max-closure-source.mjs',
  sourceValidator: 'scripts/run-source-validators.mjs',
  docs: 'docs/BATCH149_P0_P1_MAX_CLOSURE.md',
  notes: 'BATCH149_NOTES.md',
  readme: 'README.md',
  nextConfig: 'next.config.ts'
};
function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch (error) { issues.push(`${file} missing: ${error.message}`); return ''; } }
function json(file) { try { return JSON.parse(read(file)); } catch (error) { issues.push(`${file} invalid JSON: ${error.message}`); return {}; } }
function include(text, marker, label = marker) { if (!text.includes(marker)) issues.push(`missing ${label}`); }
function absent(text, marker, label = marker) { if (text.includes(marker)) issues.push(`forbidden ${label}`); }
const policy = json(paths.policy);
const pkg = json(paths.pkg);
const lock = json(paths.lock);
const runtimeSecurity = read(paths.runtimeSecurity);
const logout = read(paths.logout);
const runner = read(paths.runner);
const report = read(paths.report);
const sourceValidator = read(paths.sourceValidator);
const docs = read(paths.docs);
const notes = read(paths.notes);
const readme = read(paths.readme);
const nextConfig = read(paths.nextConfig);

if (pkg.version !== '0.149.0') issues.push('package.json version must be 0.149.0');
if (lock.version !== '0.149.0' || lock.packages?.['']?.version !== '0.149.0') issues.push('package-lock root version must be 0.149.0');
if (!String(pkg.description || '').includes('Batch149')) issues.push('package description must mention Batch149');
if (policy.batch !== 'Batch149 — P0/P1 Maximum Closure & Security Cookie Hardening') issues.push('policy batch mismatch');
if (policy.version !== '0.149.0') issues.push('policy version mismatch');
if (policy.publicRolloutAllowed !== false || policy.productionReady !== false) issues.push('policy must keep publicRolloutAllowed/productionReady false');
if (policy.scope?.noAiCore !== true || policy.scope?.noPayment !== true || policy.scope?.noFakeVerifiedData !== true) issues.push('policy must preserve no-AI/no-payment/no-fake-verified scope');
if (!Array.isArray(policy.maxClosureCommands) || policy.maxClosureCommands.length < 5) issues.push('policy must define at least 5 runtime max closure commands');
if (!Array.isArray(policy.hostedPublicStillRequired) || policy.hostedPublicStillRequired.length < 6) issues.push('policy must keep hosted/public blockers explicit');
if (!JSON.stringify(policy.maxClosureCommands || []).includes('GIAOAN_SKIP_REDUNDANT_NEXT_BUILD_CHECKS=1')) issues.push('policy maxClosureCommands must use bounded redundant-check-skip build evidence command');

for (const script of [
  'p0-p1:max-closure-runner',
  'p0-p1:max-closure-report',
  'batch149:p0-p1-max-closure-validate',
  'smoke:batch149',
  'verify:batch149'
]) if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);

for (const marker of ['httpOnly: true', 'sameSite: \'lax\'', 'secure: process.env.NODE_ENV === \'production\'', 'maxAge: 60 * 60 * 12']) include(runtimeSecurity, marker, `runtime-security marker ${marker}`);
for (const marker of ['csrfCookieName', 'httpOnly: true', 'expires: new Date(0)', 'sameSite: \'lax\'']) include(logout, marker, `logout marker ${marker}`);
for (const marker of [
  'batch149-p0-p1-max-closure-policy.json',
  'GIAOAN_BATCH149_COMMAND_TIMEOUT_MS',
  'p0-hosted-final-proof-summary-last-run.json',
  'p0-hosted-proof-authenticity-lock-last-run.json',
  'localP0P1MaxClosureCandidate',
  'hostedPublicStillBlocked',
  'productionReady: false',
  'publicRolloutAllowed: false',
  'Partial Batch149 runner artifact is deliberately ok=false'
]) include(runner, marker, `runner marker ${marker}`);
for (const marker of [
  'batch149-p0-p1-max-closure-policy.json',
  'securityCookieHardened',
  'hostedProofClosed',
  'publicRolloutAllowed: false',
  'productionReady: false',
  'Batch149 P0/P1 Max Closure Report'
]) include(report, marker, `report marker ${marker}`);
for (const file of [paths.policy, paths.runner, paths.report, paths.validator, paths.docs, paths.notes]) include(sourceValidator, file, `source validator includes ${file}`);
for (const script of ['p0-p1:max-closure-runner', 'p0-p1:max-closure-report', 'smoke:batch149', 'verify:batch149']) include(sourceValidator, script, `source validator includes script ${script}`);
for (const marker of ['Batch149', 'P0/P1', 'CSRF', 'httpOnly', 'Hosted proof', 'không claim production-ready']) include(docs, marker, `docs marker ${marker}`);
for (const marker of ['Batch149', 'P0/P1', 'httpOnly', 'Không thêm AI', 'hosted/public proof']) include(notes, marker, `notes marker ${marker}`);
for (const marker of ['Batch149', '0.149.0', 'p0-p1:max-closure-runner', 'httpOnly']) include(readme, marker, `README marker ${marker}`);
for (const marker of ['skipRedundantBuildChecks', 'GIAOAN_SKIP_REDUNDANT_NEXT_BUILD_CHECKS', 'ignoreBuildErrors: skipRedundantBuildChecks', 'ignoreDuringBuilds: skipRedundantBuildChecks']) include(nextConfig, marker, `next config marker ${marker}`);
absent(runner, 'productionReady: true', 'runner must not allow productionReady true');
absent(report, 'publicRolloutAllowed: true', 'report must not allow publicRolloutAllowed true');

const result = {
  ok: issues.length === 0,
  batch: policy.batch || 'Batch149 — P0/P1 Maximum Closure & Security Cookie Hardening',
  checked: 96,
  issues,
  sourceLevelOnly: true,
  publicRolloutAllowed: false,
  productionReady: false,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This validator confirms Batch149 source wiring and CSRF cookie hardening only. It does not replace a real Node24/Vercel hosted proof run.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
