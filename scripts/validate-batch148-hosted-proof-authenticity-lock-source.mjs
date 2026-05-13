import fs from 'node:fs';

const issues = [];
const paths = {
  policy: 'data/batch148-hosted-proof-authenticity-lock-policy.json',
  package: 'package.json',
  lockScript: 'scripts/p0-hosted-proof-authenticity-lock.mjs',
  validator: 'scripts/validate-batch148-hosted-proof-authenticity-lock-source.mjs',
  workflow: '.github/workflows/p0-hosted-final-proof.yml',
  docs: 'docs/BATCH148_HOSTED_PROOF_AUTHENTICITY_LOCK.md',
  notes: 'BATCH148_NOTES.md',
  sourceValidator: 'scripts/run-source-validators.mjs',
  readme: 'README.md'
};
function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch (error) { issues.push(`${file} missing: ${error.message}`); return ''; } }
function json(file) { try { return JSON.parse(read(file)); } catch (error) { issues.push(`${file} invalid JSON: ${error.message}`); return {}; } }
function include(text, marker, label = marker) { if (!text.includes(marker)) issues.push(`missing ${label}`); }
function order(text, first, second, label) { const a = text.indexOf(first), b = text.indexOf(second); if (a === -1 || b === -1 || a > b) issues.push(`order violation: ${label}`); }
const policy = json(paths.policy);
const pkg = json(paths.package);
const lockScript = read(paths.lockScript);
const workflow = read(paths.workflow);
const docs = read(paths.docs);
const notes = read(paths.notes);
const sourceValidator = read(paths.sourceValidator);
const readme = read(paths.readme);

if (pkg.version !== '0.148.0') issues.push('package.json version must be 0.148.0');
if (!String(pkg.description || '').includes('Batch148')) issues.push('package description must mention Batch148');
if (policy.batch !== 'Batch148 — Hosted Proof Evidence Authenticity Lock') issues.push('policy batch mismatch');
if (policy.version !== '0.148.0') issues.push('policy version must be 0.148.0');
if (policy.publicRolloutAllowed !== false) issues.push('policy publicRolloutAllowed must remain false');
if (policy.productionReady !== false) issues.push('policy productionReady must remain false');
if (policy.claimPolicy?.noAiPaymentVerifiedFakeAdded !== true) issues.push('policy must preserve noAiPaymentVerifiedFakeAdded=true');
if (!Array.isArray(policy.requiredJsonArtifacts) || policy.requiredJsonArtifacts.length < 8) issues.push('policy must define at least 8 required JSON artifacts');
if (!Array.isArray(policy.requiredViewports) || policy.requiredViewports.length < 6) issues.push('policy must require 6 viewport screenshots');

for (const script of [
  'p0:hosted-proof-authenticity-lock',
  'p0:hosted-proof-authenticity-lock:strict',
  'batch148:hosted-proof-authenticity-lock-validate',
  'smoke:batch148',
  'verify:batch148'
]) if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);

for (const marker of [
  'GIAOAN_HOSTED_PROOF_ARTIFACT_ROOT',
  'GIAOAN_HOSTED_PROOF_AUTHENTICITY_STRICT',
  '--artifact-root=',
  'sha256File',
  'timestampSpreadMinutes',
  'maxTimestampSpreadMinutes',
  'runIdentity',
  'mixed_app_origins',
  'required_screenshot_png_inventory_incomplete',
  'p0-hosted-proof-authenticity-lock-last-run.json',
  'p0-hosted-proof-authenticity-lock.md',
  'strict && !authenticityLocked',
  'productionReady: false',
  'noAiPaymentVerifiedFakeAdded'
]) include(lockScript, marker, `lock script marker ${marker}`);

for (const marker of [
  'Generate Batch148 authenticity lock',
  'npm run p0:hosted-proof-authenticity-lock',
  'p0-hosted-proof-authenticity-lock-last-run.json',
  'p0-hosted-proof-authenticity-lock.md'
]) include(workflow, marker, `workflow marker ${marker}`);
order(workflow, 'npm run p0:hosted-proof-closure-dossier', 'npm run p0:hosted-proof-authenticity-lock', 'authenticity lock must run after closure dossier');
order(workflow, 'npm run p0:hosted-proof-authenticity-lock', 'Upload P0 hosted proof artifacts', 'authenticity lock must run before artifact upload');

for (const marker of ['Batch148', 'anti-stale', 'sha256', 'GitHub Actions', 'Node24', 'APP_URL', 'không claim production-ready']) include(docs, marker, `docs marker ${marker}`);
for (const marker of ['Batch148', 'authenticity', 'stale', 'mixed-run', 'Không thêm AI']) include(notes, marker, `notes marker ${marker}`);
for (const marker of ['Batch148', '0.148.0', 'p0:hosted-proof-authenticity-lock']) include(readme, marker, `README marker ${marker}`);
for (const file of [paths.policy, paths.lockScript, paths.validator, paths.docs, paths.notes]) include(sourceValidator, file, `source validator includes ${file}`);
for (const script of ['p0:hosted-proof-authenticity-lock', 'smoke:batch148', 'verify:batch148']) include(sourceValidator, script, `source validator includes script ${script}`);
for (const marker of ['Hosted Proof Evidence Authenticity Lock', 'mixed_app_origins', 'timestampSpreadMinutes']) include(sourceValidator, marker, `source validator marker ${marker}`);

const result = {
  ok: issues.length === 0,
  batch: policy.batch || 'Batch148 — Hosted Proof Evidence Authenticity Lock',
  checked: 78,
  issues,
  sourceLevelOnly: true,
  publicRolloutAllowed: false,
  productionReady: false,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This validator confirms Batch148 source wiring only. It does not prove a real Vercel/GitHub Actions hosted run has passed.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
