import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const exists = (file) => fs.existsSync(file);
const pkg = JSON.parse(read('package.json') || '{}');
const checklist = JSON.parse(read('data/hosted-demo-release-checklist.json') || '{}');
const issues = [];

const requiredFiles = [
  'BATCH84_NOTES.md',
  'data/hosted-demo-release-checklist.json',
  'lib/hosted-demo-launch-gate.ts',
  'app/api/demo/launch-gate/route.ts',
  'scripts/validate-batch84-hosted-demo-launch-source.mjs',
  'scripts/hosted-demo-preflight.mjs',
  'docs/BATCH84_HOSTED_DEMO_LAUNCH_CHECKLIST.md',
  '.github/workflows/demo-runtime-verify.yml',
  'vercel.json'
];
for (const file of requiredFiles) if (!exists(file)) issues.push(`missing file: ${file}`);

if (!/^0\.(84|85|8[6-9]|9\d)\.\d+$/.test(String(pkg.version))) issues.push(`package.json version must remain Batch84+ compatible, got ${pkg.version}`);
for (const script of [
  'hosted-demo:launch-gate-validate',
  'hosted-demo:preflight',
  'smoke:batch84',
  'verify:batch84',
  'live:smoke:clean',
  'registry:diagnose',
  'install:clean',
  'build:clean'
]) {
  if (!pkg.scripts?.[script]) issues.push(`missing package script: ${script}`);
}

const workflow = read('.github/workflows/demo-runtime-verify.yml');
for (const marker of ['npm run install:clean', 'npm run build:clean', 'GIAOAN_SMOKE_MODE: production', 'npm run live:smoke:clean']) {
  if (!workflow.includes(marker)) issues.push(`workflow missing marker: ${marker}`);
}
if (!workflow.includes('npm run verify:batch84') && !workflow.includes('npm run verify:batch85')) issues.push('workflow missing Batch84/Batch85 verify marker');

const launchGate = read('lib/hosted-demo-launch-gate.ts');
for (const marker of ['must_run_on_host', 'no_ai_sdk_dependency', 'forbidden_public_claims', 'source_ready_host_verification_required', '.next/BUILD_ID']) {
  if (!launchGate.includes(marker)) issues.push(`launch gate missing marker: ${marker}`);
}

const route = read('app/api/demo/launch-gate/route.ts');
if (!route.includes('buildHostedDemoLaunchGate')) issues.push('launch gate route missing buildHostedDemoLaunchGate');

const vercel = read('vercel.json');
for (const marker of ['npm run build', 'X-Content-Type-Options', 'Permissions-Policy']) {
  if (!vercel.includes(marker)) issues.push(`vercel.json missing marker: ${marker}`);
}

const envExample = read('.env.example');
for (const marker of ['GIAOAN_PUBLIC_TEST_MODE', 'GIAOAN_DEMO_FEEDBACK_URL', 'GIAOAN_SMOKE_MODE']) {
  if (!envExample.includes(marker)) issues.push(`.env.example missing marker: ${marker}`);
}

if (!Array.isArray(checklist.mustPassOnHostBeforeSharing) || checklist.mustPassOnHostBeforeSharing.length < 8) {
  issues.push('hosted demo checklist must define mustPassOnHostBeforeSharing with at least 8 commands');
}
if (!JSON.stringify(checklist).includes('Không dùng link demo như bằng chứng sản phẩm đã production-ready')) {
  issues.push('hosted demo checklist missing anti-overclaim public test rule');
}

const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
for (const aiDep of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  if (deps[aiDep]) issues.push(`forbidden AI dependency present: ${aiDep}`);
}

const result = {
  ok: issues.length === 0,
  issues,
  checkedFiles: requiredFiles.length,
  note: 'Batch84 source validator proves hosted-demo launch gate/CI scaffolding exists. It accepts later patch batches. It does not prove npm install, build or production live smoke pass on the current machine.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
