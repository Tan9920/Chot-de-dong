import fs from 'node:fs';

const issues = [];
const policyPath = 'data/batch145-hosted-proof-artifact-upload-policy.json';
const workflowPath = '.github/workflows/p0-hosted-final-proof.yml';
const packagePath = 'package.json';

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

const policy = readJson(policyPath);
const workflow = read(workflowPath);
const pkg = readJson(packagePath);

if (policy.batch !== 'Batch145 — Hosted Proof Artifact Upload Closure') issues.push('policy batch mismatch');
if (policy.version !== '0.145.0') issues.push('policy version must be 0.145.0');
if (policy.publicRolloutAllowed !== false) issues.push('policy must keep publicRolloutAllowed=false');
if (policy.productionReady !== false) issues.push('policy must keep productionReady=false');
if (policy.claimPolicy?.noAiPaymentVerifiedFakeAdded !== true) issues.push('policy must preserve noAiPaymentVerifiedFakeAdded=true');

requireIncludes(workflow, 'node-version: "24"', 'workflow Node 24 setup');
requireIncludes(workflow, 'APP_URL:', 'workflow APP_URL env');
requireIncludes(workflow, 'GIAOAN_DEMO_URL:', 'workflow GIAOAN_DEMO_URL env');
requireIncludes(workflow, 'GIAOAN_STRICT_HOSTED_CI_PROOF:', 'workflow strict proof env');
requireIncludes(workflow, 'npm run visual:smoke:evidence-capture', 'workflow visual capture command');
requireIncludes(workflow, 'npm run runtime:p0-hosted-ci-proof-runner', 'workflow hosted CI proof runner');
requireIncludes(workflow, 'npm run verify:p0-hosted-ci-proof', 'workflow strict final proof gate');
requireIncludes(workflow, 'npm run p0:hosted-evidence-capture-report', 'workflow capture report');
requireIncludes(workflow, 'npm run p0:hosted-proof-execution-report', 'workflow execution gate report');
for (const uploadPath of policy.workflow?.requiredUploadPaths || []) {
  requireIncludes(workflow, uploadPath, `workflow artifact upload path ${uploadPath}`);
}
requireIncludes(workflow, 'if-no-files-found: warn', 'workflow should warn when expected artifacts are missing');

for (const script of [
  'batch145:hosted-proof-artifact-upload-validate',
  'smoke:batch145',
  'verify:batch145',
  'visual:smoke:evidence-capture',
  'runtime:p0-hosted-ci-proof-runner',
  'verify:p0-hosted-ci-proof'
]) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}

const docs = [
  'BATCH145_NOTES.md',
  'docs/BATCH145_HOSTED_PROOF_ARTIFACT_UPLOAD_CLOSURE.md'
];
for (const file of docs) if (!fs.existsSync(file)) issues.push(`${file} missing`);

const docsText = docs.map((file) => read(file)).join('\n');
for (const forbidden of ['production-ready', '100%', 'chuẩn Bộ']) {
  if (docsText.includes(`claim ${forbidden}`)) issues.push(`docs contain unsafe claim phrase: claim ${forbidden}`);
}

const result = {
  ok: issues.length === 0,
  batch: policy.batch || 'Batch145 — Hosted Proof Artifact Upload Closure',
  checked: 24,
  issues,
  sourceLevelOnly: true,
  publicRolloutAllowed: false,
  productionReady: false,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This validator checks hosted proof artifact upload/auditability source-level only. It does not run Vercel, GitHub Actions, APP_URL hosted smoke, or real production security/legal review.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
