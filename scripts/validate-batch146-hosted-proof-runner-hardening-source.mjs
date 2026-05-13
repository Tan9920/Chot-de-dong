import fs from 'node:fs';

const issues = [];
const policyPath = 'data/batch146-hosted-proof-runner-hardening-policy.json';
const workflowPath = '.github/workflows/p0-hosted-final-proof.yml';
const packagePath = 'package.json';
const runnerPath = 'scripts/p0-hosted-ci-final-proof-runner.mjs';
const preflightPath = 'scripts/p0-hosted-final-proof-preflight.mjs';
const summaryPath = 'scripts/p0-hosted-final-proof-summary.mjs';
const sourceValidatorPath = 'scripts/run-source-validators.mjs';

function read(file) {
  try { return fs.readFileSync(file, 'utf8'); }
  catch (error) { issues.push(`${file} missing: ${error.message}`); return ''; }
}
function readJson(file) {
  try { return JSON.parse(read(file)); }
  catch (error) { issues.push(`${file} invalid JSON: ${error.message}`); return {}; }
}
function requireIncludes(text, needle, label = needle) {
  if (!text.includes(needle)) issues.push(`missing ${label}`);
}
function requireOrder(text, first, second, label) {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  if (a === -1 || b === -1 || a > b) issues.push(`order violation: ${label}`);
}

const policy = readJson(policyPath);
const workflow = read(workflowPath);
const pkg = readJson(packagePath);
const runner = read(runnerPath);
const preflight = read(preflightPath);
const summary = read(summaryPath);
const sourceValidator = read(sourceValidatorPath);

if (pkg.version !== '0.146.0') issues.push('package.json version must be 0.146.0');
if (!String(pkg.description || '').includes('Batch146')) issues.push('package description must mention Batch146');
if (policy.batch !== 'Batch146 — Hosted Proof Runner Hardening & Evidence Summary') issues.push('policy batch mismatch');
if (policy.version !== '0.146.0') issues.push('policy version must be 0.146.0');
if (policy.publicRolloutAllowed !== false) issues.push('policy publicRolloutAllowed must remain false');
if (policy.productionReady !== false) issues.push('policy productionReady must remain false');
if (policy.claimPolicy?.noAiPaymentVerifiedFakeAdded !== true) issues.push('policy must preserve noAiPaymentVerifiedFakeAdded=true');

for (const script of [
  'p0:hosted-proof-preflight',
  'p0:hosted-proof-preflight:dry',
  'p0:hosted-proof-summary',
  'batch146:hosted-proof-runner-hardening-validate',
  'smoke:batch146',
  'verify:batch146'
]) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}

requireIncludes(workflow, 'npm run p0:hosted-proof-preflight', 'workflow strict preflight command');
requireIncludes(workflow, 'npm run p0:hosted-proof-summary', 'workflow final summary command');
requireIncludes(workflow, 'name: Preflight hosted proof contract', 'workflow preflight step name');
requireIncludes(workflow, 'name: Final hosted proof summary', 'workflow summary step name');
requireIncludes(workflow, 'if: always()', 'workflow keeps post-failure summaries/artifacts');
requireIncludes(workflow, 'artifacts/visual-smoke/**/*.png', 'workflow uploads visual screenshot PNGs');
requireIncludes(workflow, 'artifacts/*.md', 'workflow uploads markdown summaries');
requireOrder(workflow, 'npm run p0:hosted-proof-preflight', 'npm run visual:smoke:evidence-capture', 'preflight must run before visual capture');
requireOrder(workflow, 'npm run p0:hosted-proof-summary', 'Upload P0 hosted proof artifacts', 'summary must run before artifact upload');

requireIncludes(runner, 'p0:hosted-proof-preflight', 'runner calls strict preflight');
requireIncludes(runner, 'p0:hosted-proof-preflight:dry', 'runner supports dry preflight');
requireOrder(runner, 'hosted-proof-preflight', 'source-batch141', 'runner preflight before source validators');

for (const marker of ['GITHUB_ACTIONS', 'GITHUB_RUN_ID', 'RUNNER_OS', 'Node major version is 24', 'hosted_proof_requires_non_localhost_url', 'noAiPaymentVerifiedFakeAdded']) {
  requireIncludes(preflight, marker, `preflight marker ${marker}`);
}
for (const marker of ['GITHUB_STEP_SUMMARY', 'artifacts/visual-smoke', 'hostedProofClosed', 'publicRolloutAllowed', 'productionReady: false', 'No AI added']) {
  requireIncludes(summary, marker, `summary marker ${marker}`);
}
for (const file of [
  policyPath,
  preflightPath,
  summaryPath,
  'docs/BATCH146_HOSTED_PROOF_RUNNER_HARDENING.md',
  'BATCH146_NOTES.md'
]) {
  requireIncludes(sourceValidator, file, `source validator includes ${file}`);
}
for (const file of ['docs/BATCH146_HOSTED_PROOF_RUNNER_HARDENING.md', 'BATCH146_NOTES.md']) {
  if (!fs.existsSync(file)) issues.push(`${file} missing`);
}

const result = {
  ok: issues.length === 0,
  batch: policy.batch || 'Batch146 — Hosted Proof Runner Hardening & Evidence Summary',
  checked: 42,
  issues,
  sourceLevelOnly: true,
  publicRolloutAllowed: false,
  productionReady: false,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This validator hardens hosted proof execution/auditability source-level only. It does not run Vercel, GitHub Actions, APP_URL hosted smoke, or production DB/security/legal review.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
