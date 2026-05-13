import fs from 'node:fs';

const issues = [];
const policyPath = 'data/batch147-real-hosted-proof-run-closure-policy.json';
const packagePath = 'package.json';
const dossierPath = 'scripts/p0-hosted-proof-closure-dossier.mjs';
const validatorPath = 'scripts/validate-batch147-real-hosted-proof-run-closure-source.mjs';
const workflowPath = '.github/workflows/p0-hosted-final-proof.yml';
const docsPath = 'docs/BATCH147_REAL_HOSTED_PROOF_RUN_CLOSURE.md';
const notesPath = 'BATCH147_NOTES.md';
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
const pkg = readJson(packagePath);
const dossier = read(dossierPath);
const workflow = read(workflowPath);
const docs = read(docsPath);
const notes = read(notesPath);
const sourceValidator = read(sourceValidatorPath);

if (pkg.version !== '0.147.0') issues.push('package.json version must be 0.147.0');
if (!String(pkg.description || '').includes('Batch147')) issues.push('package description must mention Batch147');
if (policy.batch !== 'Batch147 — Real Hosted Proof Run Closure Kit') issues.push('policy batch mismatch');
if (policy.version !== '0.147.0') issues.push('policy version must be 0.147.0');
if (policy.publicRolloutAllowed !== false) issues.push('policy publicRolloutAllowed must remain false');
if (policy.productionReady !== false) issues.push('policy productionReady must remain false');
if (policy.claimPolicy?.noAiPaymentVerifiedFakeAdded !== true) issues.push('policy must preserve noAiPaymentVerifiedFakeAdded=true');

for (const script of [
  'p0:hosted-proof-closure-dossier',
  'p0:hosted-proof-closure-dossier:strict',
  'batch147:real-hosted-proof-run-closure-validate',
  'smoke:batch147',
  'verify:batch147'
]) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}
for (const marker of [
  'GIAOAN_HOSTED_PROOF_ARTIFACT_ROOT',
  '--artifact-root=',
  'p0-hosted-proof-closure-dossier-last-run.json',
  'p0-hosted-proof-closure-dossier.md',
  'preflight_node24_github_app_url',
  'hosted_ci_runner_all_pass',
  'visual_smoke_evidence_pngs',
  'secretLeakFindings',
  'strict && !hostedProofClosed',
  'productionReady: false',
  'noAiPaymentVerifiedFakeAdded'
]) {
  requireIncludes(dossier, marker, `dossier marker ${marker}`);
}
for (const marker of [
  'Generate Batch147 closure dossier',
  'npm run p0:hosted-proof-closure-dossier',
  'p0-hosted-proof-closure-dossier.md',
  'p0-hosted-proof-closure-dossier-last-run.json'
]) {
  requireIncludes(workflow, marker, `workflow marker ${marker}`);
}
requireOrder(workflow, 'npm run p0:hosted-proof-summary', 'npm run p0:hosted-proof-closure-dossier', 'closure dossier must run after final summary');
requireOrder(workflow, 'npm run p0:hosted-proof-closure-dossier', 'Upload P0 hosted proof artifacts', 'closure dossier must run before artifact upload');
for (const marker of ['GitHub Actions', 'Node24', 'APP_URL', 'artifact-root', 'không claim production-ready']) {
  requireIncludes(docs, marker, `docs marker ${marker}`);
}
for (const marker of ['Batch147', 'hosted proof', 'production-ready', 'Không thêm AI']) {
  requireIncludes(notes, marker, `notes marker ${marker}`);
}
for (const file of [policyPath, dossierPath, validatorPath, docsPath, notesPath]) {
  requireIncludes(sourceValidator, file, `source validator includes ${file}`);
}
for (const script of ['p0:hosted-proof-closure-dossier', 'smoke:batch147', 'verify:batch147']) {
  requireIncludes(sourceValidator, script, `source validator includes script ${script}`);
}

const hardGates = Array.isArray(policy.hardGates) ? policy.hardGates : [];
if (hardGates.filter((gate) => gate.required).length < 6) issues.push('policy must define at least 6 required hard gates');
if (!hardGates.some((gate) => gate.id === 'public_rollout_readiness_optional' && gate.required === false)) issues.push('policy must keep public rollout readiness separate/optional for hosted closure');

const result = {
  ok: issues.length === 0,
  batch: policy.batch || 'Batch147 — Real Hosted Proof Run Closure Kit',
  checked: 64,
  issues,
  sourceLevelOnly: true,
  publicRolloutAllowed: false,
  productionReady: false,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This validator confirms Batch147 closure-kit source wiring only. It does not prove a real Vercel/GitHub Actions hosted run has passed.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
