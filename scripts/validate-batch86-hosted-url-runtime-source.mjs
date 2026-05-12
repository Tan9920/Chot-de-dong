import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const script = read('scripts/hosted-demo-url-smoke.mjs');
const validator = read('scripts/validate-batch86-hosted-url-runtime-source.mjs');
const workflow = read('.github/workflows/demo-runtime-verify.yml');
const checklist = read('data/hosted-demo-release-checklist.json');
const gate = read('lib/hosted-demo-launch-gate.ts');
const notes = read('BATCH86_NOTES.md');
const guide = read('docs/BATCH86_HOSTED_RUNTIME_TEST_GUIDE.md');
const readme = read('README.md');

function requireMarker(label, text, marker) {
  if (!text.includes(marker)) issues.push(`${label} missing marker: ${marker}`);
}
function requireNotMarker(label, text, marker) {
  if (text.includes(marker)) issues.push(`${label} contains forbidden marker: ${marker}`);
}

if (!String(pkg.version || "").match(/^0\.(86|87|88|89|90|91|92)\.0$/)) issues.push(`package.json version must be 0.86.0, Batch87-compatible 0.87.0, or Batch88/89-compatible 0.88.0/0.89.0/0.90.0/0.90.0, got ${pkg.version}`);
for (const scriptName of ['hosted:url-smoke', 'hosted:url-smoke:optional', 'hosted:url-smoke-source-validate', 'smoke:batch86', 'verify:batch86']) {
  if (!pkg.scripts?.[scriptName]) issues.push(`package.json missing script ${scriptName}`);
}
for (const file of ['scripts/hosted-demo-url-smoke.mjs', 'scripts/validate-batch86-hosted-url-runtime-source.mjs', 'docs/BATCH86_HOSTED_RUNTIME_TEST_GUIDE.md', 'BATCH86_NOTES.md']) {
  if (!fs.existsSync(file)) issues.push(`missing file: ${file}`);
}

for (const marker of [
  'GIAOAN_DEMO_URL',
  'x-vercel-protection-bypass',
  'VERCEL_AUTOMATION_BYPASS_SECRET',
  '/api/auth/csrf',
  '/api/template-builder',
  '/api/lesson-design/studio',
  '/api/export/docx',
  '/api/export/pdf',
  'application/pdf',
  'wordprocessingml.document',
  'artifacts/hosted-demo-url-smoke-last-run.json',
  '--optional',
  'Không chia link demo rộng nếu hosted:url-smoke chưa pass'
]) requireMarker('scripts/hosted-demo-url-smoke.mjs', script, marker);

for (const marker of [
  'GIAOAN_DEMO_URL',
  'secrets.GIAOAN_DEMO_URL',
  'VERCEL_AUTOMATION_BYPASS_SECRET',
  'Hosted deployed URL smoke',
  'actions/upload-artifact@v4',
  'npm run smoke:batch86',
  'npm run verify:batch86'
]) requireMarker('.github/workflows/demo-runtime-verify.yml', workflow, marker);

for (const marker of [
  'batch86-hosted-url-runtime-smoke',
  'hosted_url_smoke_contract',
  'scripts/hosted-demo-url-smoke.mjs',
  'hosted:url-smoke',
  'GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke'
]) requireMarker('data/hosted-demo-release-checklist.json', checklist, marker);

for (const marker of [
  'hosted_url_smoke_runtime_state',
  'artifacts/hosted-demo-url-smoke-last-run.json',
  'npm run hosted:url-smoke'
]) requireMarker('lib/hosted-demo-launch-gate.ts', gate, marker);

for (const marker of [
  'Batch86',
  'Hosted URL Runtime Smoke',
  'GIAOAN_DEMO_URL',
  'không chứng minh production-ready',
  'không thêm AI'
]) requireMarker('BATCH86_NOTES.md', notes, marker);

for (const marker of [
  'BATCH86 HOSTED RUNTIME TEST GUIDE',
  'GIAOAN_DEMO_URL=https://',
  'VERCEL_AUTOMATION_BYPASS_SECRET',
  'không chia link rộng'
]) requireMarker('docs/BATCH86_HOSTED_RUNTIME_TEST_GUIDE.md', guide, marker);

requireMarker('README.md', readme, 'Batch86');
requireMarker('README.md', readme, 'hosted:url-smoke');
requireNotMarker('package.json', JSON.stringify(pkg), 'openai');
requireNotMarker('package.json', JSON.stringify(pkg), '@google/generative-ai');
requireNotMarker('package.json', JSON.stringify(pkg), '@anthropic-ai/sdk');
requireMarker('self validator', validator, 'hosted_url_smoke_runtime_state');

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    next: pkg.dependencies?.next,
    react: pkg.dependencies?.react,
    scripts: ['hosted:url-smoke', 'hosted:url-smoke:optional', 'smoke:batch86', 'verify:batch86']
  },
  note: 'Batch86 source validator checks hosted URL smoke wiring only. It does not prove a real Vercel URL passed; run GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke after deployment.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
