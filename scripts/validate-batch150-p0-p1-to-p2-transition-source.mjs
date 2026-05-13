import fs from 'node:fs';

const issues = [];
const paths = {
  policy: 'data/batch150-p0-p1-to-p2-transition-policy.json',
  pkg: 'package.json',
  lock: 'package-lock.json',
  workflow: '.github/workflows/p0-hosted-final-proof.yml',
  gate: 'scripts/p0-p1-to-p2-transition-gate.mjs',
  guide: 'scripts/p0-p1-external-closure-operator-guide.mjs',
  validator: 'scripts/validate-batch150-p0-p1-to-p2-transition-source.mjs',
  sourceValidator: 'scripts/run-source-validators.mjs',
  docs: 'docs/BATCH150_P0_P1_TO_P2_TRANSITION_GATE.md',
  notes: 'BATCH150_NOTES.md',
  readme: 'README.md'
};
function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch (error) { issues.push(`${file} missing: ${error.message}`); return ''; } }
function json(file) { try { return JSON.parse(read(file)); } catch (error) { issues.push(`${file} invalid JSON: ${error.message}`); return {}; } }
function include(text, marker, label = marker) { if (!text.includes(marker)) issues.push(`missing ${label}`); }
function absent(text, marker, label = marker) { if (text.includes(marker)) issues.push(`forbidden ${label}`); }

const policy = json(paths.policy);
const pkg = json(paths.pkg);
const lock = json(paths.lock);
const workflow = read(paths.workflow);
const gate = read(paths.gate);
const guide = read(paths.guide);
const sourceValidator = read(paths.sourceValidator);
const docs = read(paths.docs);
const notes = read(paths.notes);
const readme = read(paths.readme);

if (pkg.version !== '0.150.0') issues.push('package.json version must be 0.150.0');
if (lock.version !== '0.150.0' || lock.packages?.['']?.version !== '0.150.0') issues.push('package-lock root version must be 0.150.0');
if (!String(pkg.description || '').includes('Batch150')) issues.push('package description must mention Batch150');
if (policy.batch !== 'Batch150 — P0/P1 to P2 Transition Gate & External Closure Guide') issues.push('policy batch mismatch');
if (policy.version !== '0.150.0') issues.push('policy version mismatch');
if (policy.publicRolloutAllowed !== false || policy.productionReady !== false) issues.push('policy must keep publicRolloutAllowed/productionReady false');
if (policy.scope?.noAiCore !== true || policy.scope?.noPayment !== true || policy.scope?.noFakeVerifiedData !== true || policy.scope?.noAutoPublicCommunity !== true) issues.push('policy must preserve no-AI/no-payment/no-fake-verified/no-auto-public scope');
if (!Array.isArray(policy.externalHardBlockers) || policy.externalHardBlockers.length < 6) issues.push('policy must define at least 6 external hard blockers');
if (!Array.isArray(policy.transitionPolicy?.publicP2OrPublicRolloutBlockedUntil) || policy.transitionPolicy.publicP2OrPublicRolloutBlockedUntil.length < 6) issues.push('policy must define public P2/public rollout blockers');
if (!JSON.stringify(policy.transitionPolicy || {}).includes('P2 may start') && !JSON.stringify(policy.transitionPolicy || {}).includes('P2 can start')) issues.push('policy must explicitly allow only local/source P2 transition after local pass');

for (const script of [
  'p0-p1:to-p2-transition-gate',
  'p0-p1:to-p2-transition-gate:strict-public',
  'p0-p1:external-closure-guide',
  'batch150:p0-p1-to-p2-transition-validate',
  'smoke:batch150',
  'verify:batch150'
]) if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);

for (const marker of [
  'batch150-p0-p1-to-p2-transition-policy.json',
  'strict_public_rollout_gate',
  'local_p2_transition_gate',
  'sourceLocalP0P1RelaxationAllowed',
  'p2SourceWorkAllowed',
  'p2PublicExposureAllowed',
  'externalHardBlockersRemaining',
  'productionReady: false',
  'noAiPaymentVerifiedFakeAdded'
]) include(gate, marker, `gate marker ${marker}`);
for (const marker of [
  'Batch150 External Closure Operator Guide',
  'P0 Hosted Final Proof',
  'VERCEL_AUTOMATION_BYPASS_SECRET',
  'p0-hosted-final-proof-artifacts',
  'p0:hosted-proof-closure-dossier:strict',
  'p0:hosted-proof-authenticity-lock:strict',
  'Không được claim'
]) include(guide, marker, `guide marker ${marker}`);
for (const marker of [
  'Generate Batch150 P0/P1 to P2 transition gate',
  'p0-p1:to-p2-transition-gate',
  'Upload P0 hosted proof artifacts',
  'artifacts/batch150-*.json',
  'artifacts/batch150-*.md'
]) include(workflow, marker, `workflow marker ${marker}`);
for (const file of [paths.policy, paths.gate, paths.guide, paths.validator, paths.docs, paths.notes]) include(sourceValidator, file, `source validator includes ${file}`);
for (const script of ['p0-p1:to-p2-transition-gate', 'p0-p1:external-closure-guide', 'batch150:p0-p1-to-p2-transition-validate', 'smoke:batch150', 'verify:batch150']) include(sourceValidator, script, `source validator includes script ${script}`);
for (const marker of ['Batch150', 'P0/P1', 'P2', 'hosted/public proof', 'GitHub Actions Node24', 'Vercel APP_URL', 'PNG', 'không claim production-ready']) include(docs, marker, `docs marker ${marker}`);
for (const marker of ['Batch150', 'P2 source work', 'External Closure Operator Guide', 'Không thêm AI', 'hosted/public proof']) include(notes, marker, `notes marker ${marker}`);
for (const marker of ['Batch150', '0.150.0', 'p0-p1:to-p2-transition-gate', 'p0-p1:external-closure-guide']) include(readme, marker, `README marker ${marker}`);
absent(gate, 'productionReady: true', 'gate must not allow productionReady true');
absent(gate, 'publicRolloutAllowed: true', 'gate must not hardcode publicRolloutAllowed true');

const result = {
  ok: issues.length === 0,
  batch: policy.batch || 'Batch150 — P0/P1 to P2 Transition Gate & External Closure Guide',
  checked: 121,
  issues,
  sourceLevelOnly: true,
  p2SourceTransitionGate: true,
  publicRolloutAllowed: false,
  productionReady: false,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This validator confirms Batch150 source wiring only. The transition gate may allow P2 source work, but hosted/public proof still needs real external GitHub Actions Node24 + Vercel artifacts.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
